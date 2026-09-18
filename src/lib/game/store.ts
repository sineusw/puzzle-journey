import { create } from "zustand";
import {
  applyFreeze,
  bombCell,
  comboLabel,
  burstLabel,
  continueMatch,
  hammerCell,
  newAdventureMatch,
  newEndlessMatch,
  newGoalMatch,
  placePiece,
  refreshTray,
  rotatePiece,
  sanitizeMatch,
  type Cell,
  type Match,
} from "./engine";
import { ADVENTURE, CHALLENGES, CONTINUE_COST, QUESTS, xpForLevel, type PowerId, type SkinId } from "./content";
import {
  defaultProfile,
  ensureMatch,
  loadProfile,
  saveProfile,
  type Profile,
} from "./save";
import * as audio from "./audio";
import {
  applyVisitorAction,
  nextVisitAt,
  pickMood,
  planVisitor,
  VISITOR_IDS,
  type VisitorEvent,
  type VisitorId,
} from "./visitors";

export type Tab = "home" | "adventure" | "challenges" | "skins" | "more";
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
  | "levelup";

export type FlashCell = { r: number; c: number; cell: Cell };
export type ComboPop = { id: number; label: string; score: number; combo: number };
export type LandedCell = { r: number; c: number };

type GameStore = {
  ready: boolean;
  started: boolean;
  tab: Tab;
  panel: Panel;
  profile: Profile;
  match: Match;
  selected: number | null;
  targeting: PowerId | null;
  flash: FlashCell[];
  landed: LandedCell[];
  shake: boolean;
  comboPop: ComboPop | null;
  toast: string | null;
  levelUpTo: number | null;
  visitorBusy: boolean;
  visitorEvent: VisitorEvent | null;
  visitorApplied: boolean;
  pointerBusy: boolean;
  visitorLast: VisitorId | null;
  visitorNextAt: number;
  visitorSeen: Partial<Record<VisitorId, number>>;
  hydrate: () => void;
  persist: () => void;
  start: () => void;
  setTab: (tab: Tab) => void;
  setPanel: (panel: Panel) => void;
  selectPiece: (index: number | null) => void;
  rotateSelected: () => void;
  tryPlace: (trayIndex: number, row: number, col: number) => boolean;
  armPower: (id: PowerId) => void;
  usePowerOnCell: (row: number, col: number) => boolean;
  cancelTarget: () => void;
  newGame: () => void;
  startAdventure: (levelId: number) => void;
  startChallenge: (id: string) => void;
  continueRun: () => void;
  claimDaily: () => void;
  claimQuest: (id: (typeof QUESTS)[number]["id"]) => void;
  buy: (itemId: string) => void;
  setSkin: (skin: SkinId) => void;
  toggleSetting: (key: "sfx" | "music" | "shake") => void;
  resetProgress: () => void;
  dismissLevelUp: () => void;
  setToast: (msg: string | null) => void;
  setPointerBusy: (busy: boolean) => void;
  maybeVisitor: () => void;
  summonVisitor: (id: VisitorId) => boolean;
  commitVisitor: () => void;
  endVisitor: () => void;
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let popSeq = 1;
let visitSeq = 1;

function persistSoon(get: () => GameStore): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => get().persist(), 250);
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
  match: newEndlessMatch({ showcase: true }),
  selected: 0,
  targeting: null,
  flash: [],
  landed: [],
  shake: false,
  comboPop: null,
  toast: null,
  levelUpTo: null,
  visitorBusy: false,
  visitorEvent: null,
  visitorApplied: false,
  pointerBusy: false,
  visitorLast: null,
  visitorNextAt: 8,
  visitorSeen: {},

  hydrate: () => {
    const profile = ensureMatch(loadProfile());
    audio.setMuted(profile.settings.sfx, profile.settings.music);
    const match = sanitizeMatch(profile.match ?? newEndlessMatch({ showcase: true }));
    set({
      ready: true,
      profile,
      match,
      started: false,
      panel: profile.seenHowTo ? null : "how",
    });
  },

  persist: () => {
    const { profile, match } = get();
    saveProfile({ ...profile, match });
  },

  start: () => {
    audio.unlockAudio();
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
    if (panel !== "how" && !profile.seenHowTo) {
      set({ panel, profile: { ...profile, seenHowTo: true } });
      persistSoon(get);
      return;
    }
    set({ panel });
  },

  selectPiece: (index) => set({ selected: index, targeting: null }),

  rotateSelected: () => {
    const { match, selected, visitorBusy } = get();
    if (visitorBusy) return;
    if (selected === null) return;
    const piece = match.tray[selected];
    if (!piece) return;
    audio.sfxUi();
    const tray = match.tray.slice();
    tray[selected] = rotatePiece(piece);
    set({ match: { ...match, tray } });
    persistSoon(get);
  },

  tryPlace: (trayIndex, row, col) => {
    const { match, profile, visitorBusy } = get();
    if (visitorBusy) return false;
    const placedPiece = match.tray[trayIndex];
    const result = placePiece(match, trayIndex, row, col);
    if (!result.ok) {
      audio.sfxBad();
      return false;
    }
    audio.sfxPlace();
    let nextProfile: Profile = {
      ...profile,
      coins: profile.coins + result.coins,
      highScore: Math.max(profile.highScore, result.match.score),
      bestCombo: Math.max(profile.bestCombo, result.match.bestCombo),
    };
    const xpGain = Math.max(4, Math.floor(result.gained / 12));
    const leveled = grantXp(nextProfile, xpGain);
    nextProfile = applyQuestScore(leveled.profile, result.match);
    if (result.clear) {
      if (result.clear.blasts) audio.sfxBlast();
      else if (result.clear.bombs) audio.sfxBomb();
      else if (result.clear.rockets) audio.sfxRocket();
      else audio.sfxClear(result.combo);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);
    }
    if (result.match.won && result.match.mode === "adventure") {
      if (result.match.levelId) {
        const lvl = ADVENTURE.find((l) => l.id === result.match.levelId);
        if (lvl) {
          const ratio = result.match.goal ? result.match.goalProgress / result.match.goal.value : 1;
          const stars = ratio >= 1.6 ? 3 : ratio >= 1.2 ? 2 : 1;
          const prev = nextProfile.adventure.stars[String(lvl.id)] ?? 0;
          nextProfile = {
            ...nextProfile,
            coins: nextProfile.coins + lvl.reward.coins,
            gems: nextProfile.gems + lvl.reward.gems,
            adventure: {
              unlocked: Math.max(nextProfile.adventure.unlocked, lvl.id + 1),
              stars: {
                ...nextProfile.adventure.stars,
                [String(lvl.id)]: Math.max(prev, stars),
              },
            },
          };
        }
      } else {
        const ch = CHALLENGES.find((c) => c.goal.type === result.match.goal?.type && c.goal.value === result.match.goal.value);
        nextProfile = {
          ...nextProfile,
          coins: nextProfile.coins + (ch?.reward.coins ?? 70),
          gems: nextProfile.gems + (ch?.reward.gems ?? 5),
        };
      }
    }
    const comboPop =
      result.clear && result.combo > 0
        ? {
            id: popSeq++,
            label: result.clear.blasts
              ? "Board wipe"
              : result.clear.bombs
                ? "Boom"
                : result.clear.rockets
                  ? "Rocket"
                  : result.clear.lines >= 2
                    ? burstLabel(result.clear.lines)
                    : comboLabel(result.combo),
            score: result.gained,
            combo: result.combo,
          }
        : null;
    const landed = placedPiece
      ? placedPiece.cells.map(([dr, dc]) => ({ r: row + dr, c: col + dc }))
      : [];
    set({
      match: result.match,
      profile: nextProfile,
      selected: result.match.tray.findIndex((p) => p),
      flash: result.clear?.cells ?? [],
      landed,
      shake: Boolean(result.clear && profile.settings.shake && result.clear.lines >= 2),
      comboPop,
      levelUpTo: leveled.leveled,
      panel: result.match.won ? "won" : result.match.over ? "over" : get().panel,
    });
    if (result.match.won) audio.sfxWin();
    else if (result.match.over) audio.sfxOver();
    persistSoon(get);
    window.setTimeout(() => set({ flash: [], shake: false }), 520);
    window.setTimeout(() => set({ landed: [] }), 360);
    window.setTimeout(() => set({ comboPop: null }), 900);
    return true;
  },

  armPower: (id) => {
    const { profile, match, targeting, visitorBusy } = get();
    if (visitorBusy) return;
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
    set({
      match: used,
      profile: nextProfile,
      targeting: null,
      panel: used.over ? "over" : get().panel,
    });
    persistSoon(get);
    return true;
  },

  cancelTarget: () => set({ targeting: null }),

  newGame: () => {
    audio.sfxUi();
    const { profile } = get();
    const match = newEndlessMatch();
    set({
      match,
      selected: 0,
      targeting: null,
      panel: null,
      tab: "home",
      flash: [],
      visitorBusy: false,
      visitorEvent: null,
      visitorApplied: false,
      visitorLast: null,
      visitorNextAt: 8,
      visitorSeen: {},
      profile: { ...profile, games: profile.games + 1, seenHowTo: true },
    });
    persistSoon(get);
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
    const match = newAdventureMatch(level.id, level.goal, level.stones);
    set({
      match,
      tab: "home",
      panel: null,
      selected: 0,
      targeting: null,
      profile: { ...profile, games: profile.games + 1 },
    });
    persistSoon(get);
  },

  startChallenge: (id) => {
    const challenge = CHALLENGES.find((c) => c.id === id);
    if (!challenge) return;
    audio.sfxUi();
    const { profile } = get();
    const match = newGoalMatch(challenge.goal);
    set({
      match,
      tab: "home",
      panel: null,
      selected: 0,
      targeting: null,
      profile: { ...profile, games: profile.games + 1 },
    });
    persistSoon(get);
  },

  continueRun: () => {
    const { profile, match } = get();
    if (profile.gems < CONTINUE_COST) {
      set({ panel: "shop", toast: `Need ${CONTINUE_COST} gems to continue.` });
      return;
    }
    const next = continueMatch(match);
    audio.sfxWin();
    set({
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

  toggleSetting: (key) => {
    const { profile } = get();
    const settings = { ...profile.settings, [key]: !profile.settings[key] };
    audio.unlockAudio();
    audio.setMuted(settings.sfx, settings.music);
    set({ profile: { ...profile, settings } });
    persistSoon(get);
  },

  resetProgress: () => {
    const fresh = defaultProfile();
    const match = newEndlessMatch({ showcase: true });
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
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (s.match.moves < Math.max(6, s.visitorNextAt)) return;
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
    set({
      match: result.match,
      visitorApplied: true,
      flash: result.clear?.cells ?? [],
    });
    persistSoon(get);
    window.setTimeout(() => set({ flash: [] }), 520);
  },

  endVisitor: () => {
    const { match } = get();
    set({
      visitorBusy: false,
      visitorEvent: null,
      visitorApplied: false,
      visitorNextAt: nextVisitAt(match.moves, Math.random),
    });
  },
}));

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
  const pool = VISITOR_IDS.filter((id) => id !== s.visitorLast);
  const order = forced ? [forced] : shuffleIds(pool);
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
