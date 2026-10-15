import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADVENTURE, CLASSIC, adventureFeatures, unlockedAt } from "./content.ts";
import { PLAIN_FEATURES } from "./engine.ts";

describe("Adventure unlock ladder", () => {
  it("starts with plain blocks and nothing else", () => {
    assert.deepEqual(adventureFeatures(1), PLAIN_FEATURES);
  });

  it("adds at most one new thing per level", () => {
    for (let id = 2; id <= ADVENTURE.length; id++) {
      const added = unlockedAt(id).length - unlockedAt(id - 1).length;
      assert.ok(added <= 1, `level ${id} added ${added}`);
    }
  });

  it("has every block and visitor unlocked by the last levels", () => {
    const f = adventureFeatures(ADVENTURE.length);
    assert.equal(f.stars, true);
    assert.equal(f.stones, true);
    assert.deepEqual([...f.specials].sort(), ["blast", "bomb", "rocketH", "rocketV"]);
    assert.deepEqual([...f.visitors].sort(), ["kai", "luna", "milo", "nia", "pip"]);
  });

  it("only lets Luna and Kai in after the things they use are unlocked", () => {
    for (const lvl of ADVENTURE) {
      const f = adventureFeatures(lvl.id);
      if (f.visitors.includes("luna")) assert.ok(f.specials.includes("bomb") && f.specials.includes("rocketH"));
      if (f.visitors.includes("kai")) assert.ok(f.stones);
    }
  });
});

describe("Classic levels", () => {
  it("has 30 levels whose goals never get easier within a goal type", () => {
    assert.equal(CLASSIC.length, 30);
    const last: Record<string, number> = {};
    for (const lvl of CLASSIC) {
      const prev = last[lvl.goal.type] ?? 0;
      assert.ok(lvl.goal.value >= prev, `${lvl.name} ${lvl.goal.type} dropped`);
      last[lvl.goal.type] = lvl.goal.value;
    }
  });
});
