import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addRun, awardsFor, bestBurst, emptyCard, emptyRun, percentileOf, puzzleIq, rank, categories, dayKey, type RunStats } from "./stats.ts";

const run = (over: Partial<RunStats> = {}): RunStats => ({ ...emptyRun("sandbox", null, 0), endedAt: 60_000, ...over });

describe("run stats", () => {
  it("finds the most lines in any 30-second window", () => {
    assert.equal(bestBurst([]), 0);
    assert.equal(bestBurst([0, 10_000, 20_000, 29_000, 70_000]), 4);
    assert.equal(bestBurst([0, 40_000, 80_000]), 1);
  });

  it("keeps Puzzle IQ on a 70-160 scale and rewards better play", () => {
    const meh = puzzleIq(run({ pieces: 30, lines: 4, bestCombo: 1 }));
    const good = puzzleIq(run({ pieces: 30, lines: 14, bestCombo: 4, perfects: 1, won: true }));
    assert.ok(meh >= 70 && meh <= 160);
    assert.ok(good > meh, `${good} should beat ${meh}`);
    assert.equal(puzzleIq(run({ pieces: 400, lines: 400, bestCombo: 40, perfects: 40, won: true, endedAt: 1000 })), 160);
  });

  it("pulls very short runs toward 100", () => {
    const iq = puzzleIq(run({ pieces: 2, lines: 2, bestCombo: 2, endedAt: 4000 }));
    assert.ok(Math.abs(iq - 100) < 20);
  });

  it("only reports a percentile with enough real data", () => {
    assert.equal(percentileOf(120, [100, 110]), null);
    assert.equal(percentileOf(120, [100, 110, 130, 140]), 50);
    assert.equal(percentileOf(150, [100, 110, 130, 140]), 100);
  });
});

describe("player cards and awards", () => {
  const now = new Date(2026, 9, 15, 19, 0); // a Thursday
  const today = dayKey(now);

  it("folds a run into bests and today's totals", () => {
    const c = addRun(emptyCard(), run({ score: 500, lines: 6, colors: { pink: 9 }, pieces: 12, won: true, levelId: 3, spacesLeft: 30 }), 112, 2, now);
    assert.equal(c.best.score, 500);
    assert.equal(c.best.iq, 112);
    assert.equal(c.best.streak, 2);
    assert.equal(c.best.fastest, 60);
    assert.equal(c.best.tidiest, 30);
    assert.equal(c.days[today]?.colors.pink, 9);
    const c2 = addRun(c, run({ score: 200, lines: 3, colors: { pink: 4 } }), 101, 0, now);
    assert.equal(c2.best.score, 500);
    assert.equal(c2.days[today]?.lines, 9);
    assert.equal(c2.days[today]?.colors.pink, 13);
  });

  it("keeps only a week of days", () => {
    let c = emptyCard();
    for (let d = 1; d <= 10; d++) c = addRun(c, run({ lines: 1 }), 100, 0, new Date(2026, 9, d));
    assert.equal(Object.keys(c.days).length, 7);
  });

  it("names a weekday category and ranks fastest lowest-first", () => {
    assert.ok(categories(now).some((c) => c.title === "Most lines on a Thursday"));
    const fastest = categories(now).find((c) => c.id === "fastest")!;
    const a = addRun(emptyCard(), run({ won: true, levelId: 1, endedAt: 90_000 }), 100, 1, now);
    const b = addRun(emptyCard(), run({ won: true, levelId: 1, endedAt: 40_000 }), 100, 1, now);
    assert.deepEqual(rank(fastest, { a, b }, today).map((r) => r.id), ["b", "a"]);
  });

  it("hands out first-place awards for categories you lead", () => {
    const me = addRun(emptyCard(), run({ lines: 10, colors: { pink: 20 }, score: 300 }), 110, 0, now);
    const luke = addRun(emptyCard(), run({ lines: 4, colors: { lime: 30 }, score: 900 }), 120, 0, now);
    const titles = awardsFor("me", { me, luke }, null, now).map((a) => a.title);
    assert.ok(titles.includes("Most lines on a Thursday"));
    assert.ok(titles.includes("Most pink blocks cleared today"));
    assert.ok(!titles.includes("Top score today"));
  });

  it("gives personal records when playing alone", () => {
    const before = addRun(emptyCard(), run({ bestCombo: 2 }), 100, 0, now);
    const after = addRun(before, run({ bestCombo: 4 }), 100, 0, now);
    const titles = awardsFor("me", { me: after }, before, now).map((a) => a.title);
    assert.ok(titles.includes("Personal best: Biggest combo"));
  });

  it("doesn't call a first game's numbers records", () => {
    const first = addRun(emptyCard(), run({ bestCombo: 3 }), 110, 1, now);
    assert.deepEqual(awardsFor("me", { me: first }, emptyCard(), now), []);
  });
  it("doesn't record a fastest time for a run resumed after a reload", () => {
    const card = addRun(emptyCard(), { ...run({ won: true, levelId: 3 }), resumed: true }, 100, 1, now);
    assert.equal(card.best.fastest, 0);
  });
});
