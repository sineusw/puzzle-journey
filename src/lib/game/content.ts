import type { Goal } from "./engine";

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

export type AdventureLevel = {
  id: number;
  name: string;
  blurb: string;
  goal: Goal;
  stones: number;
  reward: { coins: number; gems: number };
};

export const ADVENTURE: AdventureLevel[] = [
  { id: 1, name: "Shore", blurb: "Score 400 to leave the beach.", goal: { type: "score", value: 400 }, stones: 0, reward: { coins: 40, gems: 4 } },
  { id: 2, name: "Palms", blurb: "Clear 6 lines under the palms.", goal: { type: "lines", value: 6 }, stones: 0, reward: { coins: 50, gems: 5 } },
  { id: 3, name: "Cove", blurb: "Reach a x3 combo in the cove.", goal: { type: "combo", value: 3 }, stones: 2, reward: { coins: 60, gems: 6 } },
  { id: 4, name: "Falls", blurb: "Score 900 beside the waterfall.", goal: { type: "score", value: 900 }, stones: 2, reward: { coins: 70, gems: 6 } },
  { id: 5, name: "Lanterns", blurb: "Clear 10 lines by lantern light.", goal: { type: "lines", value: 10 }, stones: 3, reward: { coins: 80, gems: 8 } },
  { id: 6, name: "Cliff", blurb: "Hold a x4 combo on the cliff.", goal: { type: "combo", value: 4 }, stones: 3, reward: { coins: 90, gems: 8 } },
  { id: 7, name: "Ruins", blurb: "Score 1,400 among cracked ruins.", goal: { type: "score", value: 1400 }, stones: 4, reward: { coins: 100, gems: 10 } },
  { id: 8, name: "Lagoon", blurb: "Clear 14 lines across the lagoon.", goal: { type: "lines", value: 14 }, stones: 4, reward: { coins: 110, gems: 10 } },
  { id: 9, name: "Temple", blurb: "Reach a x5 combo at the temple.", goal: { type: "combo", value: 5 }, stones: 5, reward: { coins: 130, gems: 12 } },
  { id: 10, name: "Summit", blurb: "Score 2,200 on the summit.", goal: { type: "score", value: 2200 }, stones: 6, reward: { coins: 160, gems: 16 } },
];

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
