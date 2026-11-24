/**
 * Ranked-run bookkeeping on the server: hand out seeds, accept a move list
 * once, replay it, and serve the verified board. Database access is passed
 * in, so this runs the same against Neon, PGLite and the tests.
 */

import { createHash, randomBytes, randomInt } from "node:crypto";
import { RANKED_LIMITS, cleanNick, isMoveList, replayRun } from "./ranked.ts";

/** The slice of the database helper this needs (see src/lib/db.ts). */
export type RankedSql = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

export type RankedCaller = {
  /** The player's id from their cookie, if they have one. */
  playerId: string | null;
  /** Caller's network address (only a hash is stored). */
  ip: string;
  now?: Date;
};

export type StartResult =
  | { ok: true; runId: string; seed: number; playerId: string; newPlayer: boolean }
  | { ok: false; error: "rate_limited" | "unavailable" };

export type SubmitResult =
  | { ok: true; score: number; lines: number; moves: number; rank: number; best: boolean }
  | { ok: false; error: "not_found" | "not_yours" | "already_submitted" | "expired" | "bad_moves" | "illegal_move" | "unavailable"; detail?: string };

export type BoardRow = { rank: number; name: string; score: number; lines: number; me: boolean };

const ID_RE = /^[A-Za-z0-9_-]{20,64}$/;

function newId(): string {
  return randomBytes(18).toString("base64url");
}

function ipHash(ip: string): string {
  // Salted per day so the stored value can't be turned back into an address.
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`bj:${day}:${ip}`).digest("base64url").slice(0, 22);
}

async function ensurePlayer(sql: RankedSql, id: string | null): Promise<{ id: string; created: boolean }> {
  if (id && ID_RE.test(id)) {
    const rows = await sql.query<{ id: string }>("select id from bj_players where id = $1", [id]);
    if (rows.length) return { id, created: false };
  }
  const fresh = newId();
  await sql.query("insert into bj_players (id) values ($1)", [fresh]);
  return { id: fresh, created: true };
}

export async function startRun(sql: RankedSql, caller: RankedCaller): Promise<StartResult> {
  const now = caller.now ?? new Date();
  const player = await ensurePlayer(sql, caller.playerId);
  const hourAgo = new Date(now.getTime() - 3600_000);
  const ip = ipHash(caller.ip);
  const [mine] = await sql.query<{ n: number }>("select count(*)::int as n from bj_runs where player_id = $1 and issued_at > $2", [player.id, hourAgo]);
  const [fromIp] = await sql.query<{ n: number }>("select count(*)::int as n from bj_runs where ip_hash = $1 and issued_at > $2", [ip, hourAgo]);
  if ((mine?.n ?? 0) >= RANKED_LIMITS.startsPerHour || (fromIp?.n ?? 0) >= RANKED_LIMITS.startsPerIpHour) {
    return { ok: false, error: "rate_limited" };
  }
  const runId = newId();
  const seed = randomInt(0, 2 ** 31 - 1);
  await sql.query("insert into bj_runs (id, player_id, seed, ip_hash, issued_at) values ($1, $2, $3, $4, $5)", [runId, player.id, seed, ip, now]);
  return { ok: true, runId, seed, playerId: player.id, newPlayer: player.created };
}

export async function submitRun(sql: RankedSql, caller: RankedCaller, runId: unknown, moves: unknown): Promise<SubmitResult> {
  const now = caller.now ?? new Date();
  if (typeof runId !== "string" || !ID_RE.test(runId)) return { ok: false, error: "not_found" };
  if (!isMoveList(moves)) return { ok: false, error: "bad_moves" };
  const rows = await sql.query<{ player_id: string; seed: string | number; status: string; issued_at: string | Date }>(
    "select player_id, seed, status, issued_at from bj_runs where id = $1",
    [runId],
  );
  const run = rows[0];
  if (!run) return { ok: false, error: "not_found" };
  if (!caller.playerId || run.player_id !== caller.playerId) return { ok: false, error: "not_yours" };
  if (run.status !== "open") return { ok: false, error: "already_submitted" };
  if (now.getTime() - new Date(run.issued_at).getTime() > RANKED_LIMITS.maxRunMs) {
    await sql.query("update bj_runs set status = 'expired' where id = $1 and status = 'open'", [runId]);
    return { ok: false, error: "expired" };
  }
  const replay = replayRun(Number(run.seed), moves);
  if (!replay.ok) {
    // One try per seed: a run that doesn't replay is closed for good.
    await sql.query("update bj_runs set status = 'rejected', finished_at = $2 where id = $1 and status = 'open'", [runId, now]);
    return { ok: false, error: replay.error === "illegal move" || replay.error === "move after game over" ? "illegal_move" : "bad_moves", detail: `${replay.error} at move ${replay.atMove + 1}` };
  }
  // Close the run atomically: a second submission (or a race) finds it closed.
  const closed = await sql.query<{ id: string }>(
    "update bj_runs set status = 'verified', finished_at = $2, score = $3, lines = $4, moves = $5, best_combo = $6 where id = $1 and status = 'open' returning id",
    [runId, now, replay.score, replay.lines, replay.moves, replay.bestCombo],
  );
  if (!closed.length) return { ok: false, error: "already_submitted" };
  const [better] = await sql.query<{ n: number }>(
    "select count(*)::int as n from (select player_id, max(score) as s from bj_runs where status = 'verified' group by player_id) b where b.s > $1",
    [replay.score],
  );
  const [prev] = await sql.query<{ s: number | null }>(
    "select max(score) as s from bj_runs where status = 'verified' and player_id = $1 and id <> $2",
    [caller.playerId, runId],
  );
  return { ok: true, score: replay.score, lines: replay.lines, moves: replay.moves, rank: (better?.n ?? 0) + 1, best: replay.score > (prev?.s ?? -1) };
}

/** Best verified score per player, highest first. */
export async function verifiedBoard(sql: RankedSql, playerId: string | null, limit = 20): Promise<BoardRow[]> {
  const rows = await sql.query<{ player_id: string; nick: string | null; score: number; lines: number }>(
    `select distinct on (r.player_id) r.player_id, p.nick, r.score, r.lines
       from bj_runs r join bj_players p on p.id = r.player_id
      where r.status = 'verified'
      order by r.player_id, r.score desc, r.finished_at asc`,
  );
  return rows
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(100, limit)))
    .map((r, i) => ({
      rank: i + 1,
      name: r.nick || `Islander ${r.player_id.slice(0, 4).toUpperCase()}`,
      score: r.score,
      lines: r.lines,
      me: r.player_id === playerId,
    }));
}

export async function setNick(sql: RankedSql, playerId: string | null, raw: unknown): Promise<{ ok: boolean; nick?: string }> {
  const nick = cleanNick(raw);
  if (!nick || !playerId || !ID_RE.test(playerId)) return { ok: false };
  const rows = await sql.query<{ id: string }>("update bj_players set nick = $2 where id = $1 returning id", [playerId, nick]);
  return rows.length ? { ok: true, nick } : { ok: false };
}
