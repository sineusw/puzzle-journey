import { create } from "zustand";
import {
  applyFreeze,
  bombCell,
  praiseFor,
  continueMatch,
  hammerCell,
  newGoalMatch,
  newLevelMatch,
  newSandboxMatch,
  placePiece,
  refreshTray,
  sanitizeMatch,
  PLAIN_FEATURES,
  COMBO_WINDOW,
  type Cell,
  type Match,
} from "./engine";
import {
  ADVENTURE,
  CHALLENGES,
  CLASSIC,
  CONTINUE_COST,
  QUESTS,
  adventureFeatures,
  xpForLevel,
  type PowerId,
  type SkinId,
  type UnlockId,
} from "./content";
import {
  defaultProfile,
  ensureMatch,
  firstMatch,
  loadProfile,
  saveProfile,
  type Profile,
} from "./save";
import * as audio from "./audio";
import { primeVoice, setVoiceEnabled, warmVoices } from "./voice";
import { addRun, awardsFor, emptyRun, percentileOf, puzzleIq, type Award, type RunStats } from "./stats.ts";
import { connectBoard, postCard, useBoard } from "./leaderboard.ts";
import { LESSONS, stepMatch, type LessonId } from "./tutorial.ts";
import { cheer } from "./voice";
import {
  applyVisitorAction,
  nextVisitAt,
  pickMood,
  planVisitor,
  VISITOR_IDS,
  type VisitorEvent,
  type VisitorId,
} from "./visitors";

export type Tab = "home" | "adventure" | "challenges" | "ranks" | "skins" | "more";
export type Panel =
  | null
  | "shop"
  | "quests"
  | "daily"
  | "events"
  | "map"
  | "settings"
  | "how"
  | "over"
  | "won"
  | "levelup"
  | "intro";

export type FlashCell = { r: number; c: number; cell: Cell };
export type LandedCell = { r: number; c: number };

/**
 * Everything the board's effect layer needs to animate one move, delivered
 * in a single store update so a placement costs one render, not five.
 */
export type BoardFx = {
  id: number;
  /** Cells that just received a block (landing bounce). */
  landed: LandedCell[];
  /** Cells removed by this move, with what was in them (burst animation). */
  cleared: FlashCell[];
  rows: number[];
  cols: number[];
  /** Where the effects radiate from. */
  origin: { r: number; c: number };
  gained: number;
  combo: number;
  praise: string | null;
  perfect: boolean;
  shake: boolean;
  /** Cells in the placed piece (for the landing sound). */
  placedCells: number;
  /** Special-block blasts in this clear (for their own sounds). */
  special: "bomb" | "rocket" | "blast" | null;
  /** Goal milestone reached by this move. */
  milestone: "half" | "almost" | null;
  /** This move beat the player's previous best score. */
  newBest: boolean;
  /** The next move is the last chance to keep the combo alive. */
  comboWarning: boolean;
  /** Special blocks that went off (for their beams). */
  fired?: Array<{ r: number; c: number; sp: "bomb" | "rocketH" | "rocketV" | "blast" }>;
  /** A one-line explanation, shown the first time each special fires in a run. */
  caption?: string | null;
  /** A star block that paid out on drop (sparkle + "+50 ★"). */
  star?: { r: number; c: number; gold: boolean; bonus: number } | null;
};

/** What each special block did, in plain words. */
export const SPECIAL_CAPTION: Record<"bomb" | "rocketH" | "rocketV" | "blast", string> = {
  rocketV: "ZAP! ↕ The arrow cleared its whole up-and-down line.",
  rocketH: "ZAP! ↔ The arrow cleared its whole side-to-side line.",
  bomb: "BOOM! The bomb cleared the blocks all around it.",
  blast: "WOW! The golden block cleared the whole board.",
};

/** What the results screen shows about the run that just ended. */
export type RunResult = {
  iq: number;
  /** Percentile vs. scores on the board (or the player's own games). */
  pct: number | null;
  versus: "players" | "your games";
  awards: Award[];
  run: RunStats;
};

/** Per-run flags so each milestone is celebrated once. */
type RunFlags = { half: boolean; almost: boolean; newBest: boolean; bestAtStart: number; explained?: string[] };

type GameStore = {
  ready: boolean;
  started: boolean;
  tab: Tab;
  panel: Panel;
  profile: Profile;
  match: Match;
  selected: number | null;
  targeting: PowerId | null;
  fx: BoardFx | null;
  run: RunFlags;
  runStats: RunStats;
  lastResult: RunResult | null;
  toast: string | null;
  levelUpTo: number | null;
  /** The Adventure unlock being introduced on the "New!" card. */
  introUnlock: UnlockId | null;
  /** The hands-on tutorial in progress (the real game waits in `saved`). */
  tutorial: { lesson: LessonId; index: number; phase: "intro" | "play" | "praise" | "done"; saved: Match } | null;
  /** Open a lesson; `welcome` shows the Start / Skip screen first. */
  startTutorial: (lesson: LessonId, welcome?: boolean) => void;
  /** Welcome screen → first move. */
  beginTutorial: () => void;
  /** "Tutorial complete" screen → back to the real game. */
  finishTutorial: () => void;
  /** Leave the tutorial now (Skip) and go back to the real game. */
  skipTutorial: () => void;
  visitorBusy: boolean;
  visitorEvent: VisitorEvent | null;
  visitorApplied: boolean;
  /** Board cells hidden while a visitor carries a copy of their block. */
  visitorHide: string[];
  pointerBusy: boolean;
  visitorLast: VisitorId | null;
  visitorNextAt: number;
  visitorSeen: Partial<Record<VisitorId, number>>;
  /** Visitor just introduced by this island: arrives first, and early. */
  visitorFeatured: VisitorId | null;
  hydrate: () => void;
  persist: () => void;
  start: () => void;
  setTab: (tab: Tab) => void;
  setPanel: (panel: Panel) => void;
  selectPiece: (index: number | null) => void;
  tryPlace: (trayIndex: number, row: number, col: number) => boolean;
  armPower: (id: PowerId) => void;
  usePowerOnCell: (row: number, col: number) => boolean;
  cancelTarget: () => void;
  /** Play the current mode again (same level, or a fresh Sandbox run). */
  newGame: () => void;
  startAdventure: (levelId: number) => void;
  startClassic: (levelId: number) => void;
  startSandbox: () => void;
  startChallenge: (id: string) => void;
  continueRun: () => void;
  claimDaily: () => void;
  claimQuest: (id: (typeof QUESTS)[number]["id"]) => void;
  buy: (itemId: string) => void;
  setSkin: (skin: SkinId) => void;
  toggleSetting: (key: "sfx" | "music" | "shake" | "voice") => void;
  /** Mark a one-time tip (e.g. a special block's explanation) as read. */
  dismissTip: (key: string) => void;
  resetProgress: () => void;
  dismissLevelUp: () => void;
  setToast: (msg: string | null) => void;
  setPointerBusy: (busy: boolean) => void;
  maybeVisitor: () => void;
  summonVisitor: (id: VisitorId) => boolean;
  commitVisitor: () => void;
  endVisitor: () => void;
  setVisitorHide: (cells: string[]) => void;
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let fxSeq = 1;
let visitSeq = 1;

/**
 * Save after the player pauses, when the phone is idle, so writing the save
 * never lands in the same frame as an animation.
 */
function persistSoon(get: () => GameStore): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => get().persist(), { timeout: 2000 });
    else get().persist();
  }, 700);
}

function centerOf(cells: Array<{ r: number; c: number }>, fallback: { r: number; c: number }): { r: number; c: number } {
  if (!cells.length) return fallback;
  return {
    r: cells.reduce((n, x) => n + x.r, 0) / cells.length,
    c: cells.reduce((n, x) => n + x.c, 0) / cells.length,
  };
}

/** Cells that were filled in `before` and are empty in `after`. */
function removedCells(before: Cell[][], after: Cell[][]): FlashCell[] {
  const out: FlashCell[] = [];
  before.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell.t !== "e" && after[r]?.[c]?.t === "e") out.push({ r, c, cell: { ...cell } });
    }),
  );
  return out;
}

function applyQuestScore(profile: Profile, match: Match, powersUsed = 0): Profile {
  const q = { ...profile.quests };
  q.lines = { ...q.lines, value: Math.max(q.lines.value, match.lines) };
  q.score = { ...q.score, value: Math.max(q.score.value, match.score) };
  q.combo = { ...q.combo, value: Math.max(q.combo.value, match.bestCombo) };
  if (powersUsed) q.powers = { ...q.powers, value: q.powers.value + powersUsed };
  return { ...profile, quests: q };
}

function grantXp(profile: Profile, xp: number): { profile: Profile; leveled: number | null } {
  let next = { ...profile, xp: profile.xp + xp };
  let leveled: number | null = null;
  while (next.xp >= xpForLevel(next.level)) {
    next = {
      ...next,
      xp: next.xp - xpForLevel(next.level),
      level: next.level + 1,
      coins: next.coins + 40 + next.level * 4,
      gems: next.gems + 3,
    };
    leveled = next.level;
  }
  return { profile: next, leveled };
}

export const useGame = create<GameStore>((set, get) => ({
  ready: true,
  started: false,
  tab: "home",
  panel: null,
  profile: defaultProfile(),
  match: firstMatch(),
  selected: 0,
  targeting: null,
  fx: null,
  run: { half: false, almost: false, newBest: false, bestAtStart: 0 },
  runStats: emptyRun("adventure", 1),
  lastResult: null,
  toast: null,
  levelUpTo: null,
  introUnlock: null,
  tutorial: null,
  visitorBusy: false,
  visitorEvent: null,
  visitorApplied: false,
  visitorHide: [],
  pointerBusy: false,
  visitorLast: null,
  visitorNextAt: 8,
  visitorSeen: {},
  visitorFeatured: null,

  hydrate: () => {
    const profile = ensureMatch(loadProfile());
    audio.setMuted(profile.settings.sfx, profile.settings.music);
    setVoiceEnabled(profile.settings.voice !== false && profile.settings.sfx);
    warmVoices();
    void connectBoard(profile.card);
    const match = sanitizeMatch(profile.match ?? firstMatch());
    set({
      ready: true,
      profile,
      match,
      started: false,
      panel: null,
      run: runFlagsFor(match, profile, true),
      runStats: emptyRun(match.mode, match.levelId),
    });
    // New (and returning) players play through the tutorial once; Skip is always there.
    if (!profile.tutorialDone) get().startTutorial("basics", true);
  },

  persist: () => {
    const { profile, match, tutorial } = get();
    saveProfile({ ...profile, match: tutorial ? tutorial.saved : match });
  },

  startTutorial: (lesson, welcome = false) => {
    const steps = LESSONS[lesson];
    const { match, tutorial } = get();
    const saved = tutorial ? tutorial.saved : match;
    set({
      tutorial: { lesson, index: 0, phase: welcome ? "intro" : "play", saved },
      match: stepMatch(steps[0]!),
      panel: null,
      tab: "home",
      selected: null,
      targeting: null,
    });
  },

  beginTutorial: () => {
    const t = get().tutorial;
    if (!t || t.phase !== "intro") return;
    audio.unlockAudio();
    audio.sfxUi();
    set({ tutorial: { ...t, phase: "play" } });
  },

  finishTutorial: () => {
    const { tutorial, profile } = get();
    if (!tutorial) return;
    endTutorial(get, set, tutorial.lesson, profile);
  },

  skipTutorial: () => {
    const { tutorial, profile } = get();
    if (!tutorial) return;
    endTutorial(get, set, tutorial.lesson, profile);
  },


  start: () => {
    audio.unlockAudio();
    primeVoice();
    const { profile } = get();
    audio.setMuted(profile.settings.sfx, profile.settings.music);
    set({ started: true });
  },

  setTab: (tab) => {
    audio.sfxUi();
    set({ tab, panel: tab === "home" ? get().panel : null, targeting: null });
  },

  setPanel: (panel) => {
    if (panel) audio.sfxUi();
    const { profile } = get();
    if (panel !== "how" && (!profile.seenHowTo || !profile.seenShapesIntro)) {
      set({ panel, profile: { ...profile, seenHowTo: true, seenShapesIntro: true } });
      persistSoon(get);
      return;
    }
    set({ panel });
  },

  selectPiece: (index) => set({ selected: index, targeting: null }),

  tryPlace: (trayIndex, row, col) => {
    const { match, profile, visitorBusy, tutorial } = get();
    if (visitorBusy) return false;
    if (tutorial) return tutorialPlace(get, set, trayIndex, row, col);
    const placedPiece = match.tray[trayIndex];
    const result = placePiece(match, trayIndex, row, col);
    if (!result.ok) {
      audio.feelNope();
      return false;
    }
    let nextProfile: Profile = {
      ...profile,
      coins: profile.coins + result.coins,
      highScore: Math.max(profile.highScore, result.match.score),
      bestCombo: Math.max(profile.bestCombo, result.match.bestCombo),
    };
    const xpGain = Math.max(4, Math.floor(result.gained / 12));
    const leveled = grantXp(nextProfile, xpGain);
    nextProfile = applyQuestScore(leveled.profile, result.match);
    if (result.match.mode === "sandbox") {
      nextProfile = { ...nextProfile, sandboxBest: Math.max(nextProfile.sandboxBest, result.match.score) };
    }
    // Run stats for the results screen and leaderboard.
    const rs: RunStats = { ...get().runStats, colors: { ...get().runStats.colors }, lineTimes: [...get().runStats.lineTimes] };
    const now = Date.now();
    rs.pieces += 1;
    rs.score = result.match.score;
    rs.bestCombo = result.match.bestCombo;
    rs.perfects = result.match.perfects;
    if (result.clear) {
      rs.lines += result.clear.lines;
      for (let i = 0; i < result.clear.lines; i++) rs.lineTimes.push(now);
      for (const { cell } of result.clear.cells) {
        if (cell.t === "b" || cell.t === "s") rs.colors[cell.c] = (rs.colors[cell.c] ?? 0) + 1;
      }
    }
    let lastResult = get().lastResult;
    if (result.match.won || result.match.over) {
      const finished = finishRun(rs, result.match, nextProfile);
      nextProfile = finished.profile;
      lastResult = finished.result;
    }
    if (result.match.won) {
      const ratio = result.match.goal ? result.match.goalProgress / result.match.goal.value : 1;
      const stars = ratio >= 1.6 ? 3 : ratio >= 1.2 ? 2 : 1;
      const id = result.match.levelId;
      if (result.match.mode === "adventure" && id) {
        const lvl = ADVENTURE.find((l) => l.id === id);
        if (lvl) {
          const prev = nextProfile.adventure.stars[String(lvl.id)] ?? 0;
          nextProfile = {
            ...nextProfile,
            coins: nextProfile.coins + lvl.reward.coins,
            gems: nextProfile.gems + lvl.reward.gems,
            adventure: {
              unlocked: Math.max(nextProfile.adventure.unlocked, lvl.id + 1),
              stars: { ...nextProfile.adventure.stars, [String(lvl.id)]: Math.max(prev, stars) },
            },
          };
        }
      } else if (result.match.mode === "classic" && id) {
        const lvl = CLASSIC.find((l) => l.id === id);
        if (lvl) {
          const prev = nextProfile.classic.stars[String(lvl.id)] ?? 0;
          nextProfile = {
            ...nextProfile,
            coins: nextProfile.coins + lvl.reward.coins,
            gems: nextProfile.gems + lvl.reward.gems,
            classic: {
              unlocked: Math.max(nextProfile.classic.unlocked, lvl.id + 1),
              stars: { ...nextProfile.classic.stars, [String(lvl.id)]: Math.max(prev, stars) },
            },
          };
        }
      } else if (result.match.mode === "challenge") {
        const ch = CHALLENGES.find((c) => c.goal.type === result.match.goal?.type && c.goal.value === result.match.goal.value);
        nextProfile = {
          ...nextProfile,
          coins: nextProfile.coins + (ch?.reward.coins ?? 70),
          gems: nextProfile.gems + (ch?.reward.gems ?? 5),
        };
      }
    }
    const landed = placedPiece ? placedPiece.cells.map(([dr, dc]) => ({ r: row + dr, c: col + dc })) : [];
    const clear = result.clear;
    // Milestones: celebrate each once per run.
    const run = { ...get().run };
    let milestone: BoardFx["milestone"] = null;
    const m = result.match;
    if (m.goal && !m.won) {
      const pct = m.goalProgress / m.goal.value;
      if (pct >= 0.85 && !run.almost) {
        run.almost = true;
        run.half = true;
        milestone = "almost";
      } else if (pct >= 0.5 && !run.half) {
        run.half = true;
        milestone = "half";
      }
    }
    let newBest = false;
    if (!run.newBest && run.bestAtStart > 0 && m.score > run.bestAtStart && (m.mode === "sandbox" || !m.goal)) {
      run.newBest = true;
      newBest = true;
    }
    // Explain each kind of special the first time it fires in a run.
    let caption: string | null = null;
    for (const f of clear?.fired ?? []) {
      const seen = run.explained ?? [];
      if (!seen.includes(f.sp)) {
        caption = SPECIAL_CAPTION[f.sp];
        run.explained = [...seen, f.sp];
        break;
      }
    }
    if (placedPiece && !nextProfile.seenShapes.includes(placedPiece.shape)) {
      nextProfile = { ...nextProfile, seenShapes: [...nextProfile.seenShapes, placedPiece.shape] };
    }
    const fx: BoardFx = {
      id: fxSeq++,
      landed,
      cleared: clear?.cells ?? [],
      rows: clear?.rows ?? [],
      cols: clear?.cols ?? [],
      origin: centerOf(landed, { r: row, c: col }),
      gained: result.gained,
      combo: result.combo,
      praise: clear ? praiseFor(clear.lines, result.perfect) : null,
      perfect: result.perfect,
      shake: Boolean(clear && profile.settings.shake && (clear.lines >= 2 || clear.bombs || clear.blasts || result.perfect)),
      placedCells: placedPiece?.cells.length ?? 1,
      special: clear?.blasts ? "blast" : clear?.bombs ? "bomb" : clear?.rockets ? "rocket" : null,
      milestone,
      newBest,
      comboWarning: !clear && m.combo > 0 && m.sinceClear === COMBO_WINDOW - 1,
      fired: clear?.fired ?? [],
      caption,
      star: result.star ?? null,
    };
    set({
      match: result.match,
      profile: nextProfile,
      selected: result.match.tray.findIndex((p) => p),
      fx,
      run,
      runStats: rs,
      lastResult,
      levelUpTo: leveled.leveled,
      panel: result.match.won ? "won" : result.match.over ? "over" : get().panel,
    });
    persistSoon(get);
    return true;
  },

  armPower: (id) => {
    const { profile, match, targeting, visitorBusy } = get();
    if (visitorBusy || get().tutorial) return;
    if (profile.powerups[id] <= 0) {
      set({ panel: "shop", toast: "Buy more in the shop." });
      return;
    }
    if (id === "refresh") {
      const next = refreshTray(match);
      const nextProfile = applyQuestScore(
        { ...profile, powerups: { ...profile.powerups, refresh: profile.powerups.refresh - 1 } },
        next,
        1,
      );
      audio.sfxUi();
      set({ match: next, profile: nextProfile, targeting: null, selected: next.tray.findIndex((p) => p) });
      persistSoon(get);
      return;
    }
    if (id === "freeze") {
      const next = applyFreeze(match);
      const nextProfile = applyQuestScore(
        { ...profile, powerups: { ...profile.powerups, freeze: profile.powerups.freeze - 1 } },
        next,
        1,
      );
      audio.sfxUi();
      set({
        match: next,
        profile: nextProfile,
        targeting: null,
        toast: "Combo shield ready for two drops.",
      });
      persistSoon(get);
      window.setTimeout(() => set({ toast: null }), 1600);
      return;
    }
    set({ targeting: targeting === id ? null : id, selected: null });
  },

  usePowerOnCell: (row, col) => {
    const { targeting, match, profile, visitorBusy } = get();
    if (!targeting || visitorBusy) return false;
    const used =
      targeting === "hammer" ? hammerCell(match, row, col) : targeting === "bomb" ? bombCell(match, row, col) : null;
    if (!used) {
      audio.sfxBad();
      return false;
    }
    if (targeting === "bomb") audio.sfxBomb();
    else audio.sfxPlace();
    const nextProfile = applyQuestScore(
      {
        ...profile,
        powerups: { ...profile.powerups, [targeting]: profile.powerups[targeting] - 1 },
      },
      used,
      1,
    );
    const cleared = removedCells(match.board, used.board);
    set({
      match: used,
      profile: nextProfile,
      targeting: null,
      panel: used.over ? "over" : get().panel,
      fx: {
        id: fxSeq++,
        landed: [],
        cleared,
        rows: [],
        cols: [],
        origin: { r: row, c: col },
        gained: 0,
        combo: 0,
        praise: null,
        perfect: false,
        shake: targeting === "bomb" && profile.settings.shake,
        placedCells: 0,
        special: null,
        milestone: null,
        newBest: false,
        comboWarning: false,
      },
    });
    persistSoon(get);
    return true;
  },

  cancelTarget: () => set({ targeting: null }),

  newGame: () => {
    const { match } = get();
    const id = match.levelId;
    if (match.mode === "adventure" && id) return get().startAdventure(id);
    if (match.mode === "classic" && id) return get().startClassic(id);
    if (match.mode === "challenge") {
      const ch = CHALLENGES.find((c) => c.goal.type === match.goal?.type && c.goal.value === match.goal?.value);
      if (ch) return get().startChallenge(ch.id);
    }
    get().startSandbox();
  },

  startSandbox: () => {
    audio.sfxUi();
    beginRun(get, set, newSandboxMatch());
  },

  startAdventure: (levelId) => {
    const level = ADVENTURE.find((l) => l.id === levelId);
    if (!level) return;
    const { profile } = get();
    if (levelId > profile.adventure.unlocked) {
      set({ toast: "Clear the previous island first." });
      window.setTimeout(() => set({ toast: null }), 1400);
      return;
    }
    audio.sfxUi();
    const match = newLevelMatch("adventure", level.id, level.goal, level.stones, adventureFeatures(level.id));
    beginRun(get, set, match);
    // A visitor this island introduces drops in early, and before anyone else.
    const introVisitor = VISITOR_IDS.find((v) => v === level.introduces) ?? null;
    if (introVisitor) set({ visitorFeatured: introVisitor, visitorNextAt: 3 });
    // Introduce the level's new block or visitor the first time it appears.
    const intro = level.introduces;
    if (intro && !get().profile.seenUnlocks.includes(intro)) {
      const p = get().profile;
      set({ panel: "intro", introUnlock: intro, profile: { ...p, seenUnlocks: [...p.seenUnlocks, intro] } });
      persistSoon(get);
    }
  },

  startClassic: (levelId) => {
    const level = CLASSIC.find((l) => l.id === levelId);
    if (!level) return;
    if (levelId > get().profile.classic.unlocked) {
      set({ toast: "Clear the previous level first." });
      window.setTimeout(() => set({ toast: null }), 1400);
      return;
    }
    audio.sfxUi();
    beginRun(get, set, newLevelMatch("classic", level.id, level.goal, 0, PLAIN_FEATURES));
  },

  startChallenge: (id) => {
    const challenge = CHALLENGES.find((c) => c.id === id);
    if (!challenge) return;
    audio.sfxUi();
    beginRun(get, set, newGoalMatch(challenge.goal));
  },

  continueRun: () => {
    const { profile, match } = get();
    if (profile.gems < CONTINUE_COST) {
      set({ panel: "shop", toast: `Need ${CONTINUE_COST} gems to continue.` });
      return;
    }
    const next = continueMatch(match);
    audio.sfxWin();
    const prev = get().runStats;
    set({
      runStats: { ...emptyRun(next.mode, next.levelId), startedAt: prev.startedAt },
      match: next,
      profile: { ...profile, gems: profile.gems - CONTINUE_COST },
      panel: null,
      selected: next.tray.findIndex((p) => p),
    });
    persistSoon(get);
  },

  claimDaily: () => {
    const { profile } = get();
    const now = Date.now();
    if (now < profile.daily.nextAt) return;
    const sameStreak = now - profile.daily.lastClaim < 48 * 3600 * 1000 && profile.daily.lastClaim > 0;
    const streak = sameStreak ? profile.daily.streak + 1 : 1;
    const coins = 50 + streak * 8;
    const gems = 4 + Math.min(6, streak);
    audio.sfxCoin();
    set({
      profile: {
        ...profile,
        coins: profile.coins + coins,
        gems: profile.gems + gems,
        daily: { lastClaim: now, streak, nextAt: now + 8 * 3600 * 1000 },
      },
      toast: `Daily gift: +${coins} coins, +${gems} gems`,
    });
    persistSoon(get);
    window.setTimeout(() => set({ toast: null }), 1800);
  },

  claimQuest: (id) => {
    const { profile } = get();
    const def = QUESTS.find((q) => q.id === id);
    const progress = profile.quests[id];
    if (!def || !progress || progress.claimed || progress.value < def.target) return;
    audio.sfxCoin();
    set({
      profile: {
        ...profile,
        coins: profile.coins + def.coins,
        gems: profile.gems + def.gems,
        quests: { ...profile.quests, [id]: { ...progress, claimed: true } },
      },
    });
    persistSoon(get);
  },

  buy: (itemId) => {
    const { profile } = get();
    const pack = itemId === "pack";
    const pouch = itemId === "coins";
    if (pack) {
      if (profile.gems < 90) {
        set({ toast: "Not enough gems." });
        return;
      }
      audio.sfxCoin();
      set({
        profile: {
          ...profile,
          gems: profile.gems - 90,
          powerups: {
            hammer: profile.powerups.hammer + 2,
            refresh: profile.powerups.refresh + 2,
            bomb: profile.powerups.bomb + 2,
            freeze: profile.powerups.freeze + 2,
          },
        },
        toast: "Packed four tools.",
      });
      persistSoon(get);
      return;
    }
    if (pouch) {
      if (profile.gems < 40) {
        set({ toast: "Not enough gems." });
        return;
      }
      audio.sfxCoin();
      set({
        profile: { ...profile, gems: profile.gems - 40, coins: profile.coins + 400 },
        toast: "+400 coins",
      });
      persistSoon(get);
      return;
    }
    const prices: Record<string, { coins: number; power: PowerId }> = {
      hammer: { coins: 90, power: "hammer" },
      refresh: { coins: 70, power: "refresh" },
      bomb: { coins: 140, power: "bomb" },
      freeze: { coins: 110, power: "freeze" },
    };
    const item = prices[itemId];
    if (!item) return;
    if (profile.coins < item.coins) {
      set({ toast: "Not enough coins." });
      return;
    }
    audio.sfxCoin();
    set({
      profile: {
        ...profile,
        coins: profile.coins - item.coins,
        powerups: { ...profile.powerups, [item.power]: profile.powerups[item.power] + 1 },
      },
    });
    persistSoon(get);
  },

  setSkin: (skin) => {
    audio.sfxUi();
    set({ profile: { ...get().profile, skin } });
    persistSoon(get);
  },

  dismissTip: (key) => {
    const { profile } = get();
    if (profile.seenSpecialTips.includes(key)) return;
    set({ profile: { ...profile, seenSpecialTips: [...profile.seenSpecialTips, key] } });
    persistSoon(get);
  },
  toggleSetting: (key) => {
    const { profile } = get();
    const settings = { ...profile.settings, [key]: !profile.settings[key] };
    audio.unlockAudio();
    audio.setMuted(settings.sfx, settings.music);
    setVoiceEnabled(settings.voice !== false && settings.sfx);
    set({ profile: { ...profile, settings } });
    persistSoon(get);
  },

  resetProgress: () => {
    const fresh = defaultProfile();
    const match = firstMatch();
    set({ profile: fresh, match, panel: "how", selected: 0, tab: "home" });
    saveProfile({ ...fresh, match });
  },

  dismissLevelUp: () => set({ levelUpTo: null }),

  setToast: (msg) => set({ toast: msg }),

  setPointerBusy: (busy) => set({ pointerBusy: busy }),

  maybeVisitor: () => {
    const s = get();
    if (!s.started || s.tab !== "home" || s.panel || s.visitorBusy || s.visitorEvent || s.pointerBusy || s.targeting) return;
    if (s.match.over || s.match.won) return;
    if (s.match.features.visitors.length === 0) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (s.match.moves < Math.max(s.visitorFeatured ? 3 : 6, s.visitorNextAt)) return;
    startVisit(get, set, null);
  },

  summonVisitor: (id) => startVisit(get, set, id),

  commitVisitor: () => {
    const { visitorEvent, visitorApplied, match } = get();
    if (!visitorEvent || visitorApplied) return;
    const result = applyVisitorAction(match, visitorEvent.action);
    if (!result) {
      set({ visitorApplied: true });
      return;
    }
    const clear = result.clear;
    set({
      match: result.match,
      visitorApplied: true,
      fx: clear
        ? {
            id: fxSeq++,
            landed: [],
            cleared: clear.cells,
            rows: clear.rows,
            cols: clear.cols,
            origin: centerOf(clear.cells, { r: 3, c: 3 }),
            gained: 0,
            combo: 0,
            praise: praiseFor(clear.lines, false),
            perfect: false,
            shake: false,
            placedCells: 0,
            special: null,
            milestone: null,
            newBest: false,
            comboWarning: false,
          }
        : get().fx,
    });
    persistSoon(get);
  },

  setVisitorHide: (cells) => set({ visitorHide: cells }),

  endVisitor: () => {
    const { match } = get();
    set({
      visitorBusy: false,
      visitorEvent: null,
      visitorApplied: false,
      visitorHide: [],
      visitorNextAt: nextVisitAt(match.moves, Math.random),
    });
  },
}));

/**
 * A run just ended: score it (Puzzle IQ), fold it into the player's card,
 * work out percentile and awards, and post the card to the leaderboard.
 */
function finishRun(rs: RunStats, match: Match, profile: Profile): { profile: Profile; result: RunResult } {
  const run: RunStats = { ...rs, endedAt: Date.now(), won: match.won, spacesLeft: match.board.flat().filter((c) => c.t === "e").length };
  const iq = puzzleIq(run);
  const levelMode = match.mode === "classic" || match.mode === "adventure";
  const levelStreak = levelMode ? (match.won ? profile.levelStreak + 1 : 0) : profile.levelStreak;
  const before = profile.card;
  const card = addRun(before, run, iq, levelStreak);
  const board = useBoard.getState();
  const cards = { ...board.cards, [board.myId]: card };
  // Compare against real results only: other players' recent IQs, or the
  // player's own earlier games when there aren't enough of those.
  const others = Object.entries(cards)
    .filter(([id]) => id !== board.myId)
    .flatMap(([, c]) => c.iqs ?? []);
  let pct = percentileOf(iq, others);
  let versus: RunResult["versus"] = "players";
  if (pct === null) {
    pct = percentileOf(iq, before.iqs ?? []);
    versus = "your games";
  }
  const awards = awardsFor(board.myId, cards, Object.keys(cards).length > 1 ? null : before);
  void postCard(card);
  return { profile: { ...profile, card, levelStreak }, result: { iq, pct, versus, awards, run } };
}

/** One move in the tutorial: it must go on the glowing spot. */
function tutorialPlace(get: () => GameStore, set: (partial: Partial<GameStore>) => void, trayIndex: number, row: number, col: number): boolean {
  const { tutorial, match, profile } = get();
  if (!tutorial || tutorial.phase !== "play") return false;
  const step = LESSONS[tutorial.lesson][tutorial.index]!;
  // Be forgiving: anywhere close to the glowing spot counts.
  if (Math.abs(row - step.at.r) > 2 || Math.abs(col - step.at.c) > 2) {
    audio.feelNope();
    set({ toast: "Try the glowing squares!" });
    window.setTimeout(() => get().toast === "Try the glowing squares!" && set({ toast: null }), 1400);
    return false;
  }
  row = step.at.r;
  col = step.at.c;
  const placedPiece = match.tray[trayIndex];
  const result = placePiece(match, trayIndex, row, col);
  if (!result.ok) {
    audio.feelNope();
    return false;
  }
  // Only this step's piece: no refills, no game over.
  const next = { ...result.match, tray: [null, null, null], over: false, won: false };
  const clear = result.clear;
  const landed = placedPiece ? placedPiece.cells.map(([dr, dc]) => ({ r: row + dr, c: col + dc })) : [];
  const fx: BoardFx = {
    id: fxSeq++,
    landed,
    cleared: clear?.cells ?? [],
    rows: clear?.rows ?? [],
    cols: clear?.cols ?? [],
    origin: centerOf(landed, { r: row, c: col }),
    gained: result.gained,
    combo: 0,
    praise: null,
    perfect: false,
    shake: Boolean(clear && profile.settings.shake && (clear.bombs || clear.blasts)),
    placedCells: placedPiece?.cells.length ?? 1,
    special: clear?.blasts ? "blast" : clear?.bombs ? "bomb" : clear?.rockets ? "rocket" : null,
    milestone: null,
    newBest: false,
    comboWarning: false,
    fired: clear?.fired ?? [],
    caption: null,
  };
  set({ match: next, fx, selected: null, tutorial: { ...tutorial, phase: "praise" } });
  cheer(step.praise, { delayMs: 350 });
  const lessonAt = tutorial.lesson;
  const indexAt = tutorial.index;
  window.setTimeout(() => {
    const t = get().tutorial;
    if (!t || t.lesson !== lessonAt || t.index !== indexAt) return;
    const steps = LESSONS[t.lesson];
    if (t.index + 1 < steps.length) {
      set({ tutorial: { ...t, index: t.index + 1, phase: "play" }, match: stepMatch(steps[t.index + 1]!) });
    } else {
      // Celebrate on a "Tutorial complete" screen; its button returns to the game.
      audio.feelLevelComplete();
      cheer(t.lesson === "basics" ? "Tutorial complete! You're ready!" : "You got it!", { delayMs: 300, priority: true });
      set({ tutorial: { ...t, phase: "done" } });
    }
  }, clear?.blasts || clear?.bombs || clear?.rockets ? 2100 : 1600);
  return true;
}

function endTutorial(get: () => GameStore, set: (partial: Partial<GameStore>) => void, lesson: LessonId, profile: Profile): void {
  const t = get().tutorial;
  if (!t) return;
  const tips = lesson === "arrows" ? ["rocketH", "rocketV"] : lesson === "bombs" ? ["bomb"] : lesson === "blast" ? ["blast"] : [];
  const nextProfile: Profile = {
    ...profile,
    tutorialDone: true,
    seenHowTo: true,
    seenShapesIntro: true,
    seenSpecialTips: [...new Set([...profile.seenSpecialTips, ...tips, `lesson:${lesson}`])],
  };
  set({
    tutorial: null,
    match: t.saved,
    profile: nextProfile,
    selected: null,
    toast: lesson === "basics" ? "You’re ready! Have fun." : "Now you know! Back to your game.",
  });
  window.setTimeout(() => set({ toast: null }), 1800);
  persistSoon(get);
}

/** Fresh milestone flags; `resume` keeps flags already earned in a saved run. */
function runFlagsFor(match: Match, profile: Profile, resume: boolean): RunFlags {
  const pct = match.goal ? match.goalProgress / match.goal.value : 0;
  const best = match.mode === "sandbox" ? profile.sandboxBest : profile.highScore;
  return {
    half: resume && pct >= 0.5,
    almost: resume && pct >= 0.85,
    newBest: resume && match.score >= best && best > 0,
    bestAtStart: best,
  };
}

/** Shared reset for starting any run. */
function beginRun(get: () => GameStore, set: (partial: Partial<GameStore>) => void, match: Match): void {
  const { profile } = get();
  set({
    match,
    tab: "home",
    panel: null,
    selected: 0,
    targeting: null,
    fx: null,
    visitorBusy: false,
    visitorEvent: null,
    visitorApplied: false,
    visitorHide: [],
    visitorLast: null,
    visitorNextAt: 8,
    visitorSeen: {},
    visitorFeatured: null,
    run: runFlagsFor(match, profile, false),
    runStats: emptyRun(match.mode, match.levelId),
    profile: { ...profile, games: profile.games + 1, seenHowTo: true },
  });
  persistSoon(get);
}

function startVisit(
  get: () => GameStore,
  set: (partial: Partial<GameStore>) => void,
  forced: VisitorId | null,
): boolean {
  const s = get();
  if (s.visitorBusy || s.visitorEvent) return false;
  if (s.match.over || s.match.won) return false;
  if (!forced && (s.tab !== "home" || s.panel)) return false;
  const mood = pickMood(s.profile.level, s.match.moves, Math.random);
  const allowed = VISITOR_IDS.filter((id) => s.match.features.visitors.includes(id));
  const pool = allowed.length > 1 ? allowed.filter((id) => id !== s.visitorLast) : allowed;
  const featured = !forced && s.visitorFeatured && allowed.includes(s.visitorFeatured) ? s.visitorFeatured : null;
  const order = forced ? [forced] : featured ? [featured, ...shuffleIds(pool.filter((v) => v !== featured))] : shuffleIds(pool);
  for (const visitor of order) {
    const action = planVisitor(s.match, visitor, mood);
    if (!action) continue;
    const seen = s.visitorSeen[visitor] ?? 0;
    const event: VisitorEvent = {
      id: visitSeq++,
      visitor,
      action,
      mood,
      showName: seen < 2,
    };
    set({
      visitorBusy: true,
      visitorEvent: event,
      visitorApplied: false,
      visitorLast: visitor,
      visitorSeen: { ...s.visitorSeen, [visitor]: seen + 1 },
      visitorFeatured: visitor === s.visitorFeatured ? null : s.visitorFeatured,
      targeting: null,
      tab: "home",
      panel: forced ? null : s.panel,
    });
    return true;
  }
  set({ visitorNextAt: s.match.moves + 3, toast: forced ? "No safe visit right now." : s.toast });
  if (forced) window.setTimeout(() => set({ toast: null }), 1400);
  return false;
}

function shuffleIds(ids: VisitorId[]): VisitorId[] {
  const next = ids.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
}
