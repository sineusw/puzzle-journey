import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyBoard, newEndlessMatch, trayFits, type Cell, type Piece } from "../engine.ts";
import { applyVisitorAction, isPlainBlock, planVisitor } from "./actions.ts";

function block(c: Piece["color"] = "cyan"): Cell {
  return { t: "b", c };
}

function fillPlayable(board: Cell[][]) {
  board[0][0] = block("pink");
  board[0][1] = block("pink");
  board[1][0] = block("lime");
  board[2][2] = block("amber");
  board[3][3] = { t: "k", hp: 2 };
  board[4][4] = { t: "b", c: "azure", sp: "bomb" };
  board[5][5] = { t: "b", c: "violet", sp: "rocketV" };
}

function matchBoard() {
  const m = newEndlessMatch();
  m.board = emptyBoard();
  fillPlayable(m.board);
  m.over = false;
  m.won = false;
  return m;
}

describe("island visitors", () => {
  it("milo moves a plain block onto empty and never steals specials", () => {
    const match = matchBoard();
    const action = planVisitor(match, "milo", "help", () => 0.2);
    assert.ok(action);
    assert.equal(action.kind, "move");
    if (action.kind !== "move") return;
    assert.ok(isPlainBlock(match.board[action.from[0]]![action.from[1]]!));
    const applied = applyVisitorAction(match, action);
    assert.ok(applied);
    assert.equal(applied.match.board[action.from[0]]![action.from[1]]!.t, "e");
    assert.equal(applied.match.board[action.to[0]]![action.to[1]]!.t, "b");
    assert.equal(applied.match.board[4][4]!.t === "b" ? applied.match.board[4][4]!.sp : null, "bomb");
    assert.ok(trayFits(applied.match));
  });

  it("luna enchants a plain tile into a bomb or rocket", () => {
    const match = matchBoard();
    const action = planVisitor(match, "luna", "help", () => 0.4);
    assert.ok(action && action.kind === "enchant");
    if (action.kind !== "enchant") return;
    const applied = applyVisitorAction(match, action);
    assert.ok(applied);
    const cell = applied.match.board[action.at[0]]![action.at[1]]!;
    assert.ok(cell.t === "b" || cell.t === "s");
    if (cell.t === "b" || cell.t === "s") assert.ok(cell.sp === "bomb" || cell.sp === "rocketH" || cell.sp === "rocketV");
  });

  it("kai builds or breaks stone without locking the tray", () => {
    const match = matchBoard();
    const action = planVisitor(match, "kai", "help", () => 0.3);
    assert.ok(action);
    const applied = applyVisitorAction(match, action);
    assert.ok(applied);
    assert.ok(trayFits(applied.match));
    assert.equal(applied.match.over, false);
  });

  it("nia rotates or swaps a small plain group", () => {
    const match = matchBoard();
    match.board[0][0] = block("pink");
    match.board[0][1] = block("lime");
    match.board[1][0] = block("amber");
    match.board[1][1] = block("cyan");
    const action = planVisitor(match, "nia", "help", () => 0.1);
    assert.ok(action);
    assert.ok(action.kind === "rotate" || action.kind === "swap");
    const applied = applyVisitorAction(match, action);
    assert.ok(applied);
    assert.ok(trayFits(applied.match));
  });

  it("pip recolors a plain block and skips bombs", () => {
    const match = matchBoard();
    const action = planVisitor(match, "pip", "help", () => 0.6);
    assert.ok(action && action.kind === "recolor");
    if (action.kind !== "recolor") return;
    assert.notEqual(action.from, action.to);
    const before = match.board[action.at[0]]![action.at[1]]!;
    assert.ok(isPlainBlock(before));
    const applied = applyVisitorAction(match, action);
    assert.ok(applied);
    const after = applied.match.board[action.at[0]]![action.at[1]]!;
    assert.ok(after.t === "b" || after.t === "s");
    if (after.t === "b" || after.t === "s") assert.equal(after.c, action.to);
    const bomb = applied.match.board[4][4]!;
    assert.equal(bomb.t === "b" ? bomb.sp : null, "bomb");
  });

  it("rejects moving a bomb", () => {
    const match = matchBoard();
    const applied = applyVisitorAction(match, {
      visitor: "milo",
      kind: "move",
      from: [4, 4],
      to: [7, 7],
      cell: match.board[4][4]!,
    });
    assert.equal(applied, null);
  });
});
