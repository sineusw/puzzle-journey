/**
 * Ranked runs: a Sandbox game dealt from a server-issued seed. The client
 * records each placement; the server replays them with this same engine and
 * keeps only the score the replay produces. A faked score, an illegal move or
 * a move list for a different seed simply doesn't replay.
 *
 * Shared by the browser (recording) and the server (verifying). No I/O here.
 */

import { newSandboxMatch, placePiece, type Match } from "./engine.ts";

/** One placement: tray slot, then the board cell of the piece's top-left. */
export type RankedMove = [slot: number, row: number, col: number];

/** Hard limits a submitted run must stay inside. */
export const RANKED_LIMITS = {
  /** Most placements in one run (a very long real game is a few hundred). */
  maxMoves: 3000,
  /** A run must be submitted within this long of its seed being issued. */
  maxRunMs: 3 * 60 * 60 * 1000,
  /** Ranked runs a player may start per hour. */
  startsPerHour: 30,
  /** Ranked runs one network address may start per hour (several players can share one). */
  startsPerIpHour: 120,
} as const;

/** The match a ranked run starts from. Client and server both build it this way. */
export function newRankedMatch(seed: number): Match {
  return newSandboxMatch(seed);
}

export type ReplayResult =
  | { ok: true; score: number; lines: number; moves: number; bestCombo: number; perfects: number; over: boolean }
  | { ok: false; error: string; atMove: number };

/** Is this a well-formed move list? (Shape only; legality is the replay's job.) */
export function isMoveList(x: unknown): x is RankedMove[] {
  return (
    Array.isArray(x) &&
    x.length <= RANKED_LIMITS.maxMoves &&
    x.every(
      (m) =>
        Array.isArray(m) &&
        m.length === 3 &&
        m.every((n) => Number.isInteger(n)) &&
        m[0] >= 0 &&
        m[0] <= 2 &&
        m[1] >= 0 &&
        m[1] < 8 &&
        m[2] >= 0 &&
        m[2] < 8,
    )
  );
}

/**
 * Replay a run from its seed. Every move must be legal at the moment it is
 * made, and no move may come after the game is over.
 */
export function replayRun(seed: number, moves: unknown): ReplayResult {
  if (!Number.isInteger(seed) || seed < 0) return { ok: false, error: "bad seed", atMove: 0 };
  if (!isMoveList(moves)) return { ok: false, error: "bad move list", atMove: 0 };
  let m = newRankedMatch(seed);
  for (let i = 0; i < moves.length; i++) {
    if (m.over) return { ok: false, error: "move after game over", atMove: i };
    const [slot, row, col] = moves[i]!;
    const res = placePiece(m, slot, row, col);
    if (!res.ok) return { ok: false, error: "illegal move", atMove: i };
    m = res.match;
  }
  return { ok: true, score: m.score, lines: m.lines, moves: m.moves, bestCombo: m.bestCombo, perfects: m.perfects, over: m.over };
}

/** A display name players choose: letters, digits, spaces, - and _, 2–16 characters. */
export function cleanNick(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.normalize("NFKC").replace(/\s+/g, " ").trim();
  if (s.length < 2 || s.length > 16) return null;
  if (!/^[\p{L}\p{N} _-]+$/u.test(s)) return null;
  return s;
}
