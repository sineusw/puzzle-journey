import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SIZE,
  canPlace,
  canPlaceAnywhere,
  cloneMatch,
  emptyBoard,
  hammerCell,
  bombCell,
  newEndlessMatch,
  openingBoard,
  openingTray,
  placePiece,
  resolveClears,
  snapPlace,
  placeFromCell,
  peelCell,
  type Cell,
  type Piece,
} from "./engine.ts";

function block(c: Piece["color"] = "cyan"): Cell {
  return { t: "b", c };
}

function filledRow(color: Piece["color"] = "pink"): Cell[] {
  return Array.from({ length: SIZE }, () => block(color));
}

function piece(cells: Array<[number, number]>, color: Piece["color"] = "amber"): Piece {
  return {
    id: "t",
    shape: "test",
    cells,
    color,
    starAt: null,
    gold: false,
    special: null,
    specialAt: null,
  };
}

function matchWith(board: Cell[][], tray: Array<Piece | null>) {
  const m = newEndlessMatch();
  m.board = board;
  m.tray = tray;
  m.over = false;
  return m;
}

describe("puzzle journey engine", () => {
  it("places a 2x2 only on empty cells", () => {
    const board = emptyBoard();
    const cells: Array<[number, number]> = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ];
    assert.equal(canPlace(board, cells, 0, 0), true);
    board[1][1] = block();
    assert.equal(canPlace(board, cells, 0, 0), false);
    assert.equal(canPlace(board, cells, 6, 6), true);
    assert.equal(canPlace(board, cells, 7, 7), false);
  });

  it("clears a full row and a full column together", () => {
    const board = emptyBoard();
    board[0] = filledRow("lime");
    for (let r = 0; r < SIZE; r++) board[r][3] = block("violet");
    const info = resolveClears(board);
    assert.ok(info);
    assert.equal(info.lines, 2);
    assert.ok(info.rows.includes(0));
    assert.ok(info.cols.includes(3));
    assert.equal(board[0].every((c) => c.t === "e"), true);
    assert.equal(board.every((row) => row[3].t === "e"), true);
  });

  it("damages stones instead of wiping them in one clear", () => {
    const board = emptyBoard();
    board[2] = filledRow("cyan");
    board[2][4] = { t: "k", hp: 2 };
    resolveClears(board);
    assert.deepEqual(board[2][4], { t: "k", hp: 1 });
    board[2] = filledRow("cyan");
    board[2][4] = { t: "k", hp: 1 };
    resolveClears(board);
    assert.equal(board[2][4].t, "e");
  });

  it("scores a placement, fills the tray, and builds combo on chain clears", () => {
    const board = emptyBoard();
    board[7] = filledRow("pink");
    board[7][7] = { t: "e" };
    const mono = piece([[0, 0]], "pink");
    const m = matchWith(board, [mono, null, null]);
    const first = placePiece(m, 0, 7, 7);
    assert.equal(first.ok, true);
    assert.ok(first.clear);
    assert.equal(first.match.combo, 1);
    assert.ok(first.match.score >= 100);
    assert.equal(first.match.tray.filter(Boolean).length, 3);

    const board2 = emptyBoard();
    board2[0] = filledRow("lime");
    board2[0][0] = { t: "e" };
    const next = cloneMatch(first.match);
    next.board = board2;
    next.tray = [piece([[0, 0]], "lime"), null, null];
    const second = placePiece(next, 0, 0, 0);
    assert.equal(second.match.combo, 2);
  });

  it("ends the run when no tray piece fits", () => {
    const board = emptyBoard();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (r === 7 && c === 7) continue;
        board[r][c] = block("cyan");
      }
    }
    const m = matchWith(board, [
      piece([
        [0, 0],
        [0, 1],
      ]),
      null,
      null,
    ]);
    const result = placePiece(m, 0, 7, 6);
    assert.equal(result.ok, false);
    assert.equal(canPlaceAnywhere(board, [
      [0, 0],
      [0, 1],
    ]), false);
  });

  it("hammer and bomb clear occupied cells", () => {
    const board = emptyBoard();
    board[3][3] = block("orange");
    board[3][4] = block("orange");
    board[4][3] = block("orange");
    const m = matchWith(board, [null, null, null]);
    const hit = hammerCell(m, 3, 3);
    assert.ok(hit);
    assert.equal(hit.board[3][3].t, "e");
    const boom = bombCell(m, 3, 3);
    assert.ok(boom);
    assert.equal(boom.board[3][4].t, "e");
    assert.equal(boom.board[4][3].t, "e");
  });

  it("showcase opening has no full lines and every tray piece fits", () => {
    const board = openingBoard();
    const tray = openingTray();
    const full = resolveClears(cloneBoardSafe(board));
    assert.equal(full, null);
    for (const p of tray) {
      assert.ok(p);
      assert.equal(canPlaceAnywhere(board, p.cells), true);
    }
    const match = newEndlessMatch({ showcase: true });
    assert.equal(match.over, false);
    assert.equal(match.tray.filter(Boolean).length, 3);
  });

  it("clears five full rows in one placement", () => {
    const board = emptyBoard();
    for (let r = 3; r <= 7; r++) {
      board[r] = filledRow("cyan");
      board[r][7] = { t: "e" };
    }
    const tall = piece(
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
      ],
      "cyan",
    );
    const result = placePiece(matchWith(board, [tall, null, null]), 0, 3, 7);
    assert.equal(result.ok, true);
    assert.ok(result.clear);
    assert.equal(result.clear.lines, 5);
    assert.equal(result.clear.rows.length, 5);
  });

  it("a bomb special wipes a 3x3 when its line clears", () => {
    const board = emptyBoard();
    board[7] = filledRow("pink");
    board[7][7] = { t: "e" };
    board[6][6] = block("lime");
    board[6][7] = block("lime");
    board[5][6] = block("lime");
    const bomb = piece([[0, 0]], "pink");
    bomb.special = "bomb";
    bomb.specialAt = 0;
    const result = placePiece(matchWith(board, [bomb, null, null]), 0, 7, 7);
    assert.equal(result.ok, true);
    assert.ok(result.clear);
    assert.ok(result.clear.bombs >= 1);
    assert.equal(result.match.board[6][6].t, "e");
    assert.equal(result.match.board[6][7].t, "e");
  });

  it("a vertical rocket clears its column", () => {
    const board = emptyBoard();
    board[7] = filledRow("amber");
    board[7][4] = { t: "e" };
    board[0][4] = block("cyan");
    board[3][4] = block("cyan");
    const rocket = piece([[0, 0]], "amber");
    rocket.special = "rocketV";
    rocket.specialAt = 0;
    const result = placePiece(matchWith(board, [rocket, null, null]), 0, 7, 4);
    assert.equal(result.ok, true);
    assert.ok(result.clear);
    assert.ok(result.clear.rockets >= 1);
    assert.equal(result.match.board[0][4].t, "e");
    assert.equal(result.match.board[3][4].t, "e");
  });

  it("stone specials stamp as cracked rock", () => {
    const board = emptyBoard();
    const rock = piece([[0, 0]], "cyan");
    rock.special = "stone";
    rock.specialAt = 0;
    const result = placePiece(matchWith(board, [rock, null, null]), 0, 4, 4);
    assert.equal(result.ok, true);
    assert.deepEqual(result.match.board[4][4], { t: "k", hp: 2 });
  });

  it("snapPlace picks a nearby legal cell", () => {
    const board = emptyBoard();
    board[0][0] = block();
    const cells: Array<[number, number]> = [[0, 0]];
    assert.equal(canPlace(board, cells, 0, 0), false);
    const snap = snapPlace(board, cells, 0, 0);
    assert.ok(snap);
    assert.equal(canPlace(board, cells, snap.r, snap.c), true);
  });

  it("placeFromCell tries every cell of the piece as the drop target", () => {
    const board = emptyBoard();
    const cells: Array<[number, number]> = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ];
    const hit = placeFromCell(board, cells, 1, 1);
    assert.ok(hit);
    assert.equal(canPlace(board, cells, hit.r, hit.c), true);
    assert.ok(cells.some(([dr, dc]) => hit.r + dr === 1 && hit.c + dc === 1));
  });

  it("peels ice before destroying the colored block", () => {
    const board = emptyBoard();
    board[1][1] = { t: "b", c: "cyan", ov: ["ice"] };
    peelCell(board, 1, 1);
    assert.equal(board[1][1].t, "b");
    assert.deepEqual(board[1][1].t === "b" ? board[1][1].ov : undefined, undefined);
    peelCell(board, 1, 1);
    assert.equal(board[1][1].t, "e");
  });
});

function cloneBoardSafe(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}
