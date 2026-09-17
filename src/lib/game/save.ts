import { newEndlessMatch, sanitizeMatch, type Match } from "./engine";
import type { PowerId, QuestId, SkinId } from "./content";

export const SAVE_VERSION = 2;
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
  settings: { sfx: boolean; music: boolean; shake: boolean };
  daily: { lastClaim: number; streak: number; nextAt: number };
  quests: QuestProgress;
  questDay: string;
  adventure: { unlocked: number; stars: Record<string, number> };
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
    settings: { sfx: true, music: true, shake: true },
    daily: { lastClaim: 0, streak: 0, nextAt: now },
    quests: EMPTY_QUESTS(),
    questDay: todayKey(),
    adventure: { unlocked: 1, stars: {} },
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
    // Version 2 introduced the dimensional special-tile showcase. Keep the
    // player's currency and progress, but replace the stale v1 board so the
    // upgraded bomb, arrow and stone art is visible immediately.
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

export function ensureMatch(profile: Profile): Profile {
  if (profile.match) {
    try {
      return { ...profile, match: sanitizeMatch(profile.match) };
    } catch {
      return { ...profile, match: newEndlessMatch({ showcase: profile.games === 0 }) };
    }
  }
  return { ...profile, match: newEndlessMatch({ showcase: profile.games === 0 }) };
}
