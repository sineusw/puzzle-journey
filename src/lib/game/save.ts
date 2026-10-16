import { emptyChallenges, rollover, type ChallengeState } from "./challenges.ts";
import { newLevelMatch, sanitizeMatch, type Match } from "./engine";
import { emptyCard, type PlayerCard } from "./stats.ts";
import { ADVENTURE, adventureFeatures, type PowerId, type QuestId, type SkinId, type UnlockId } from "./content";

export const SAVE_VERSION = 3;
export const SAVE_KEY = "puzzle-journey-v1";

export type PowerCounts = Record<PowerId, number>;

export type QuestProgress = Record<QuestId, { value: number; claimed: boolean }>;

export type Profile = {
  version: number;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  highScore: number;
  bestCombo: number;
  games: number;
  powerups: PowerCounts;
  settings: { sfx: boolean; music: boolean; shake: boolean; voice: boolean };
  daily: { lastClaim: number; streak: number; nextAt: number };
  quests: QuestProgress;
  questDay: string;
  adventure: { unlocked: number; stars: Record<string, number> };
  classic: { unlocked: number; stars: Record<string, number> };
  /** Best Sandbox score (plain blocks, endless). */
  sandboxBest: number;
  /** Adventure unlocks whose "New!" card the player has already seen. */
  seenUnlocks: UnlockId[];
  /** Shapes the player has already met ("New shape!" tag). */
  seenShapes: string[];
  /** Specials the player has had explained in-game. */
  seenSpecialTips: string[];
  /** Saw the "Not your usual blocks" intro. */
  seenShapesIntro: boolean;
  /** Finished or skipped the hands-on tutorial. */
  tutorialDone: boolean;
  /** Daily and weekly challenge progress. */
  challenges: ChallengeState;
  /** This player's records (also shared on the leaderboard when possible). */
  card: PlayerCard;
  /** Levels won in a row (Classic/Adventure); a loss resets it. */
  levelStreak: number;
  skin: SkinId;
  seenHowTo: boolean;
  match: Match | null;
};

const EMPTY_QUESTS = (): QuestProgress => ({
  lines: { value: 0, claimed: false },
  score: { value: 0, claimed: false },
  combo: { value: 0, claimed: false },
  powers: { value: 0, claimed: false },
});

export function defaultProfile(): Profile {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    coins: 240,
    gems: 80,
    xp: 0,
    level: 1,
    highScore: 0,
    bestCombo: 0,
    games: 0,
    powerups: { hammer: 3, refresh: 3, bomb: 3, freeze: 3 },
    settings: { sfx: true, music: true, shake: true, voice: true },
    daily: { lastClaim: 0, streak: 0, nextAt: now },
    quests: EMPTY_QUESTS(),
    questDay: todayKey(),
    adventure: { unlocked: 1, stars: {} },
    classic: { unlocked: 1, stars: {} },
    sandboxBest: 0,
    seenUnlocks: [],
    seenShapes: [],
    seenSpecialTips: [],
    seenShapesIntro: false,
    tutorialDone: false,
    challenges: emptyChallenges(),
    card: emptyCard(),
    levelStreak: 0,
    skin: "classic",
    seenHowTo: false,
    match: null,
  };
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function migrate(raw: Profile): Profile {
  const base = defaultProfile();
  const shouldRefreshShowcase = !raw.version || raw.version < SAVE_VERSION;
  const next: Profile = {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    powerups: { ...base.powerups, ...raw.powerups },
    settings: { ...base.settings, ...raw.settings },
    daily: { ...base.daily, ...raw.daily },
    quests: { ...base.quests, ...raw.quests },
    adventure: {
      unlocked: raw.adventure?.unlocked ?? 1,
      stars: raw.adventure?.stars ?? {},
    },
    classic: {
      unlocked: raw.classic?.unlocked ?? 1,
      stars: raw.classic?.stars ?? {},
    },
    sandboxBest: raw.sandboxBest ?? 0,
    seenUnlocks: raw.seenUnlocks ?? [],
    seenShapes: raw.seenShapes ?? [],
    seenSpecialTips: raw.seenSpecialTips ?? [],
    seenShapesIntro: raw.seenShapesIntro ?? false,
    tutorialDone: raw.tutorialDone ?? false,
    challenges: raw.challenges?.progress ? rollover(raw.challenges) : emptyChallenges(),
    card: raw.card?.best ? fixCard({ ...emptyCard(), ...raw.card, best: { ...emptyCard().best, ...raw.card.best } }) : emptyCard(),
    levelStreak: raw.levelStreak ?? 0,
    // Version 3 introduced game modes. Keep currency and progress, but start
    // the player on a fresh run so an old special-filled board doesn't carry
    // over into the plain-block start.
    match: shouldRefreshShowcase ? null : raw.match,
  };
  if (next.questDay !== todayKey()) {
    next.questDay = todayKey();
    next.quests = EMPTY_QUESTS();
  }
  return next;
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw) as Profile;
    return migrate(parsed);
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: Profile): void {
  try {
    const blob = JSON.stringify(profile);
    localStorage.setItem(`${SAVE_KEY}__bak`, localStorage.getItem(SAVE_KEY) ?? "");
    localStorage.setItem(SAVE_KEY, blob);
  } catch {
    /* private mode / quota */
  }
}

/** The run a brand-new player starts with: Adventure level 1, plain blocks. */
export function firstMatch(): Match {
  const lvl = ADVENTURE[0]!;
  return newLevelMatch("adventure", lvl.id, lvl.goal, lvl.stones, adventureFeatures(lvl.id));
}

export function ensureMatch(profile: Profile): Profile {
  if (profile.match) {
    try {
      return { ...profile, match: sanitizeMatch(profile.match) };
    } catch {
      return { ...profile, match: firstMatch() };
    }
  }
  return { ...profile, match: firstMatch() };
}

/** Drop impossible records left by an older bug (a level "won" in a few seconds after a reload). */
function fixCard(card: PlayerCard): PlayerCard {
  if (card.best.fastest > 0 && card.best.fastest < 8) return { ...card, best: { ...card.best, fastest: 0 } };
  return card;
}
