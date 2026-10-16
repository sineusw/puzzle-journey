/**
 * Run stats, Puzzle IQ and awards. Pure functions — no DOM, no store — so
 * they're tested directly and shared by the results screen and leaderboard.
 */

import type { ColorId } from "./engine.ts";

export const BLOCK_COLORS: ColorId[] = ["cyan", "azure", "lime", "pink", "amber", "orange", "violet"];

export const COLOR_NAME: Record<ColorId, string> = {
  cyan: "sky blue",
  azure: "blue",
  lime: "green",
  pink: "pink",
  amber: "gold",
  orange: "orange",
  violet: "purple",
};

/** Everything measured about one run (one level attempt or Sandbox game). */
export type RunStats = {
  mode: string;
  levelId: number | null;
  startedAt: number;
  endedAt: number;
  score: number;
  lines: number;
  bestCombo: number;
  perfects: number;
  pieces: number;
  /** Blocks cleared, by color. */
  colors: Partial<Record<ColorId, number>>;
  /** Timestamps (ms) of each line cleared, for the 30-second burst. */
  lineTimes: number[];
  /** Empty cells left on the board at the end. */
  spacesLeft: number;
  won: boolean;
  /** The run was picked up again after a reload, so its clock isn't complete. */
  resumed?: boolean;
};

export function emptyRun(mode: string, levelId: number | null, now = Date.now()): RunStats {
  return {
    mode,
    levelId,
    startedAt: now,
    endedAt: now,
    score: 0,
    lines: 0,
    bestCombo: 0,
    perfects: 0,
    pieces: 0,
    colors: {},
    lineTimes: [],
    spacesLeft: 64,
    won: false,
  };
}

/** Most lines cleared inside any 30-second window. */
export function bestBurst(lineTimes: number[], windowMs = 30_000): number {
  const t = [...lineTimes].sort((a, b) => a - b);
  let best = 0;
  let lo = 0;
  for (let hi = 0; hi < t.length; hi++) {
    while (t[hi]! - t[lo]! > windowMs) lo++;
    best = Math.max(best, hi - lo + 1);
  }
  return best;
}

export function seconds(run: RunStats): number {
  return Math.max(1, Math.round((run.endedAt - run.startedAt) / 1000));
}

/**
 * Puzzle IQ: a game rating (not a real IQ test) on a familiar 70–160 scale.
 * 100 is a steady, average run. It rewards clearing lines efficiently,
 * building combos, perfect clears, quick play and finishing the level.
 */
export function puzzleIq(run: RunStats): number {
  const pieces = Math.max(1, run.pieces);
  const linesPerPiece = run.lines / pieces; // ~0.25 is typical, 0.5 is excellent
  const secsPerPiece = seconds(run) / pieces; // ~6 s typical, 3 s is quick
  let iq = 92;
  iq += Math.min(30, linesPerPiece * 70);
  iq += Math.min(18, Math.max(0, run.bestCombo - 1) * 4.5);
  iq += Math.min(14, run.perfects * 7);
  iq += Math.max(-8, Math.min(8, (6 - secsPerPiece) * 2));
  if (run.won) iq += 6;
  if (pieces < 6) iq = 100 + (iq - 100) * (pieces / 6); // too short to judge: pull toward 100
  return Math.round(Math.max(70, Math.min(160, iq)));
}

/** Share of `others` this score beats (0–100), or null without enough data. */
export function percentileOf(value: number, others: number[], minSample = 3): number | null {
  if (others.length < minSample) return null;
  const below = others.filter((v) => v < value).length;
  const ties = others.filter((v) => v === value).length;
  return Math.round(((below + ties / 2) / others.length) * 100);
}

export type IqLabel = { headline: string; note: string };

/** Friendly words for an IQ, plus an honest comparison line. */
export function iqLabel(iq: number, pct: number | null, versus: "players" | "your games"): IqLabel {
  const headline =
    iq >= 140 ? "Puzzle genius" : iq >= 125 ? "Brilliant" : iq >= 112 ? "Sharp thinker" : iq >= 100 ? "Clever" : iq >= 90 ? "Warming up" : "Finding your groove";
  const note =
    pct === null
      ? "Play a few more to see how you rank."
      : pct >= 50
        ? `Higher than ${pct}% of ${versus === "players" ? "scores on the board" : "your games"}`
        : `Better than ${pct}% of ${versus === "players" ? "scores on the board" : "your games"}. Keep going!`;
  return { headline, note };
}

/* ------------------------------------------------------------------ records */

/** A player's standing totals, kept per player (and shared on the board). */
export type PlayerCard = {
  nick?: string;
  updatedAt: number;
  best: {
    sandbox: number;
    score: number;
    iq: number;
    combo: number;
    perfects: number;
    lines: number;
    burst: number;
    streak: number;
    /** Fastest level win, seconds (0 = none yet). */
    fastest: number;
    /** Most blocks placed in one run. */
    pieces: number;
    /** Fewest empty cells left when a level was won (64 = none yet). */
    tidiest: number;
  };
  /** Today's (and the last few days') totals, keyed YYYY-MM-DD. */
  days: Record<string, DayTotals>;
  /** Recent Puzzle IQ results, newest last, for percentiles. */
  iqs: number[];
};

export type DayTotals = {
  lines: number;
  score: number;
  burst: number;
  games: number;
  colors: Partial<Record<ColorId, number>>;
};

export function dayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function emptyCard(): PlayerCard {
  return {
    updatedAt: 0,
    best: { sandbox: 0, score: 0, iq: 0, combo: 0, perfects: 0, lines: 0, burst: 0, streak: 0, fastest: 0, pieces: 0, tidiest: 64 },
    days: {},
    iqs: [],
  };
}

/** Fold one finished run into a card. Returns a new card (inputs untouched). */
export function addRun(card: PlayerCard, run: RunStats, iq: number, streak: number, now = new Date()): PlayerCard {
  const next: PlayerCard = JSON.parse(JSON.stringify(card));
  const b = next.best;
  const burst = bestBurst(run.lineTimes);
  if (run.mode === "sandbox") b.sandbox = Math.max(b.sandbox, run.score);
  b.score = Math.max(b.score, run.score);
  b.iq = Math.max(b.iq, iq);
  b.combo = Math.max(b.combo, run.bestCombo);
  b.perfects = Math.max(b.perfects, run.perfects);
  b.lines = Math.max(b.lines, run.lines);
  b.burst = Math.max(b.burst, burst);
  b.streak = Math.max(b.streak, streak);
  b.pieces = Math.max(b.pieces, run.pieces);
  if (run.won && run.levelId) {
    // A resumed run's clock only covers part of the level: not a fair time.
    if (!run.resumed) {
      const secs = seconds(run);
      b.fastest = b.fastest ? Math.min(b.fastest, secs) : secs;
    }
    b.tidiest = Math.min(b.tidiest, run.spacesLeft);
  }
  const key = dayKey(now);
  const day: DayTotals = next.days[key] ?? { lines: 0, score: 0, burst: 0, games: 0, colors: {} };
  day.lines += run.lines;
  day.score = Math.max(day.score, run.score);
  day.burst = Math.max(day.burst, burst);
  day.games += 1;
  for (const c of BLOCK_COLORS) {
    const n = run.colors[c] ?? 0;
    if (n) day.colors[c] = (day.colors[c] ?? 0) + n;
  }
  next.days[key] = day;
  // Keep a week of days so the document stays small.
  const keep = Object.keys(next.days).sort().slice(-7);
  next.days = Object.fromEntries(keep.map((k) => [k, next.days[k]!]));
  next.iqs = [...next.iqs, iq].slice(-40);
  next.updatedAt = now.getTime();
  return next;
}

/* ------------------------------------------------------------------- awards */

export type Category = {
  id: string;
  title: string;
  /** Value for a card; higher is better unless `lower` is set. 0/undefined = not ranked. */
  value: (c: PlayerCard, today: string) => number;
  format: (v: number) => string;
  lower?: boolean;
  scope: "all" | "today";
};

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function categories(now = new Date()): Category[] {
  const wd = WEEKDAY[now.getDay()]!;
  const int = (v: number) => v.toLocaleString("en-US");
  const cats: Category[] = [
    { id: "sandbox", title: "Sandbox high score", value: (c) => c.best.sandbox, format: int, scope: "all" },
    { id: "iq", title: "Highest Puzzle IQ", value: (c) => c.best.iq, format: int, scope: "all" },
    { id: "combo", title: "Biggest combo", value: (c) => c.best.combo, format: (v) => `×${v}`, scope: "all" },
    { id: "streak", title: "Most levels in a row", value: (c) => c.best.streak, format: int, scope: "all" },
    { id: "fastest", title: "Fastest level win", value: (c) => c.best.fastest, format: (v) => `${v}s`, lower: true, scope: "all" },
    { id: "tidiest", title: "Tidiest finish", value: (c) => (c.best.tidiest < 64 ? c.best.tidiest : 0), format: (v) => `${v} spaces left`, lower: true, scope: "all" },
    { id: "perfects", title: "Most perfect clears in a run", value: (c) => c.best.perfects, format: int, scope: "all" },
    { id: "pieces", title: "Most blocks placed in a run", value: (c) => c.best.pieces, format: int, scope: "all" },
    { id: "lines-today", title: `Most lines on a ${wd}`, value: (c, t) => c.days[t]?.lines ?? 0, format: int, scope: "today" },
    { id: "score-today", title: "Top score today", value: (c, t) => c.days[t]?.score ?? 0, format: int, scope: "today" },
    { id: "burst-today", title: "Most lines in 30 seconds today", value: (c, t) => c.days[t]?.burst ?? 0, format: int, scope: "today" },
    { id: "games-today", title: "Most games played today", value: (c, t) => c.days[t]?.games ?? 0, format: int, scope: "today" },
  ];
  for (const color of BLOCK_COLORS) {
    cats.push({
      id: `color-${color}`,
      title: `Most ${COLOR_NAME[color]} blocks cleared today`,
      value: (c, t) => c.days[t]?.colors[color] ?? 0,
      format: int,
      scope: "today",
    });
  }
  return cats;
}

export type Ranked = { id: string; value: number }[];

/** Players ranked in one category (ties share order by id for stability). */
export function rank(cat: Category, cards: Record<string, PlayerCard>, today: string): Ranked {
  return Object.entries(cards)
    .map(([id, c]) => ({ id, value: cat.value(c, today) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => (cat.lower ? a.value - b.value : b.value - a.value) || a.id.localeCompare(b.id));
}

export type Award = { title: string; value: string; kind: "first" | "record" };

/**
 * The "paper plate awards" for `me`: every category they lead (on a board
 * with others), or, playing alone, every personal record this run set.
 */
export function awardsFor(me: string, cards: Record<string, PlayerCard>, before: PlayerCard | null, now = new Date()): Award[] {
  const today = dayKey(now);
  const cats = categories(now);
  const others = Object.keys(cards).filter((id) => id !== me).length;
  const out: Award[] = [];
  const mine = cards[me];
  if (!mine) return out;
  for (const cat of cats) {
    const v = cat.value(mine, today);
    if (!v) continue;
    if (others > 0) {
      const r = rank(cat, cards, today);
      if (r[0]?.id === me) out.push({ title: cat.title, value: cat.format(v), kind: "first" });
    } else if (before) {
      // Only beating a real earlier record counts (a first game sets them all).
      const was = cat.value(before, today);
      const better = was > 0 && (cat.lower ? v < was : v > was);
      if (better && cat.scope === "all") out.push({ title: `Personal best: ${cat.title}`, value: cat.format(v), kind: "record" });
    }
  }
  // Lead with the most impressive-sounding, cap the list so it stays a treat.
  return out.slice(0, 4);
}
