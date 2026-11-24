import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { bounds, canPlace, placePiece, type Match } from "./engine.ts";
import { cleanNick, newRankedMatch, replayRun, type RankedMove } from "./ranked.ts";
import { setNick, startRun, submitRun, verifiedBoard, type RankedSql } from "./ranked-service.ts";

/** Play a seeded run with a simple bot: first legal spot that clears, else the first legal spot. */
function playRun(seed: number, limit = 60): { moves: RankedMove[]; final: Match } {
  let m = newRankedMatch(seed);
  const moves: RankedMove[] = [];
  while (!m.over && moves.length < limit) {
    let pick: RankedMove | null = null;
    for (let i = 0; i < 3 && !pick; i++) {
      const p = m.tray[i];
      if (!p) continue;
      const { rows, cols } = bounds(p.cells);
      for (let r = 0; r <= 8 - rows && !pick; r++) for (let c = 0; c <= 8 - cols && !pick; c++) if (canPlace(m.board, p.cells, r, c)) pick = [i, r, c];
    }
    if (!pick) break;
    const res = placePiece(m, ...pick);
    assert.ok(res.ok);
    m = res.match;
    moves.push(pick);
  }
  return { moves, final: m };
}

async function db(): Promise<RankedSql> {
  const pg = new PGlite();
  await pg.exec(readFileSync(new URL("../../../migrations/0002_ranked.sql", import.meta.url), "utf8"));
  return { query: async (text, params) => (await pg.query(text, params as unknown[])).rows as never };
}

describe("ranked runs: replay", () => {
  it("the same seed always deals the same game", () => {
    const a = playRun(12345);
    const b = playRun(12345);
    assert.deepEqual(a.moves, b.moves);
    assert.equal(a.final.score, b.final.score);
  });

  it("a real run replays to exactly its score", () => {
    const { moves, final } = playRun(777, 80);
    const r = replayRun(777, moves);
    assert.ok(r.ok);
    assert.equal(r.score, final.score);
    assert.equal(r.moves, moves.length);
  });

  it("the same moves on a different seed don't replay", () => {
    const { moves } = playRun(777, 80);
    const r = replayRun(778, moves);
    assert.equal(r.ok, false);
  });

  it("rejects illegal moves, junk and over-long lists", () => {
    const { moves } = playRun(99, 10);
    const bad = moves.map((m) => [...m] as RankedMove);
    bad[3] = [bad[2]![0], bad[2]![1], bad[2]![2]]; // same slot twice: empty slot or occupied cells
    assert.equal(replayRun(99, bad).ok, false);
    assert.equal(replayRun(99, [[0, 9, 0]]).ok, false);
    assert.equal(replayRun(99, "lots of points").ok, false);
    assert.equal(replayRun(99, Array.from({ length: 3001 }, () => [0, 0, 0])).ok, false);
  });

  it("cleans display names", () => {
    assert.equal(cleanNick("  Winsor  "), "Winsor");
    assert.equal(cleanNick("<script>"), null);
    assert.equal(cleanNick("x"), null);
    assert.equal(cleanNick("a".repeat(17)), null);
  });
});

describe("ranked runs: server rules", () => {
  it("verifies a run once, ranks it, and refuses a second submit", async () => {
    const sql = await db();
    const start = await startRun(sql, { playerId: null, ip: "1.2.3.4" });
    assert.ok(start.ok);
    const { moves, final } = playRun(start.seed, 80);
    const caller = { playerId: start.playerId, ip: "1.2.3.4" };
    const ok = await submitRun(sql, caller, start.runId, moves);
    assert.ok(ok.ok);
    assert.equal(ok.score, final.score, "server's own score");
    assert.equal(ok.rank, 1);
    const again = await submitRun(sql, caller, start.runId, moves);
    assert.deepEqual(again, { ok: false, error: "already_submitted" });
    await setNick(sql, start.playerId, "Luke");
    const board = await verifiedBoard(sql, start.playerId);
    assert.equal(board[0]?.name, "Luke");
    assert.equal(board[0]?.score, final.score);
    assert.equal(board[0]?.me, true);
  });

  it("another player can't submit your run", async () => {
    const sql = await db();
    const start = await startRun(sql, { playerId: null, ip: "1.1.1.1" });
    assert.ok(start.ok);
    const other = await startRun(sql, { playerId: null, ip: "1.1.1.1" });
    assert.ok(other.ok);
    const { moves } = playRun(start.seed, 20);
    const r = await submitRun(sql, { playerId: other.playerId, ip: "1.1.1.1" }, start.runId, moves);
    assert.deepEqual(r, { ok: false, error: "not_yours" });
  });

  it("a faked or replayed move list is rejected and closes the run", async () => {
    const sql = await db();
    const start = await startRun(sql, { playerId: null, ip: "5.5.5.5" });
    assert.ok(start.ok);
    const caller = { playerId: start.playerId, ip: "5.5.5.5" };
    // Moves recorded for some other seed (a "replay attack").
    const stolen = playRun(start.seed + 1, 40).moves;
    const r = await submitRun(sql, caller, start.runId, stolen);
    assert.equal(r.ok, false);
    // Even the right moves can't be sent after a rejected try.
    const real = playRun(start.seed, 40).moves;
    const again = await submitRun(sql, caller, start.runId, real);
    assert.deepEqual(again, { ok: false, error: "already_submitted" });
    assert.equal((await verifiedBoard(sql, null)).length, 0);
  });

  it("runs expire, and starting too many is rate limited", async () => {
    const sql = await db();
    const t0 = new Date("2026-10-17T10:00:00Z");
    const start = await startRun(sql, { playerId: null, ip: "9.9.9.9", now: t0 });
    assert.ok(start.ok);
    const late = await submitRun(sql, { playerId: start.playerId, ip: "9.9.9.9", now: new Date(t0.getTime() + 4 * 3600_000) }, start.runId, playRun(start.seed, 5).moves);
    assert.deepEqual(late, { ok: false, error: "expired" });
    let limited = false;
    for (let i = 0; i < 40 && !limited; i++) {
      const s = await startRun(sql, { playerId: start.playerId, ip: "9.9.9.9", now: t0 });
      if (!s.ok) limited = s.error === "rate_limited";
    }
    assert.ok(limited);
  });
});
