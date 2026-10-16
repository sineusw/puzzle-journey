import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultProfile, parseSave } from "./save.ts";

describe("save loading", () => {
  it("round-trips a normal save", () => {
    const p = { ...defaultProfile(), coins: 512, gems: 9 };
    const back = parseSave(JSON.stringify(p));
    assert.ok(back);
    assert.equal(back.coins, 512);
    assert.equal(back.gems, 9);
  });

  it("rejects junk instead of crashing", () => {
    for (const blob of ["", "{", "null", "[]", "42", '"hi"']) assert.equal(parseSave(blob), null, blob);
  });

  it("repairs bad numbers and missing parts of an old save", () => {
    const back = parseSave(JSON.stringify({ version: 1, coins: "lots", gems: -5, xp: null, level: 0, challenges: { done: 3 } }));
    assert.ok(back);
    assert.equal(back.coins, defaultProfile().coins);
    assert.equal(back.gems, defaultProfile().gems);
    assert.equal(back.level, 1);
    assert.deepEqual(back.challenges.done, []);
    assert.equal(back.match, null, "old boards are not carried into a new version");
  });
});
