/**
 * Challenge board: daily and weekly challenges that fill up while you play
 * any mode. No separate runs. The day's set is picked from the date, so every
 * player races the same challenges.
 */

import type { ColorId } from "./engine.ts";
import { COLOR_NAME, dayKey, weekKey } from "./stats.ts";

export { weekKey };

export type Metric =
  | "lines"
  | "score_run"
  | "combo"
  | "specials"
  | "perfects"
  | "multi"
  | "levels"
  | "stars"
  | "pieces"
  | "visitors"
  | "powers"
  | "color";

export type ChallengeDef = {
  id: string;
  title: string;
  blurb: string;
  icon: string;
  metric: Metric;
  target: number;
  color?: ColorId;
  reward: { coins: number; gems: number };
  period: "day" | "week";
};

/** Metrics that track a best (max) instead of adding up. */
const BEST: ReadonlySet<Metric> = new Set(["score_run", "combo"]);

const DAY_POOL: ChallengeDef[] = [
  { id: "d-lines", title: "Line Cook", blurb: "Clear 15 lines", icon: "🧹", metric: "lines", target: 15, reward: { coins: 50, gems: 3 }, period: "day" },
  { id: "d-lines2", title: "Clean Sweep", blurb: "Clear 30 lines", icon: "🌊", metric: "lines", target: 30, reward: { coins: 90, gems: 5 }, period: "day" },
  { id: "d-score", title: "High Roller", blurb: "Score 1,500 in one game", icon: "🎯", metric: "score_run", target: 1500, reward: { coins: 60, gems: 4 }, period: "day" },
  { id: "d-score2", title: "Big Shot", blurb: "Score 3,000 in one game", icon: "💰", metric: "score_run", target: 3000, reward: { coins: 90, gems: 6 }, period: "day" },
  { id: "d-combo", title: "On a Roll", blurb: "Reach a ×3 combo", icon: "🔥", metric: "combo", target: 3, reward: { coins: 50, gems: 3 }, period: "day" },
  { id: "d-combo2", title: "Combo King", blurb: "Reach a ×5 combo", icon: "👑", metric: "combo", target: 5, reward: { coins: 80, gems: 5 }, period: "day" },
  { id: "d-multi", title: "Double Trouble", blurb: "Clear 2+ lines at once, 3 times", icon: "✌️", metric: "multi", target: 3, reward: { coins: 60, gems: 4 }, period: "day" },
  { id: "d-special", title: "Boom Zap", blurb: "Set off 4 special blocks", icon: "💥", metric: "specials", target: 4, reward: { coins: 60, gems: 4 }, period: "day" },
  { id: "d-levels", title: "Island Hopper", blurb: "Win 2 levels", icon: "🏝️", metric: "levels", target: 2, reward: { coins: 60, gems: 4 }, period: "day" },
  { id: "d-stars", title: "Star Catcher", blurb: "Earn 5 level stars", icon: "⭐", metric: "stars", target: 5, reward: { coins: 70, gems: 5 }, period: "day" },
  { id: "d-pieces", title: "Busy Builder", blurb: "Place 60 blocks", icon: "🧱", metric: "pieces", target: 60, reward: { coins: 40, gems: 2 }, period: "day" },
  { id: "d-visitor", title: "Say Hello", blurb: "Meet 2 Island Visitors", icon: "🐒", metric: "visitors", target: 2, reward: { coins: 40, gems: 3 }, period: "day" },
  { id: "d-pink", title: "Pink Party", blurb: "Clear 25 pink blocks", icon: "🌸", metric: "color", color: "pink", target: 25, reward: { coins: 50, gems: 3 }, period: "day" },
  { id: "d-lime", title: "Going Green", blurb: "Clear 25 green blocks", icon: "🍀", metric: "color", color: "lime", target: 25, reward: { coins: 50, gems: 3 }, period: "day" },
  { id: "d-amber", title: "Gold Rush", blurb: "Clear 25 gold blocks", icon: "🪙", metric: "color", color: "amber", target: 25, reward: { coins: 50, gems: 3 }, period: "day" },
  { id: "d-violet", title: "Purple Reign", blurb: "Clear 25 purple blocks", icon: "🔮", metric: "color", color: "violet", target: 25, reward: { coins: 50, gems: 3 }, period: "day" },
];

const WEEK_POOL: ChallengeDef[] = [
  { id: "w-lines", title: "Line Legend", blurb: "Clear 200 lines this week", icon: "🏆", metric: "lines", target: 200, reward: { coins: 300, gems: 20 }, period: "week" },
  { id: "w-perfect", title: "Spotless", blurb: "Get 3 perfect clears", icon: "✨", metric: "perfects", target: 3, reward: { coins: 250, gems: 18 }, period: "week" },
  { id: "w-stars", title: "Constellation", blurb: "Earn 25 level stars", icon: "🌟", metric: "stars", target: 25, reward: { coins: 300, gems: 20 }, period: "week" },
  { id: "w-score", title: "Record Breaker", blurb: "Score 6,000 in one game", icon: "🚀", metric: "score_run", target: 6000, reward: { coins: 250, gems: 18 }, period: "week" },
  { id: "w-special", title: "Demolition Crew", blurb: "Set off 30 special blocks", icon: "🧨", metric: "specials", target: 30, reward: { coins: 250, gems: 15 }, period: "week" },
  { id: "w-combo", title: "Unstoppable", blurb: "Reach a ×8 combo", icon: "⚡", metric: "combo", target: 8, reward: { coins: 250, gems: 18 }, period: "week" },
];

export const ALL_CHALLENGES: ChallengeDef[] = [...DAY_POOL, ...WEEK_POOL];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Pick `n` from a pool in a fixed order for this key (no duplicates). */
function pick(pool: ChallengeDef[], key: string, n: number): ChallengeDef[] {
  return pool
    .map((c) => ({ c, k: hash(`${key}:${c.id}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, n)
    .map((x) => x.c);
}

/** Today's 5 challenges: the same for everyone on this date. Always one color one. */
export function dailySet(day = dayKey()): ChallengeDef[] {
  const colorOnes = DAY_POOL.filter((c) => c.metric === "color");
  const rest = DAY_POOL.filter((c) => c.metric !== "color");
  return [...pick(rest, day, 4), ...pick(colorOnes, day, 1)];
}

/** This week's 3 bigger challenges. */
export function weeklySet(week = weekKey()): ChallengeDef[] {
  return pick(WEEK_POOL, week, 3);
}

export type ChallengeState = {
  day: string;
  week: string;
  /** Progress by challenge id for the current day/week. */
  progress: Record<string, number>;
  /** Completed challenge ids for the current day/week. */
  done: string[];
  /** Completed challenges whose reward has been collected. */
  claimed?: string[];
};

export function emptyChallenges(now = new Date()): ChallengeState {
  return { day: dayKey(now), week: weekKey(now), progress: {}, done: [], claimed: [] };
}

/** Start fresh when the day or week rolls over (keeping the other period). */
export function rollover(state: ChallengeState, now = new Date()): ChallengeState {
  const day = dayKey(now);
  const week = weekKey(now);
  if (state.day === day && state.week === week) return state;
  const keep = (id: string) => (id.startsWith("d-") ? state.day === day : state.week === week);
  return {
    day,
    week,
    progress: Object.fromEntries(Object.entries(state.progress).filter(([id]) => keep(id))),
    done: state.done.filter(keep),
    claimed: (state.claimed ?? []).filter(keep),
  };
}

/** What one move (or other moment) contributed. */
export type ChallengeEvent = Partial<Record<Exclude<Metric, "color">, number>> & { colors?: Partial<Record<ColorId, number>> };

/** Apply an event to every active challenge; returns the new state and any just completed. */
export function applyChallengeEvent(
  state: ChallengeState,
  ev: ChallengeEvent,
  now = new Date(),
): { state: ChallengeState; completed: ChallengeDef[] } {
  const s = rollover(state, now);
  const active = [...dailySet(s.day), ...weeklySet(s.week)];
  const progress = { ...s.progress };
  const done = [...s.done];
  const completed: ChallengeDef[] = [];
  for (const c of active) {
    if (done.includes(c.id)) continue;
    const add = c.metric === "color" ? ev.colors?.[c.color!] ?? 0 : ev[c.metric] ?? 0;
    if (!add) continue;
    const was = progress[c.id] ?? 0;
    progress[c.id] = BEST.has(c.metric) ? Math.max(was, add) : was + add;
    if (progress[c.id]! >= c.target) {
      done.push(c.id);
      completed.push(c);
    }
  }
  return { state: { ...s, progress, done }, completed };
}

export function colorLabel(c: ColorId): string {
  return COLOR_NAME[c];
}
