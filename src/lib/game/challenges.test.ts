import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyChallengeEvent, dailySet, emptyChallenges, rollover, weeklySet } from "./challenges.ts";

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
});
