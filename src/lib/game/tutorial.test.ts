import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canPlace, placePiece } from "./engine.ts";
import { LESSONS, stepMatch, targetCells, type LessonId } from "./tutorial.ts";

describe("tutorial", () => {
  for (const lesson of Object.keys(LESSONS) as LessonId[]) {
    LESSONS[lesson].forEach((step, i) => {
      it(`${lesson} step ${i + 1} plays as described`, () => {
        const m = stepMatch(step);
        const slot = m.tray.findIndex((p) => p);
        const p = m.tray[slot]!;
        assert.ok(canPlace(m.board, p.cells, step.at.r, step.at.c), "piece fits the glowing spot");
        assert.equal(targetCells(step).length, p.cells.length);
        const res = placePiece(m, slot, step.at.r, step.at.c);
        assert.ok(res.ok);
        if (lesson === "basics" && i > 0) assert.ok((res.clear?.lines ?? 0) >= 1, "this step clears a line");
        if (lesson !== "basics") assert.ok((res.clear?.fired.length ?? 0) >= 1, "the special goes off");
      });
    });
  }
});
