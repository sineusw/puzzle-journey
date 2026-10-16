import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyChallengeEvent, claimReward, dailySet, emptyChallenges, normalizeChallenges, rollover, settleRollover, weeklySet } from "./challenges.ts";

const day = new Date(2026, 9, 16, 12);

describe("challenge board", () => {
  it("everyone gets the same 5 daily (one color) and 3 weekly for a date", () => {
    const a = dailySet("2026-10-16");
    assert.equal(a.length, 5);
    assert.deepEqual(a.map((c) => c.id), dailySet("2026-10-16").map((c) => c.id));
    assert.equal(a.filter((c) => c.metric === "color").length, 1);
    assert.equal(weeklySet("2026-W42").length, 3);
  });

  it("fills up from play and completes once", () => {
    let st = emptyChallenges(day);
    const target = dailySet(st.day).find((c) => c.metric === "pieces" || c.metric === "lines" || c.metric === "multi");
    if (!target) return;
    let completed = 0;
    for (let i = 0; i < target.target + 5; i++) {
      const r = applyChallengeEvent(st, { [target.metric]: 1 } as never, day);
      st = r.state;
      completed += r.completed.filter((c) => c.id === target.id).length;
    }
    assert.equal(completed, 1);
    assert.ok(st.done.includes(target.id));
  });

  it("best-of challenges track the best run, not a sum", () => {
    let st = emptyChallenges(day);
    st = applyChallengeEvent(st, { score_run: 900 }, day).state;
    st = applyChallengeEvent(st, { score_run: 400 }, day).state;
    for (const [id, v] of Object.entries(st.progress)) if (id.includes("score")) assert.equal(v, 900);
  });

  it("daily progress resets at midnight but the week carries on", () => {
    const st = { ...emptyChallenges(day), progress: { "d-lines": 5, "w-lines": 40 }, done: ["d-x", "w-y"] };
    const next = rollover(st, new Date(2026, 9, 17, 9));
    assert.equal(next.progress["d-lines"], undefined);
    assert.equal(next.progress["w-lines"], 40);
    assert.deepEqual(next.done, ["w-y"]);
  });

  it("a reward can be claimed once, and only when finished", () => {
    const st = { ...emptyChallenges(day), done: ["d-lines"], claimed: [] };
    assert.equal(claimReward(st, "d-pieces"), null, "not finished");
    assert.equal(claimReward(st, "made-up"), null, "unknown id");
    const first = claimReward(st, "d-lines");
    assert.ok(first);
    assert.equal(first.reward.coins, 50);
    assert.equal(claimReward(first.state, "d-lines"), null, "second tap pays nothing");
  });

  it("unclaimed rewards are paid when the day ends, claimed ones are not", () => {
    const st = { ...emptyChallenges(day), done: ["d-lines", "d-combo", "w-lines"], claimed: ["d-combo"] };
    const { state, owed } = settleRollover(st, new Date(2026, 9, 17, 9));
    assert.equal(owed.count, 1);
    assert.equal(owed.coins, 50);
    assert.deepEqual(state.done, ["w-lines"], "this week's stays claimable");
    const again = settleRollover(state, new Date(2026, 9, 17, 10));
    assert.equal(again.owed.count, 0, "no double payout");
  });

  it("damaged challenge saves load safely", () => {
    assert.deepEqual(normalizeChallenges(null, day).done, []);
    assert.deepEqual(normalizeChallenges({ day: "x", week: "y", progress: { a: "9", b: -1, c: 3 }, done: "oops" }, day), {
      day: "x", week: "y", progress: { c: 3 }, done: [], claimed: [],
    });
    // Old saves (before Claim existed) count finished ones as already paid.
    assert.deepEqual(normalizeChallenges({ day: "x", week: "y", progress: {}, done: ["d-lines"] }, day).claimed, ["d-lines"]);
  });
});
