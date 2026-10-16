/**
 * Plays thousands of seeded games with bot players to measure how winnable
 * each level is, how often stars are earned, and whether the dealer ever
 * hands out a set that can't be placed.
 *
 * Bots never use boosters, visitors or continues, so their win rates are a
 * floor for what a real player with those helpers would see.
 *
 * Run: node --experimental-strip-types tools/simulate.ts [gamesPerLevel] [--json out.json]
 *      node --experimental-strip-types tools/simulate.ts 400 --calibrate
 *        (re-derives the star move limits in src/lib/game/star-table.ts)
 */

import {
  bounds,
  canPlace,
  cloneBoard,
  SIZE,
  setIsPlayable,
  placePiece,
  newLevelMatch,
  type Cell,
  type Match,
  type Piece,
} from "../src/lib/game/engine.ts";
import { ADVENTURE, CLASSIC, adventureFeatures, starsFor, starPar } from "../src/lib/game/content.ts";
import { PLAIN_FEATURES, cloneFeatures } from "../src/lib/game/engine.ts";
import { writeFileSync } from "node:fs";

type Move = { i: number; r: number; c: number };
type Strategy = "random" | "greedy" | "planner";

const MAX_MOVES = 300;

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function legalMoves(m: Match): Move[] {
  const out: Move[] = [];
  m.tray.forEach((p, i) => {
    if (!p) return;
    const { rows, cols } = bounds(p.cells);
    for (let r = 0; r <= SIZE - rows; r++) for (let c = 0; c <= SIZE - cols; c++) if (canPlace(m.board, p.cells, r, c)) out.push({ i, r, c });
  });
  return out;
}

const filled = (cell: Cell | undefined) => !cell || cell.t !== "e";

/** How healthy a board is: open, few holes, room for big pieces. */
function boardValue(b: Cell[][]): number {
  let occ = 0;
  let holes = 0;
  let edges = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = b[r]![c]!;
      if (cell.t !== "e") {
        occ++;
        continue;
      }
      const n = [b[r - 1]?.[c], b[r + 1]?.[c], b[r]?.[c - 1], b[r]?.[c + 1]].filter(filled).length;
      if (n >= 4) holes += 2;
      else if (n === 3) holes += 1;
      if (c + 1 < SIZE && filled(b[r]![c + 1])) edges++;
      if (r + 1 < SIZE && filled(b[r + 1]![c])) edges++;
    }
  }
  let fit3 = 0;
  for (let r = 0; r <= SIZE - 3 && !fit3; r++) for (let c = 0; c <= SIZE - 3 && !fit3; c++) {
    let ok = true;
    for (let dr = 0; dr < 3 && ok; dr++) for (let dc = 0; dc < 3 && ok; dc++) if (b[r + dr]![c + dc]!.t !== "e") ok = false;
    if (ok) fit3 = 1;
  }
  return -occ * 1.0 - holes * 3 - edges * 0.35 + fit3 * 6;
}

function moveScore(m: Match, mv: Move): { value: number; next: Match } | null {
  const res = placePiece(m, mv.i, mv.r, mv.c);
  if (!res.ok) return null;
  const lines = res.clear?.lines ?? 0;
  let value = boardValue(res.match.board) + lines * 12 + res.gained * 0.01;
  if (res.match.won) value += 1000;
  if (res.match.over) value -= 500;
  if (m.goal?.type === "combo" && res.combo > m.combo) value += 8;
  return { value, next: res.match };
}

function pickGreedy(m: Match): Move | null {
  let best: Move | null = null;
  let bestV = -Infinity;
  for (const mv of legalMoves(m)) {
    const s = moveScore(m, mv);
    if (s && s.value > bestV) {
      bestV = s.value;
      best = mv;
    }
  }
  return best;
}

/** Looks two placements ahead, keeping the 8 best first moves. */
function pickPlanner(m: Match): Move | null {
  const first = legalMoves(m)
    .map((mv) => ({ mv, s: moveScore(m, mv) }))
    .filter((x): x is { mv: Move; s: { value: number; next: Match } } => x.s !== null)
    .sort((a, b) => b.s.value - a.s.value)
    .slice(0, 8);
  if (!first.length) return null;
  let best = first[0]!.mv;
  let bestV = -Infinity;
  for (const { mv, s } of first) {
    if (s.next.won) return mv;
    const nextTrayLeft = s.next.tray.some((p) => p) && m.tray.filter(Boolean).length > 1;
    let v = s.value;
    if (nextTrayLeft) {
      let follow = -Infinity;
      for (const mv2 of legalMoves(s.next)) {
        const s2 = moveScore(s.next, mv2);
        if (s2 && s2.value > follow) follow = s2.value;
      }
      v = follow === -Infinity ? s.value - 400 : follow;
    }
    if (v > bestV) {
      bestV = v;
      best = mv;
    }
  }
  return best;
}

type GameResult = { won: boolean; moves: number; stars: number; deals: number; badDeals: number; score: number };

function play(start: Match, strategy: Strategy, seed: number, checkDeals: boolean): GameResult {
  let m = start;
  m.seed = seed;
  m.deals = 0;
  const rnd = mulberry(seed ^ 0x5bd1e995);
  let deals = 1;
  let badDeals = 0;
  const check = (mm: Match) => {
    if (!checkDeals) return;
    const pieces = mm.tray.filter((p): p is Piece => p !== null);
    if (!setIsPlayable(cloneBoard(mm.board), pieces, 200000)) badDeals++;
  };
  check(m);
  while (!m.won && !m.over && m.moves < MAX_MOVES) {
    let mv: Move | null;
    if (strategy === "random") {
      const all = legalMoves(m);
      mv = all.length ? all[Math.floor(rnd() * all.length)]! : null;
    } else mv = strategy === "greedy" ? pickGreedy(m) : pickPlanner(m);
    if (!mv) break;
    const res = placePiece(m, mv.i, mv.r, mv.c);
    if (!res.ok) break;
    const refilled = m.tray.filter(Boolean).length === 1 && res.match.tray.some(Boolean);
    m = res.match;
    if (refilled) {
      deals++;
      check(m);
    }
  }
  return { won: m.won, moves: m.moves, stars: m.won ? starsFor(m.goal, m.moves, m.mode, m.levelId) : 0, deals, badDeals, score: m.score };
}

type Row = { mode: string; level: number; goal: string; par: number; strategy: Strategy; games: number; winRate: number; star3: number; star2plus: number; medianMovesWin: number | null; deals: number; badDeals: number; winMoves: number[] };

function summarize(mode: string, level: number, goal: string, par: number, strategy: Strategy, rs: GameResult[]): Row {
  const wins = rs.filter((r) => r.won);
  const mv = wins.map((r) => r.moves).sort((a, b) => a - b);
  return {
    mode,
    level,
    goal,
    par,
    strategy,
    games: rs.length,
    winRate: wins.length / rs.length,
    star3: rs.filter((r) => r.stars === 3).length / rs.length,
    star2plus: rs.filter((r) => r.stars >= 2).length / rs.length,
    medianMovesWin: mv.length ? mv[Math.floor(mv.length / 2)]! : null,
    deals: rs.reduce((n, r) => n + r.deals, 0),
    badDeals: rs.reduce((n, r) => n + r.badDeals, 0),
    winMoves: mv,
  };
}

const N = Number(process.argv[2] ?? 100);
const SEED_BASE = process.argv.includes("--calibrate") ? 500_000 : 1000;
const jsonAt = process.argv.indexOf("--json");
const only = process.argv.includes("--adventure") ? "adventure" : process.argv.includes("--classic") ? "classic" : null;
const rows: Row[] = [];
const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(4);
const t0 = Date.now();

const levels = [
  ...(only !== "classic" ? ADVENTURE.map((l) => ({ mode: "adventure" as const, id: l.id, goal: l.goal, stones: l.stones, features: adventureFeatures(l.id) })) : []),
  ...(only !== "adventure" ? CLASSIC.map((l) => ({ mode: "classic" as const, id: l.id, goal: l.goal, stones: 0, features: cloneFeatures(PLAIN_FEATURES) })) : []),
];
const CALIBRATE = process.argv.includes("--calibrate");
const table: Record<string, Record<number, { three: number; two: number }>> = { adventure: {}, classic: {} };
for (const lvl of levels) {
  for (const strategy of (CALIBRATE ? ["greedy"] : ["random", "greedy", "planner"]) as Strategy[]) {
    const games = strategy === "planner" ? Math.max(20, Math.floor(N / 2)) : N;
    const rs: GameResult[] = [];
    for (let g = 0; g < games; g++) {
      const start = newLevelMatch(lvl.mode, lvl.id, lvl.goal, lvl.stones, lvl.features);
      // Deal legality is checked on the greedy games (the most deals per game).
      rs.push(play(start, strategy, SEED_BASE + g * 7919 + lvl.id, strategy === "greedy"));
    }
    const row = summarize(lvl.mode, lvl.id, `${lvl.goal.type} ${lvl.goal.value}`, starPar(lvl.goal, lvl.mode, lvl.id), strategy, rs);
    if (CALIBRATE) {
      // The greedy bot weighs every placement on the board, so it is steadier
      // than most people (who, in turn, have boosters and visitors). 3 stars =
      // what 60% of its wins manage (80% on the first three levels, which
      // should feel generous); 2 stars = 95%.
      const q = (p: number) => row.winMoves[Math.min(row.winMoves.length - 1, Math.floor(row.winMoves.length * p))]!;
      const three = Math.max(6, q(lvl.id <= 3 ? 0.8 : 0.6));
      table[lvl.mode]![lvl.id] = { three, two: Math.max(three + 3, q(0.95)) };
    }
    rows.push(row);
    console.log(
      `${lvl.mode.padEnd(9)} ${String(lvl.id).padStart(2)} ${row.goal.padEnd(11)} ${strategy.padEnd(7)} n=${String(games).padStart(4)} win ${pct(row.winRate)}  3★ ${pct(row.star3)}  2★+ ${pct(row.star2plus)}  moves ${String(row.medianMovesWin ?? "-").padStart(3)} (par ${row.par})${strategy === "greedy" ? `  unplaceable deals ${row.badDeals}/${row.deals}` : ""}`,
    );
  }
}
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s, ${rows.reduce((n, r) => n + r.games, 0)} games`);
if (CALIBRATE) {
  writeFileSync(
    new URL("../src/lib/game/star-table.ts", import.meta.url),
    "// Generated by tools/simulate.ts --calibrate: do not edit by hand.\n" +
      "// Most moves allowed for 3 and 2 stars on each level, from seeded bot play.\n" +
      `export const STAR_TABLE: Record<"adventure" | "classic", Record<number, { three: number; two: number }>> = ${JSON.stringify(table, null, 1)};\n`,
  );
  console.log("wrote src/lib/game/star-table.ts");
}
if (jsonAt > 0) writeFileSync(process.argv[jsonAt + 1]!, JSON.stringify(rows, null, 1));
