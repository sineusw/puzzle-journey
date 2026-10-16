import { PLAIN_FEATURES, cloneFeatures, type Features, type Goal } from "./engine.ts";

export type PowerId = "hammer" | "refresh" | "bomb" | "freeze";

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
  | "pip";

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
};

export const UNLOCKS: Record<UnlockId, UnlockInfo> = {
  stars: { id: "stars", kind: "block", name: "Star gems", blurb: "Clear a line that has a star in it and you get extra points!", art: "/art/tiles/star-blue.webp" },
  arrows: { id: "arrows", kind: "block", name: "Arrow blocks", blurb: "Put an arrow block down and ZAP! Every block in the line it points along disappears.", art: "/art/tiles/cyan.webp", special: "rocketV" },
  bombs: { id: "bombs", kind: "block", name: "Bomb blocks", blurb: "Put a bomb block down and BOOM! The blocks all around it disappear.", art: "/art/tiles/violet.webp", special: "bomb" },
  milo: { id: "milo", kind: "visitor", name: "Milo the Monkey", blurb: "Swings in, grabs a block and hops it somewhere new.", art: "/characters/milo-3d.png" },
  stones: { id: "stones", kind: "block", name: "Stones", blurb: "Stones are tough. Clear a line through a stone two times to break it.", art: "/art/tiles/stone.webp" },
  kai: { id: "kai", kind: "visitor", name: "Kai the Builder", blurb: "Hammers stones apart, or builds a new one.", art: "/characters/kai-3d.png" },
  luna: { id: "luna", kind: "visitor", name: "Luna the Magician", blurb: "Waves her wand and turns a block into an arrow or a bomb that goes off right away!", art: "/characters/luna-3d.png" },
  blast: { id: "blast", kind: "block", name: "Board-wipe block", blurb: "Super rare! Put the golden block down and every block on the board disappears.", art: "/art/tiles/amber.webp", special: "blast" },
  nia: { id: "nia", kind: "visitor", name: "Nia the Explorer", blurb: "Finds a new path and slides blocks into new spots.", art: "/characters/nia-3d.png" },
  pip: { id: "pip", kind: "visitor", name: "Pip the Parrot", blurb: "Drops a paint bomb that changes a block's color.", art: "/characters/pip-3d.png" },
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
};

/** Island Adventure: starts with plain blocks and adds one thing at a time. */
export const ADVENTURE: AdventureLevel[] = [
  { id: 1, name: "Shore", blurb: "Score 400 to leave the beach.", goal: { type: "score", value: 400 }, stones: 0, reward: { coins: 40, gems: 4 } },
  { id: 2, name: "Palms", blurb: "Clear 6 lines under the palms.", goal: { type: "lines", value: 6 }, stones: 0, reward: { coins: 50, gems: 5 }, introduces: "stars" },
  { id: 3, name: "Cove", blurb: "Score 700 in the cove.", goal: { type: "score", value: 700 }, stones: 0, reward: { coins: 60, gems: 6 }, introduces: "arrows" },
  { id: 4, name: "Falls", blurb: "Reach a x3 combo by the waterfall.", goal: { type: "combo", value: 3 }, stones: 0, reward: { coins: 70, gems: 6 } },
  { id: 5, name: "Lanterns", blurb: "Clear 10 lines by lantern light.", goal: { type: "lines", value: 10 }, stones: 0, reward: { coins: 80, gems: 8 }, introduces: "bombs" },
  { id: 6, name: "Cliff", blurb: "Score 1,100 on the cliff.", goal: { type: "score", value: 1100 }, stones: 0, reward: { coins: 90, gems: 8 }, introduces: "milo" },
  { id: 7, name: "Ruins", blurb: "Clear 12 lines among cracked ruins.", goal: { type: "lines", value: 12 }, stones: 3, reward: { coins: 100, gems: 10 }, introduces: "stones" },
  { id: 8, name: "Quarry", blurb: "Score 1,500 in the old quarry.", goal: { type: "score", value: 1500 }, stones: 4, reward: { coins: 110, gems: 10 }, introduces: "kai" },
  { id: 9, name: "Temple", blurb: "Reach a x4 combo at the temple.", goal: { type: "combo", value: 4 }, stones: 4, reward: { coins: 130, gems: 12 }, introduces: "luna" },
  { id: 10, name: "Summit", blurb: "Score 2,000 on the summit.", goal: { type: "score", value: 2000 }, stones: 5, reward: { coins: 150, gems: 14 }, introduces: "blast" },
  { id: 11, name: "Grotto", blurb: "Clear 16 lines in the glowing grotto.", goal: { type: "lines", value: 16 }, stones: 5, reward: { coins: 160, gems: 14 }, introduces: "nia" },
  { id: 12, name: "Reef", blurb: "Score 2,500 over the reef.", goal: { type: "score", value: 2500 }, stones: 5, reward: { coins: 170, gems: 16 }, introduces: "pip" },
  { id: 13, name: "Lagoon", blurb: "Reach a x5 combo across the lagoon.", goal: { type: "combo", value: 5 }, stones: 6, reward: { coins: 180, gems: 16 } },
  { id: 14, name: "Volcano", blurb: "Clear 20 lines on the volcano's rim.", goal: { type: "lines", value: 20 }, stones: 6, reward: { coins: 200, gems: 18 } },
  { id: 15, name: "Sky Temple", blurb: "Score 3,200 at the Sky Temple.", goal: { type: "score", value: 3200 }, stones: 7, reward: { coins: 240, gems: 24 } },
];

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
  { id: "pack", name: "Power pack", blurb: "+2 of every tool.", amount: 2, gems: 90 },
  { id: "coins", name: "Coin pouch", blurb: "+400 coins.", amount: 400, gems: 40 },
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

export type SkinId = "classic" | "ocean" | "sunset" | "midnight";

export const SKINS: Array<{ id: SkinId; name: string; blurb: string }> = [
  { id: "classic", name: "Island gloss", blurb: "The original candy blocks." },
  { id: "ocean", name: "Tide glass", blurb: "Cooler sea-glass sheen." },
  { id: "sunset", name: "Dusk fire", blurb: "Warm lantern tones." },
  { id: "midnight", name: "Night market", blurb: "Deep neon after dark." },
];

export const CONTINUE_COST = 40;

export function xpForLevel(level: number): number {
  return 700 + level * 220;
}

export function goalLabel(goal: Goal): string {
  if (goal.type === "score") return `Score ${goal.value.toLocaleString("en-US")}`;
  if (goal.type === "lines") return `Clear ${goal.value} lines`;
  return `Reach a x${goal.value} combo`;
}
