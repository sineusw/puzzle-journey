import { STAR_TABLE } from "./star-table.ts";
import { PLAIN_FEATURES, cloneFeatures, type Features, type Goal, type Layout } from "./engine.ts";

export type PowerId = "hammer" | "refresh" | "bomb" | "freeze" | "laser" | "cross" | "paint";

export const OBSTACLE_PROGRESSION = [
  { id: "normal", fromLevel: 1, blurb: "Plain candy blocks." },
  { id: "arrow", fromLevel: 2, blurb: "Arrow tiles wipe a row or column." },
  { id: "bomb", fromLevel: 3, blurb: "Bomb tiles blast a 3×3." },
  { id: "stone", fromLevel: 3, blurb: "Stone takes one adjacent clear." },
  { id: "stones", fromLevel: 5, blurb: "More stones on the board." },
  { id: "ice", fromLevel: 6, blurb: "Ice peels off before the block clears." },
  { id: "steel", fromLevel: 7, blurb: "Reinforced stone takes two hits." },
  { id: "chain", fromLevel: 8, blurb: "Chains lock a block until peeled." },
  { id: "crate", fromLevel: 9, blurb: "Crates break beside a clear." },
  { id: "vine", fromLevel: 10, blurb: "Vines threaten neighboring cells." },
  { id: "lock", fromLevel: 11, blurb: "Locks wait for a matching key." },
  { id: "portal", fromLevel: 12, blurb: "Portals pair distant cells." },
] as const;

/** Something Adventure introduces. Each level adds at most one. */
export type UnlockId =
  | "stars"
  | "arrows"
  | "bombs"
  | "milo"
  | "stones"
  | "kai"
  | "luna"
  | "blast"
  | "nia"
  | "pip"
  | "gems"
  | "ice"
  | "chains"
  | "vines"
  | "locks"
  | "hammer"
  | "reroll"
  | "boom"
  | "frost"
  | "laser"
  | "cross"
  | "paint";

export type UnlockInfo = {
  id: UnlockId;
  kind: "block" | "visitor";
  name: string;
  /** One line shown on the "New!" card. */
  blurb: string;
  /** Tile texture (blocks) or character art (visitors), served from /public. */
  art: string;
  /** Icon overlay drawn on the tile art, for special blocks. */
  special?: "bomb" | "rocketV" | "blast";
  /** Obstacle layer drawn on the tile art. */
  overlay?: "ice" | "chain" | "vine" | "lock";
  /** Booster this unlock adds to the bar under the board. */
  power?: PowerId;
};

export const UNLOCKS: Record<UnlockId, UnlockInfo> = {
  stars: { id: "stars", kind: "block", name: "Star blocks", blurb: "Stars are rare: empty the whole board or hit a x10 combo to earn one. Drop it anywhere and every block of its color pops!", art: "/art/tiles/star-blue.webp" },
  arrows: { id: "arrows", kind: "block", name: "Arrow blocks", blurb: "Clear 2 lines at once to make an arrow block. Drop it anywhere: ZAP! Every block in its line disappears.", art: "/art/tiles/cyan.webp", special: "rocketV" },
  bombs: { id: "bombs", kind: "block", name: "Bomb blocks", blurb: "Clear 3 lines at once to make a bomb block. Drop it anywhere: BOOM! The blocks all around it disappear.", art: "/art/tiles/violet.webp", special: "bomb" },
  milo: { id: "milo", kind: "visitor", name: "Milo the Monkey", blurb: "Swings in, grabs a block and hops it somewhere new.", art: "/characters/milo-3d.webp" },
  stones: { id: "stones", kind: "block", name: "Stones", blurb: "Stones are tough. Clear blocks right next to a stone two times and it breaks. No full row needed!", art: "/art/tiles/stone.webp" },
  kai: { id: "kai", kind: "visitor", name: "Kai the Builder", blurb: "Hammers stones apart, or builds a new one.", art: "/characters/kai-3d.webp" },
  luna: { id: "luna", kind: "visitor", name: "Luna the Magician", blurb: "Waves her wand and turns a block into an arrow or a bomb that goes off right away!", art: "/characters/luna-3d.webp" },
  blast: { id: "blast", kind: "block", name: "Board-wipe block", blurb: "Super rare! Clear 4 lines at once (or win 6 islands in a row) to earn it. Put it down and the whole board disappears.", art: "/art/tiles/amber.webp", special: "blast" },
  nia: { id: "nia", kind: "visitor", name: "Nia the Explorer", blurb: "Finds a new path and slides blocks into new spots.", art: "/characters/nia-3d.webp" },
  gems: { id: "gems", kind: "block", name: "Gem blocks", blurb: "Some blocks hold sparkling gems. Clear the row or column they're in to collect them. Collect them all to win!", art: "/icons/gem.webp" },
  ice: { id: "ice", kind: "block", name: "Ice blocks", blurb: "Frozen blocks need two clears: the first breaks the ice, the second clears the block.", art: "/art/tiles/azure.webp", overlay: "ice" },
  chains: { id: "chains", kind: "block", name: "Chained blocks", blurb: "Chains hold a block in place. Clear its row or column once to snap the chain, then again to clear it.", art: "/art/tiles/pink.webp", overlay: "chain" },
  vines: { id: "vines", kind: "block", name: "Vine blocks", blurb: "Jungle vines wrap a block. One clear cuts the vines, the next clears the block.", art: "/art/tiles/lime.webp", overlay: "vine" },
  locks: { id: "locks", kind: "block", name: "Locked blocks", blurb: "A padlock keeps a block on the board for one extra clear. Break it open!", art: "/art/tiles/amber.webp", overlay: "lock" },
  hammer: { id: "hammer", kind: "block", name: "Hammer booster", blurb: "Stuck? Tap the hammer under the board, then tap any block to smash it.", art: "/icons/hammer.webp", power: "hammer" },
  reroll: { id: "reroll", kind: "block", name: "Reroll booster", blurb: "Don't like your pieces? Tap Reroll to swap all three for new ones.", art: "/icons/refresh.webp", power: "refresh" },
  boom: { id: "boom", kind: "block", name: "Bomb booster", blurb: "Tap the bomb, then tap the board: a 3×3 area blows up.", art: "/icons/bomb.webp", power: "bomb" },
  frost: { id: "frost", kind: "block", name: "Frost booster", blurb: "Frost freezes your combo so it won't break for your next two drops.", art: "/icons/frost.webp", power: "freeze" },
  laser: { id: "laser", kind: "block", name: "Laser booster", blurb: "Tap the laser, then tap any block: its whole row is vaporized.", art: "/icons/hammer.webp", power: "laser" },
  cross: { id: "cross", kind: "block", name: "Cross Blast booster", blurb: "Tap Cross Blast, then a block: its row AND column clear at once.", art: "/icons/bomb.webp", power: "cross" },
  paint: { id: "paint", kind: "block", name: "Color Clear booster", blurb: "Tap Color Clear, then a block: every block of that color disappears.", art: "/icons/refresh.webp", power: "paint" },
  pip: { id: "pip", kind: "visitor", name: "Pip the Parrot", blurb: "Drops a paint bomb on a block. If it matches the blocks touching it, the whole group pops!", art: "/characters/pip-3d.webp" },
};

export type AdventureLevel = {
  id: number;
  name: string;
  blurb: string;
  goal: Goal;
  stones: number;
  reward: { coins: number; gems: number };
  /** The one new thing this level introduces, if any. */
  introduces?: UnlockId;
  /** Starting board: pre-placed blocks and gems. */
  layout?: Layout;
  /** Last island of a world: tougher, bigger reward. */
  boss?: boolean;
};

/** The rhythm of goals across each world's 15 islands; the last is the boss. */
const WORLD_RHYTHM: Goal["type"][] = ["gems", "score", "gems", "lines", "gems", "combo", "gems", "score", "lines", "gems", "combo", "gems", "score", "lines", "gems"];

/** Board obstacles and the island they first appear on. */
const OBSTACLES: Array<["ice" | "chain" | "vine" | "lock", number]> = [
  ["ice", 24],
  ["chain", 40],
  ["vine", 56],
  ["lock", 72],
];

/** Every world is 15 islands. */
export const WORLD_SIZE = 15;
export const WORLDS = [
  "Sunny Shore",
  "Coral Reef",
  "Jungle Deep",
  "Crystal Caves",
  "Volcano Isle",
  "Frozen Peaks",
  "Pirate Cove",
  "Sky Kingdom",
  "Moonlit Lagoon",
  "Golden Temple",
  "Mushroom Grove",
  "Sunken City",
  "Thunder Cliffs",
  "Candy Coast",
  "Starfall Bay",
  "Dragon Isle",
  "Rainbow Falls",
  "Mystic Marsh",
  "Cloud Harbor",
  "Treasure Atoll",
];

export function worldOf(levelId: number): { index: number; name: string } {
  const index = Math.floor((levelId - 1) / WORLD_SIZE);
  return { index, name: WORLDS[index % WORLDS.length]! };
}

/** Island Adventure: starts with plain blocks and adds one thing at a time. */
/**
 * Difficulty comes in waves across each world: a couple of easy wins, a harder
 * island, then a bonus island (easy, bigger reward); the boss is the peak.
 */
export const WAVE = [0.85, 0.9, 1.15, 0.8, 1, 0.9, 1.15, 0.8, 0.95, 1.1, 0.85, 1.2, 0.8, 1.05, 1.15];

export const ADVENTURE: AdventureLevel[] = [
  { id: 1, name: "Shore", blurb: "Score 400 to leave the beach.", goal: { type: "score", value: 400 }, stones: 0, reward: { coins: 40, gems: 4 } },
  { id: 2, name: "Palms", blurb: "Clear 5 lines under the palms.", goal: { type: "lines", value: 5 }, stones: 0, reward: { coins: 50, gems: 5 }, introduces: "stars" },
  { id: 3, name: "Cove", blurb: "Score 700 in the cove.", goal: { type: "score", value: 700 }, stones: 0, reward: { coins: 60, gems: 6 }, introduces: "arrows" },
  { id: 4, name: "Falls", blurb: "Reach a x3 combo by the waterfall.", goal: { type: "combo", value: 3 }, stones: 0, reward: { coins: 70, gems: 6 } },
  { id: 5, name: "Lanterns", blurb: "Clear 7 lines by lantern light.", goal: { type: "lines", value: 7 }, stones: 0, reward: { coins: 80, gems: 8 }, introduces: "bombs" },
  { id: 6, name: "Cliff", blurb: "Score 1,000 on the cliff.", goal: { type: "score", value: 1000 }, stones: 0, reward: { coins: 90, gems: 8 }, introduces: "milo" },
  { id: 7, name: "Ruins", blurb: "Clear 8 lines among cracked ruins.", goal: { type: "lines", value: 8 }, stones: 0, reward: { coins: 100, gems: 10 }, introduces: "stones" },
  { id: 8, name: "Quarry", blurb: "Score 1,350 in the old quarry.", goal: { type: "score", value: 1350 }, stones: 0, reward: { coins: 110, gems: 10 }, introduces: "kai" },
  { id: 9, name: "Temple", blurb: "Reach a x4 combo at the temple.", goal: { type: "combo", value: 4 }, stones: 0, reward: { coins: 130, gems: 12 }, introduces: "luna" },
  { id: 10, name: "Summit", blurb: "Score 1,800 on the summit.", goal: { type: "score", value: 1800 }, stones: 0, reward: { coins: 150, gems: 14 }, introduces: "blast" },
  { id: 11, name: "Grotto", blurb: "Clear 10 lines in the glowing grotto.", goal: { type: "lines", value: 10 }, stones: 0, reward: { coins: 160, gems: 14 }, introduces: "nia" },
  { id: 12, name: "Reef", blurb: "Score 2,500 over the reef.", goal: { type: "score", value: 2500 }, stones: 0, reward: { coins: 170, gems: 16 }, introduces: "pip" },
  { id: 13, name: "Lagoon", blurb: "Reach a x4 combo across the lagoon.", goal: { type: "combo", value: 4 }, stones: 0, reward: { coins: 180, gems: 16 } },
  { id: 14, name: "Volcano", blurb: "Clear 12 lines on the volcano's rim.", goal: { type: "lines", value: 12 }, stones: 3, reward: { coins: 200, gems: 18 } },
  { id: 15, name: "Sky Temple", blurb: "Score 3,200 at the Sky Temple.", goal: { type: "score", value: 3200 }, stones: 4, reward: { coins: 240, gems: 24 }, boss: true },
  ...Array.from({ length: WORLDS.length * WORLD_SIZE - 15 }, (_, i) => generatedLevel(i + 16)),
];


/** Islands past the first world: a steady climb with a varied mix of goals. */
function generatedLevel(id: number): AdventureLevel {
  const w = Math.floor((id - 1) / WORLD_SIZE);
  const k = (id - 1) % WORLD_SIZE;
  const wave = WAVE[k]!;
  const bonusIsle = wave <= 0.8;
  const d = Math.min(1, (id - 16) / 285);
  const boss = k === WORLD_SIZE - 1;
  const kind = WORLD_RHYTHM[k]!;
  const world = WORLDS[w % WORLDS.length]!;
  const short = world.split(" ").pop()!;
  let goal: Goal;
  let blurb: string;
  let placedGems = 0;
  if (kind === "gems") {
    const n = Math.min(14, Math.max(4, Math.round((4 + Math.floor(w * 0.5) + (k % 3)) * wave) + (boss ? 1 : 0)));
    // A couple of spare gems on the board, so one stuck in a corner doesn't sink the island.
    const need = Math.max(3, Math.round(n * 0.8));
    goal = { type: "gems", value: need };
    blurb = `Collect ${need} gems.`;
    placedGems = n;
  } else if (kind === "score") {
    const v = Math.round(((2000 + (id - 15) * 11) * wave) / 50) * 50;
    goal = { type: "score", value: v };
    blurb = `Score ${v.toLocaleString("en-US")}.`;
  } else if (kind === "lines") {
    const v = Math.min(32, Math.round((9 + Math.floor((id - 15) / 16)) * wave));
    goal = { type: "lines", value: v };
    blurb = `Clear ${v} lines.`;
  } else {
    const v = Math.min(7, 3 + Math.floor(w / 2));
    goal = { type: "combo", value: v };
    blurb = `Reach a x${v} combo.`;
  }
  const fill = Math.max(0.1, Math.min(0.85, (0.18 + d * 0.3 + (wave - 1) * 0.3 + (boss ? 0.05 : 0)) * (kind === "gems" ? 0.75 : 1)));
  return {
    id,
    name: boss ? `${short} Boss` : bonusIsle ? `${short} Bonus` : `${short} ${k + 1}`,
    blurb,
    goal,
    stones: Math.min(8, 2 + Math.floor(id / 25)),
    reward: { coins: Math.round((150 + id * 2) * (boss ? 2 : bonusIsle ? 1.5 : 1)), gems: (10 + Math.floor(id / 20)) * (boss ? 2 : 1) },
    introduces: id === 16 ? "gems" : undefined,
    layout: {
      fill,
      gems: placedGems,
      high: Math.min(0.7, 0.2 + d * 0.5 + (boss ? 0.2 : 0)),
      // Obstacles ramp up slowly after they're introduced, and not every island has them.
      // At most two obstacle kinds per island (the newest one always included), so late boards stay playable.
      overlays: (() => {
        const all = OBSTACLES.flatMap(([ov, at]) => {
          if (id < at || (id > at + 2 && k % 3 === 2 && !boss)) return [];
          // Obstacles pile up the further you go.
          const n = Math.min(6, 2 + Math.floor((id - at) / 15) + (boss ? 1 : 0));
          return [{ kind: ov, count: id === at ? 3 : n }];
        });
        // Up to two kinds early on, three once the late game starts.
        const kinds = id >= 90 ? 3 : 2;
        if (all.length <= kinds) return all;
        const newest = all[all.length - 1]!;
        const rest = all.slice(0, -1);
        const picks = Array.from({ length: kinds - 1 }, (_, j) => rest[(id + j) % rest.length]!);
        return [...new Set([...picks, newest])];
      })(),
    },
    boss,
  };
}

/**
 * When each new thing shows up. Early on something new every few islands,
 * then spaced further apart so each one gets played with before the next.
 */
export const UNLOCK_SCHEDULE: Record<number, UnlockId> = {
  // Slow start: the first islands are just blocks, then one new thing every few islands,
  // power-ups spread all the way into the late game and obstacles stacking up as it gets harder.
  3: "hammer",
  6: "arrows",
  9: "reroll",
  12: "milo",
  14: "stones",
  16: "gems",
  19: "boom",
  22: "bombs",
  24: "ice",
  27: "frost",
  30: "kai",
  33: "laser",
  36: "stars",
  40: "chains",
  44: "cross",
  48: "luna",
  52: "blast",
  56: "vines",
  60: "paint",
  64: "nia",
  72: "locks",
  80: "pip",
};
for (const lvl of ADVENTURE) lvl.introduces = UNLOCK_SCHEDULE[lvl.id];

export function unlockLevel(id: UnlockId): number {
  const hit = Object.entries(UNLOCK_SCHEDULE).find(([, u]) => u === id);
  return hit ? Number(hit[0]) : Infinity;
}

/**
 * Menus open up as the player progresses, so a first-time player sees just
 * the board and Play. The number is the island (or Classic level) reached.
 */
export const FEATURE_AT = { map: 2, daily: 3, shop: 4, spin: 6, classic: 6, sandbox: 8, events: 9, challenges: 11, ranks: 14 } as const;
export type FeatureId = keyof typeof FEATURE_AT;

/** Boosters the player has reached (bar under the board shows only these). */
export function unlockedPowers(reached: number): PowerId[] {
  return (Object.values(UNLOCKS).filter((u) => u.power && unlockLevel(u.id) <= reached).map((u) => u.power!) as PowerId[]);
}

/** Everything unlocked by the time the player reaches `levelId`. */
export function unlockedAt(levelId: number): UnlockId[] {
  return ADVENTURE.filter((l) => l.id <= levelId && l.introduces).map((l) => l.introduces!);
}

/** The feature set an Adventure level plays with. */
export function adventureFeatures(levelId: number): Features {
  const on = new Set(unlockedAt(levelId));
  const f = cloneFeatures(PLAIN_FEATURES);
  f.stars = on.has("stars");
  if (on.has("arrows")) f.specials.push("rocketH", "rocketV");
  if (on.has("bombs")) f.specials.push("bomb");
  if (on.has("blast")) f.specials.push("blast");
  f.stones = on.has("stones");
  for (const v of ["milo", "kai", "luna", "nia", "pip"] as const) if (on.has(v)) f.visitors.push(v);
  return f;
}

export type ClassicLevel = {
  id: number;
  name: string;
  goal: Goal;
  reward: { coins: number; gems: number };
};

/** Classic: plain blocks only, steadily harder goals. */
export const CLASSIC: ClassicLevel[] = Array.from({ length: 30 }, (_, i) => {
  const id = i + 1;
  const tier = Math.floor(i / 3);
  const kind = i % 3;
  const goal: Goal =
    kind === 0
      ? { type: "score", value: 300 + tier * 260 }
      : kind === 1
        ? { type: "lines", value: 4 + tier * 2 }
        : { type: "combo", value: Math.min(2 + Math.floor(tier / 2), 7) };
  return { id, name: `Classic ${id}`, goal, reward: { coins: 30 + tier * 10, gems: 2 + Math.floor(tier / 2) } };
});

export type ChallengeDef = {
  id: string;
  name: string;
  blurb: string;
  goal: Goal;
  reward: { coins: number; gems: number };
};

export const CHALLENGES: ChallengeDef[] = [
  { id: "tide", name: "Tide lines", blurb: "Clear 8 lines before you stall.", goal: { type: "lines", value: 8 }, reward: { coins: 80, gems: 6 } },
  { id: "summit", name: "Harbor score", blurb: "Score 800 in a single run.", goal: { type: "score", value: 800 }, reward: { coins: 90, gems: 6 } },
  { id: "streak", name: "Lantern combo", blurb: "String a x3 combo.", goal: { type: "combo", value: 3 }, reward: { coins: 70, gems: 5 } },
];

export const SHOP_ITEMS: Array<{
  id: string;
  name: string;
  blurb: string;
  power?: PowerId;
  amount: number;
  coins?: number;
  gems?: number;
}> = [
  { id: "hammer", name: "Hammer", blurb: "Smash one block.", power: "hammer", amount: 1, coins: 90 },
  { id: "refresh", name: "Reroll", blurb: "New set of three blocks.", power: "refresh", amount: 1, coins: 70 },
  { id: "bomb", name: "Bomb", blurb: "Clear a 3×3 blast.", power: "bomb", amount: 1, coins: 140 },
  { id: "freeze", name: "Frost", blurb: "Combo shield for two drops.", power: "freeze", amount: 1, coins: 110 },
  { id: "laser", name: "Laser", blurb: "Clear a whole row.", power: "laser", amount: 1, coins: 160 },
  { id: "cross", name: "Cross Blast", blurb: "Clear a row and a column.", power: "cross", amount: 1, coins: 220 },
  { id: "paint", name: "Color Clear", blurb: "Clear every block of one color.", power: "paint", amount: 1, coins: 260 },
  { id: "pack", name: "Power pack", blurb: "+2 of every tool.", amount: 2, gems: 90 },
  { id: "coins", name: "Coin pouch", blurb: "+400 Jungle Coins.", amount: 400, gems: 40 },
];

export type QuestId = "lines" | "score" | "combo" | "powers";

export type QuestDef = {
  id: QuestId;
  title: string;
  blurb: string;
  target: number;
  coins: number;
  gems: number;
};

export const QUESTS: QuestDef[] = [
  { id: "lines", title: "Line cook", blurb: "Clear 12 lines today.", target: 12, coins: 50, gems: 4 },
  { id: "score", title: "High roller", blurb: "Score 1,000 in a single run.", target: 1000, coins: 50, gems: 4 },
  { id: "combo", title: "On a streak", blurb: "Reach a x3 combo.", target: 3, coins: 40, gems: 3 },
  { id: "powers", title: "Tool time", blurb: "Use 3 power-ups.", target: 3, coins: 30, gems: 2 },
];

export type SkinId = "classic" | "ocean" | "candy" | "jelly" | "tiki" | "pixel" | "faces" | "sunset" | "frost" | "midnight" | "chrome" | "royal" | "holo" | "cosmic";

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

/** Block skins. Each has a coin price and a real-money price. */
export const SKINS: Array<{ id: SkinId; name: string; blurb: string; rarity: Rarity; coins: number; usd: number }> = [
  { id: "classic", name: "Island Gloss", blurb: "The original candy blocks.", rarity: "Common", coins: 0, usd: 0 },
  { id: "ocean", name: "Sea Glass", blurb: "Frosted glass washed up from the tide pools.", rarity: "Rare", coins: 2500, usd: 0.99 },
  { id: "candy", name: "Candy Pop", blurb: "Pastel sweets with sugar sprinkles.", rarity: "Rare", coins: 3000, usd: 0.99 },
  { id: "jelly", name: "Jelly Wobble", blurb: "Squishy see-through jelly full of bubbles.", rarity: "Rare", coins: 3500, usd: 0.99 },
  { id: "tiki", name: "Tiki Wood", blurb: "Hand-carved island wood, nailed and stained.", rarity: "Epic", coins: 4500, usd: 1.99 },
  { id: "pixel", name: "Retro Pixel", blurb: "Old-school 8-bit blocks.", rarity: "Epic", coins: 5000, usd: 1.99 },
  { id: "faces", name: "Happy Blocks", blurb: "Every block has a cute little face.", rarity: "Epic", coins: 5500, usd: 1.99 },
  { id: "frost", name: "Frost Bite", blurb: "Ice-cold crystal blocks.", rarity: "Epic", coins: 5000, usd: 1.99 },
  { id: "sunset", name: "Lava Glow", blurb: "Molten rock straight from the volcano.", rarity: "Epic", coins: 6000, usd: 1.99 },
  { id: "midnight", name: "Neon Night", blurb: "Glowing neon tubes after dark.", rarity: "Epic", coins: 7500, usd: 2.99 },
  { id: "chrome", name: "Chrome", blurb: "Polished metal with a mirror shine.", rarity: "Legendary", coins: 10000, usd: 2.99 },
  { id: "royal", name: "Royal Gems", blurb: "Cut jewels set in solid gold.", rarity: "Legendary", coins: 12000, usd: 3.99 },
  { id: "holo", name: "Holo Foil", blurb: "Rainbow foil that shimmers like a rare card.", rarity: "Legendary", coins: 13500, usd: 3.99 },
  { id: "cosmic", name: "Cosmic", blurb: "A galaxy swirling inside every block.", rarity: "Legendary", coins: 15000, usd: 4.99 },
];

export const CONTINUE_COST = 40;
/** Jungle Coin price of a continue: climbs each time in the same run (250, 500, 1000...). */
export function coinContinueCost(used: number): number {
  return 250 * 2 ** Math.min(4, used);
}

export function xpForLevel(level: number): number {
  return 700 + level * 220;
}

/** Most moves allowed for 3 and for 2 stars; any win earns 1 star. */
export type StarMoves = { three: number; two: number };

/**
 * Star move limits for a level. Campaign levels use limits calibrated from
 * thousands of seeded bot games (tools/simulate.ts), so a score level and a
 * lines level are about equally hard to 3-star. Anything else falls back to
 * a formula.
 */
/** Stars come easier than the bot calibration: 3 stars with 35% more moves, 2 stars with 50% more. */
function generous(m: StarMoves): StarMoves {
  const three = Math.round(m.three * 1.35);
  return { three, two: Math.max(three + 3, Math.round(m.two * 1.5)) };
}

export function starMoves(goal: Goal, mode?: string | null, levelId?: number | null): StarMoves {
  return generous(rawStarMoves(goal, mode, levelId));
}

function rawStarMoves(goal: Goal, mode?: string | null, levelId?: number | null): StarMoves {
  const fixed = (mode === "adventure" || mode === "classic") && levelId ? STAR_TABLE[mode][levelId] : undefined;
  if (fixed) return fixed;
  // Calibrated from bot runs (tools/simulate.ts) so generated islands earn
  // 3 stars about as often as the hand-tuned first world.
  const three =
    goal.type === "score"
      ? Math.ceil(4 + goal.value / 220)
      : goal.type === "lines"
        ? Math.ceil(goal.value * 2.6)
        : goal.type === "gems"
          ? Math.ceil(11 + goal.value * 0.45)
          : Math.ceil(goal.value * 3 + 1);
  return { three, two: Math.round(three * 1.6) };
}

/** Moves for 3 stars ("par"). */
export function starPar(goal: Goal, mode?: string | null, levelId?: number | null): number {
  return starMoves(goal, mode, levelId).three;
}

/** Stars for winning a level in `moves` placements. */
export function starsFor(goal: Goal | null, moves: number, mode?: string | null, levelId?: number | null): 1 | 2 | 3 {
  if (!goal) return 3;
  const { three, two } = starMoves(goal, mode, levelId);
  return moves <= three ? 3 : moves <= two ? 2 : 1;
}

export function goalLabel(goal: Goal): string {
  if (goal.type === "score") return `Score ${goal.value.toLocaleString("en-US")}`;
  if (goal.type === "lines") return `Clear ${goal.value} lines`;
  if (goal.type === "gems") return `Collect ${goal.value} gems`;
  return `Reach a x${goal.value} combo`;
}
