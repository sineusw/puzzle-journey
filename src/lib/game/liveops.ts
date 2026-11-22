/**
 * Live game content: the shop catalog (coin + real-money prices), the 7-day
 * login calendar, rotating island events, weekly quests and rewarded videos.
 * Pure data and helpers, so the server can price checkout from the same
 * catalog the shop shows.
 */
import type { PowerId, SkinId } from "./content.ts";
import { SKINS } from "./content.ts";

export type Grant = {
  coins?: number;
  gems?: number;
  powers?: Partial<Record<PowerId, number>>;
  passes?: number;
  skin?: SkinId;
};

/* ------------------------------------------------------------------ shop */

export type ShopSection = "offers" | "boosters" | "passes" | "coins" | "gems";

export type ShopItem = {
  id: string;
  section: ShopSection;
  name: string;
  blurb: string;
  /** Icons drawn on the item card, first one biggest. */
  art: string[];
  /** Big quantity text on the card ("×3", "1,200"). */
  qty?: string;
  /** In-game price, if it can be bought with coins. */
  coins?: number;
  /** In-game price in gems (currency packs). */
  gems?: number;
  /** Real-money price in US dollars. */
  usd?: number;
  grant: Grant;
  tag?: string;
  /** Can only be bought once (starter offer). */
  once?: boolean;
};

export const SHOP: ShopItem[] = [
  {
    id: "starter",
    section: "offers",
    name: "Starter Chest",
    blurb: "2,500 coins, 120 gems, 3 of every booster and 2 Continue Passes.",
    art: ["/icons/gift.webp", "/icons/coin.webp", "/icons/gem.webp"],
    usd: 1.99,
    grant: { coins: 2500, gems: 120, powers: { hammer: 3, refresh: 3, bomb: 3, freeze: 3 }, passes: 2 },
    tag: "80% OFF · One time",
    once: true,
  },
  {
    id: "treasure",
    section: "offers",
    name: "Island Treasure",
    blurb: "15,000 coins, 600 gems, 10 of every booster and 10 Continue Passes.",
    art: ["/icons/gem.webp", "/icons/coin.webp", "/icons/gift.webp"],
    usd: 9.99,
    grant: { coins: 15000, gems: 600, powers: { hammer: 10, refresh: 10, bomb: 10, freeze: 10 }, passes: 10 },
    tag: "Best value",
  },
  { id: "hammer3", section: "boosters", name: "Hammer", blurb: "Smash any one block.", art: ["/icons/hammer.webp"], qty: "×3", coins: 450, usd: 0.99, grant: { powers: { hammer: 3 } } },
  { id: "refresh3", section: "boosters", name: "Reroll", blurb: "Swap your three pieces for new ones.", art: ["/icons/refresh.webp"], qty: "×3", coins: 400, usd: 0.99, grant: { powers: { refresh: 3 } } },
  { id: "bomb3", section: "boosters", name: "Bomb", blurb: "Blast a 3×3 area clean.", art: ["/icons/bomb.webp"], qty: "×3", coins: 700, usd: 1.49, grant: { powers: { bomb: 3 } } },
  { id: "freeze3", section: "boosters", name: "Frost", blurb: "Shields your combo for two drops.", art: ["/icons/frost.webp"], qty: "×3", coins: 550, usd: 0.99, grant: { powers: { freeze: 3 } } },
  {
    id: "crate",
    section: "boosters",
    name: "Booster Crate",
    blurb: "5 of every booster.",
    art: ["/icons/hammer.webp", "/icons/bomb.webp", "/icons/refresh.webp", "/icons/frost.webp"],
    qty: "×20",
    coins: 3000,
    usd: 3.99,
    grant: { powers: { hammer: 5, refresh: 5, bomb: 5, freeze: 5 } },
    tag: "Popular",
  },
  { id: "pass1", section: "passes", name: "Continue Pass", blurb: "Keep going after you run out of room, with easier blocks.", art: ["/icons/refresh.webp"], qty: "×1", coins: 900, usd: 0.99, grant: { passes: 1 } },
  { id: "pass5", section: "passes", name: "Continue Passes", blurb: "Five continues, each with easier blocks after.", art: ["/icons/refresh.webp"], qty: "×5", coins: 4000, usd: 3.99, grant: { passes: 5 }, tag: "Save 20%" },
  { id: "coins1", section: "coins", name: "Pile of Coins", blurb: "", art: ["/icons/coin.webp"], qty: "1,200", gems: 60, usd: 0.99, grant: { coins: 1200 } },
  { id: "coins2", section: "coins", name: "Bag of Coins", blurb: "", art: ["/icons/coin.webp", "/icons/coin.webp"], qty: "6,500", gems: 300, usd: 4.99, grant: { coins: 6500 }, tag: "Popular" },
  { id: "coins3", section: "coins", name: "Chest of Coins", blurb: "", art: ["/icons/coin.webp", "/icons/coin.webp", "/icons/coin.webp"], qty: "15,000", gems: 650, usd: 9.99, grant: { coins: 15000 }, tag: "Best value" },
  { id: "gems1", section: "gems", name: "Handful of Gems", blurb: "", art: ["/icons/gem.webp"], qty: "120", usd: 1.99, grant: { gems: 120 } },
  { id: "gems2", section: "gems", name: "Pouch of Gems", blurb: "", art: ["/icons/gem.webp", "/icons/gem.webp"], qty: "650", usd: 9.99, grant: { gems: 650 }, tag: "Popular" },
  { id: "gems3", section: "gems", name: "Vault of Gems", blurb: "", art: ["/icons/gem.webp", "/icons/gem.webp", "/icons/gem.webp"], qty: "1,500", usd: 19.99, grant: { gems: 1500 }, tag: "Best value" },
];

/** Everything that can be paid for with real money: shop items and skins. */
export function moneyPrice(sku: string): { usd: number; name: string; grant: Grant } | null {
  const item = SHOP.find((i) => i.id === sku);
  if (item?.usd) return { usd: item.usd, name: item.name + (item.qty ? ` ${item.qty}` : ""), grant: item.grant };
  if (sku.startsWith("skin:")) {
    const skin = SKINS.find((s) => s.id === sku.slice(5));
    if (skin?.usd) return { usd: skin.usd, name: `${skin.name} block skin`, grant: { skin: skin.id } };
  }
  return null;
}

export function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

/* ------------------------------------------------------------- live state */

export type Live = {
  ownedSkins: SkinId[];
  passes: number;
  /** One-time offers already bought. */
  bought: string[];
  /** Checkout sessions already paid out (never pay one twice). */
  paid: string[];
  /** 7-day login calendar: days claimed this cycle (0–7) and the last claim day. */
  calendar: { claimed: number; last: string };
  /** Current event and its progress. */
  event: { id: string; pts: number; claimed: number[] };
  /** Weekly quests. */
  weekly: { week: string; prog: Record<string, number>; claimed: string[] };
  /** Daily quest bonus chest. */
  questChest: { day: string; claimed: boolean };
  /** Rewarded videos watched today. */
  ads: { day: string; n: number };
};

export function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Monday-based week key. */
export function weekKey(d = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return `w${dayKey(x)}`;
}

export function emptyLive(): Live {
  return {
    ownedSkins: ["classic"],
    passes: 1,
    bought: [],
    paid: [],
    calendar: { claimed: 0, last: "" },
    event: { id: currentEvent().def.id, pts: 0, claimed: [] },
    weekly: { week: weekKey(), prog: {}, claimed: [] },
    questChest: { day: dayKey(), claimed: false },
    ads: { day: dayKey(), n: 0 },
  };
}

/** Fill in missing fields and roll over anything whose day/week/event ended. */
export function normalizeLive(raw: Partial<Live> | undefined, now = new Date()): Live {
  const base = emptyLive();
  const l: Live = {
    ...base,
    ...raw,
    ownedSkins: Array.from(new Set(["classic" as SkinId, ...(raw?.ownedSkins ?? [])])),
    calendar: { ...base.calendar, ...raw?.calendar },
    event: { ...base.event, ...raw?.event },
    weekly: { ...base.weekly, ...raw?.weekly },
    questChest: { ...base.questChest, ...raw?.questChest },
    ads: { ...base.ads, ...raw?.ads },
  };
  const ev = currentEvent(now).def.id;
  if (l.event.id !== ev) l.event = { id: ev, pts: 0, claimed: [] };
  if (l.weekly.week !== weekKey(now)) l.weekly = { week: weekKey(now), prog: {}, claimed: [] };
  if (l.questChest.day !== dayKey(now)) l.questChest = { day: dayKey(now), claimed: false };
  if (l.ads.day !== dayKey(now)) l.ads = { day: dayKey(now), n: 0 };
  if (l.calendar.claimed >= 7 && l.calendar.last !== dayKey(now)) l.calendar = { claimed: 0, last: l.calendar.last };
  return l;
}

/* -------------------------------------------------------- daily calendar */

export const DAILY_REWARDS: Grant[] = [
  { coins: 150 },
  { powers: { hammer: 1, refresh: 1 } },
  { gems: 25 },
  { coins: 400 },
  { powers: { bomb: 2, freeze: 1 } },
  { passes: 1, coins: 300 },
  { coins: 1500, gems: 80, powers: { hammer: 2, refresh: 2, bomb: 2, freeze: 2 } },
];

export function calendarReady(l: Live, now = new Date()): boolean {
  return l.calendar.last !== dayKey(now) && l.calendar.claimed < 7;
}

/* ----------------------------------------------------------------- events */

export type EventSource = "lines" | "specials" | "score" | "combo";

export type EventDef = {
  id: string;
  name: string;
  blurb: string;
  unit: string;
  token: string;
  source: EventSource;
  /** Gradient for the event banner. */
  colors: [string, string];
};

export const EVENTS: EventDef[] = [
  { id: "lantern", name: "Lantern Festival", blurb: "Every line you clear lights a lantern.", unit: "lanterns", token: "🏮", source: "lines", colors: ["#ff7a3c", "#7a1f6b"] },
  { id: "treasure", name: "Treasure Dive", blurb: "Set off bombs, arrows and star blocks to find pearls.", unit: "pearls", token: "🦪", source: "specials", colors: ["#2ad0e8", "#1b2f8a"] },
  { id: "tiki", name: "Tiki Score Rush", blurb: "Every 100 points carves a tiki.", unit: "tikis", token: "🗿", source: "score", colors: ["#ffc93c", "#9a3d12"] },
  { id: "coconut", name: "Coconut Combo Cup", blurb: "Each combo step knocks down a coconut.", unit: "coconuts", token: "🥥", source: "combo", colors: ["#6fe05a", "#145a3a"] },
];

/** Each event runs for 3 days; they rotate forever. */
const EVENT_DAYS = 3;
const DAY = 86400000;

export function currentEvent(now = new Date()): { def: EventDef; endsAt: number; next: EventDef } {
  const local = now.getTime() - now.getTimezoneOffset() * 60000;
  const day = Math.floor(local / DAY);
  const slot = Math.floor(day / EVENT_DAYS);
  const def = EVENTS[slot % EVENTS.length]!;
  const next = EVENTS[(slot + 1) % EVENTS.length]!;
  const endsLocal = (slot + 1) * EVENT_DAYS * DAY;
  return { def, next, endsAt: endsLocal + now.getTimezoneOffset() * 60000 };
}

export const EVENT_TIERS: Array<{ pts: number; grant: Grant }> = [
  { pts: 15, grant: { coins: 200 } },
  { pts: 40, grant: { powers: { hammer: 2 } } },
  { pts: 80, grant: { gems: 30 } },
  { pts: 130, grant: { passes: 1 } },
  { pts: 200, grant: { coins: 1000, gems: 60, powers: { bomb: 2, freeze: 2 } } },
];

/** Event points earned by one move. */
export function eventPoints(source: EventSource, move: { lines: number; specials: number; gained: number; combo: number }): number {
  if (source === "lines") return move.lines;
  if (source === "specials") return move.specials * 3;
  if (source === "score") return Math.floor(move.gained / 100);
  return move.combo >= 2 ? move.combo - 1 : 0;
}

/* --------------------------------------------------------- weekly quests */

export type WeeklyDef = { id: string; title: string; blurb: string; target: number; grant: Grant };

export const WEEKLY: WeeklyDef[] = [
  { id: "lines", title: "Line Legend", blurb: "Clear 150 lines this week.", target: 150, grant: { coins: 800, gems: 40 } },
  { id: "wins", title: "Island Hopper", blurb: "Win 10 levels this week.", target: 10, grant: { coins: 600, passes: 1 } },
  { id: "specials", title: "Demolition Crew", blurb: "Set off 25 bombs, arrows or star blocks.", target: 25, grant: { powers: { bomb: 3, hammer: 3 } } },
  { id: "combos", title: "Combo King", blurb: "Hit a x3 combo or better 15 times.", target: 15, grant: { gems: 60 } },
];

export const QUEST_CHEST: Grant = { coins: 400, passes: 1 };

/* --------------------------------------------------------------- videos */

/** Rewarded videos a player can watch per day (free coins in the shop). */
export const AD_DAILY_CAP = 6;
export const AD_COINS = 150;

/* ---------------------------------------------------------------- grants */

const POWER_NAME: Record<PowerId, string> = { hammer: "Hammer", refresh: "Reroll", bomb: "Bomb", freeze: "Frost" };

/** Short chips describing a reward: ["200 coins", "2 Hammer"]. */
export function grantParts(g: Grant): Array<{ icon: string; text: string }> {
  const out: Array<{ icon: string; text: string }> = [];
  if (g.coins) out.push({ icon: "/icons/coin.webp", text: g.coins.toLocaleString("en-US") });
  if (g.gems) out.push({ icon: "/icons/gem.webp", text: g.gems.toLocaleString("en-US") });
  for (const [k, n] of Object.entries(g.powers ?? {}) as Array<[PowerId, number]>) {
    if (n) out.push({ icon: `/icons/${k === "freeze" ? "frost" : k}.webp`, text: `${n} ${POWER_NAME[k]}` });
  }
  if (g.passes) out.push({ icon: "/icons/refresh.webp", text: `${g.passes} Continue Pass${g.passes > 1 ? "es" : ""}` });
  if (g.skin) out.push({ icon: "/icons/skins.webp", text: `${SKINS.find((s) => s.id === g.skin)?.name ?? "New"} skin` });
  return out;
}

export function grantText(g: Grant): string {
  return grantParts(g)
    .map((p) => (p.icon.includes("coin") ? `${p.text} coins` : p.icon.includes("gem") ? `${p.text} gems` : p.text))
    .join(", ");
}
