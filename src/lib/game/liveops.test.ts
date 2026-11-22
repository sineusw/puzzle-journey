import test from "node:test";
import assert from "node:assert/strict";
import { currentEvent, emptyLive, eventPoints, moneyPrice, normalizeLive, SHOP, weekKey } from "./liveops.ts";
import { continueMatch, emptyBoard, newLevelMatch, PLAIN_FEATURES, refillIfNeeded } from "./engine.ts";

test("every real-money sku has a price and a grant", () => {
  for (const item of SHOP) if (item.usd) assert.ok(moneyPrice(item.id)?.usd === item.usd);
  assert.equal(moneyPrice("skin:cosmic")?.grant.skin, "cosmic");
  assert.equal(moneyPrice("skin:classic"), null);
  assert.equal(moneyPrice("nope"), null);
});

test("live state rolls over a new week and event", () => {
  const old = { ...emptyLive(), weekly: { week: "w2000-1-3", prog: { lines: 99 }, claimed: ["lines"] }, event: { id: "gone", pts: 50, claimed: [0] } };
  const l = normalizeLive(old);
  assert.equal(l.weekly.week, weekKey());
  assert.deepEqual(l.weekly.prog, {});
  assert.equal(l.event.id, currentEvent().def.id);
  assert.equal(l.event.pts, 0);
  assert.ok(l.ownedSkins.includes("classic"));
});

test("event points by source", () => {
  const move = { lines: 2, specials: 1, gained: 450, combo: 3 };
  assert.equal(eventPoints("lines", move), 2);
  assert.equal(eventPoints("specials", move), 3);
  assert.equal(eventPoints("score", move), 4);
  assert.equal(eventPoints("combo", move), 2);
});

test("a rescue continue clears three rows and deals easy trays", () => {
  const m = newLevelMatch("adventure", 5, { type: "score", value: 900 }, 0, PLAIN_FEATURES);
  m.board = emptyBoard().map((row) => row.map(() => ({ t: "b" as const, c: "cyan" as const })));
  m.over = true;
  const next = continueMatch(m, 3, 1);
  const emptyRows = next.board.filter((row) => row.every((c) => c.t === "e")).length;
  assert.equal(emptyRows, 3);
  assert.ok(next.tray.every((p) => p && p.cells.length <= 4));
  assert.equal(next.easy, 2);
  next.tray = [null, null, null];
  const after = refillIfNeeded(next);
  assert.equal(after.easy, 1);
});
