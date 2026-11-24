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
  SNAP_RADIUS,
  COMBO_WINDOW,
  PERFECT_BONUS,
  STAR_BONUS,
  praiseFor,
  setIsPlayable,
  refillIfNeeded,
  newSandboxMatch,
  newLevelMatch,
  makePiece,
  continueMatch,
  refreshTray,
  PLAIN_FEATURES,
  ALL_FEATURES,
  sanitizeMatch,
  type Match,
  placeFromCell,
  peelCell,
  type Cell,
  type Piece,
  occupancy,
  bulkyFactor,
  continueRows,
  dealRng,
  checkOver,
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

  it("an arrow goes off as soon as it's placed, no full line needed", () => {
    const board = emptyBoard();
    board[0][2] = block("cyan");
    board[5][2] = block("lime");
    board[3][6] = block("pink");
    const rocket = piece([[0, 0], [0, 1]], "amber");
    rocket.special = "rocketV";
    rocket.specialAt = 0;
    const result = placePiece(matchWith(board, [rocket, null, null]), 0, 3, 2);
    assert.equal(result.ok, true);
    assert.ok(result.clear);
    assert.equal(result.clear.rockets, 1);
    for (let r = 0; r < SIZE; r++) assert.equal(result.match.board[r][2].t, "e");
    assert.equal(result.match.board[3][3].t, "b"); // the rest of the piece stays
    assert.equal(result.match.board[3][6].t, "b"); // other columns untouched
    assert.ok(result.gained > 20);
  });

  it("a bomb placed in open space clears the 3x3 around it", () => {
    const board = emptyBoard();
    board[2][2] = block("cyan");
    board[4][4] = block("lime");
    board[5][5] = block("pink");
    const bomb = piece([[0, 0]], "violet");
    bomb.special = "bomb";
    bomb.specialAt = 0;
    const result = placePiece(matchWith(board, [bomb, null, null]), 0, 3, 3);
    assert.equal(result.match.board[2][2].t, "e");
    assert.equal(result.match.board[4][4].t, "e");
    assert.equal(result.match.board[5][5].t, "b");
  });

  it("an arrow that completes a line still clears that line", () => {
    const board = emptyBoard();
    board[7] = filledRow("amber");
    board[7][4] = { t: "e" };
    board[2][4] = block("cyan");
    const rocket = piece([[0, 0]], "amber");
    rocket.special = "rocketV";
    rocket.specialAt = 0;
    const result = placePiece(matchWith(board, [rocket, null, null]), 0, 7, 4);
    assert.equal(result.clear?.lines, 1);
    assert.equal(result.clear?.rockets, 1);
    assert.ok(result.match.board[7].every((c) => c.t === "e"));
    assert.equal(result.match.board[2][4].t, "e");
  });

  it("an arrow left on the board goes off on the next move, no full line needed", () => {
    const board = emptyBoard();
    board[2][5] = { t: "b", c: "cyan", sp: "rocketH" };
    board[2][0] = block("lime");
    board[6][6] = block("pink");
    const plain = piece([[0, 0]], "amber");
    const result = placePiece(matchWith(board, [plain, null, null]), 0, 7, 0);
    assert.equal(result.clear?.rockets, 1);
    assert.ok(result.match.board[2].every((c) => c.t === "e"));
    assert.equal(result.match.board[6][6].t, "b");
  });

  it("an old save's waiting specials load as plain blocks", () => {
    const m = newEndlessMatch();
    m.board[3][3] = { t: "b", c: "cyan", sp: "rocketV" };
    const clean = sanitizeMatch(m);
    const cell = clean.board[3][3];
    assert.ok(cell.t === "b" && !cell.sp);
  });

  it("a star block is a color bomb: every block of its color pops", () => {
    const board = emptyBoard();
    board[0][0] = block("amber");
    board[5][6] = block("amber");
    board[2][2] = block("cyan");
    const star = piece([[0, 0], [0, 1]], "amber");
    star.starAt = 0;
    const result = placePiece(matchWith(board, [star, null, null]), 0, 3, 3);
    assert.equal(result.star?.bonus, STAR_BONUS);
    assert.equal(result.clear?.swept?.color, "amber");
    assert.equal(result.clear?.swept?.count, 4); // two on the board + the piece's two
    assert.equal(result.match.board[0][0].t, "e");
    assert.equal(result.match.board[5][6].t, "e");
    assert.equal(result.match.board[3][3].t, "e");
    assert.equal(result.match.board[2][2].t, "b"); // other colors stay
    assert.ok(result.gained > STAR_BONUS);
  });

  it("a stone cracks when blocks next to it clear, no line through it needed", () => {
    const board = emptyBoard();
    board[7] = filledRow("pink");
    board[7][0] = { t: "e" };
    board[6][3] = { t: "k", hp: 2 };
    const one = piece([[0, 0]], "amber");
    const result = placePiece(matchWith(board, [one, null, null]), 0, 7, 0);
    const stone = result.match.board[6][3];
    assert.ok(stone.t === "k" && stone.hp === 1);
  });

  it("bombs and arrows always come as their own single block", () => {
    let seed = 7;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let specials = 0;
    for (let i = 0; i < 2000; i++) {
      const p = makePiece(rng, undefined, ALL_FEATURES);
      if (p.special && p.special !== "stone") {
        specials++;
        assert.equal(p.cells.length, 1);
        assert.equal(p.specialAt, 0);
      }
    }
    assert.ok(specials > 50);
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

describe("drop accuracy and fair piece sets", () => {
  it("never snaps a drop more than one cell from where the player aimed", () => {
    const board = emptyBoard();
    // Fill everything except a single hole at (7,7).
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) board[r][c] = block();
    board[7][7] = { t: "e" };
    const cells: Array<[number, number]> = [[0, 0]];
    assert.equal(snapPlace(board, cells, 0, 0), null, "far-away hole must not be reached");
    assert.deepEqual(snapPlace(board, cells, 6, 6), { r: 7, c: 7 }, "adjacent hole is fine");
    assert.ok(SNAP_RADIUS <= 1);
  });

  it("rejects a set that can only be placed partway", () => {
    // Every row and column keeps a gap after the pocket is filled, so no
    // placement here can clear a line and open up more room.
    const board = emptyBoard();
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) board[r][c] = block();
    const holes = [
      [0, 0], [0, 1], [1, 0], [1, 1], // the only 2x2 pocket
      [0, 3], [1, 5], [2, 6], [3, 1], [4, 4], [4, 0], [5, 7], [6, 2], [7, 5], // isolated singles
    ] as const;
    for (const [r, c] of holes) {
      board[r][c] = { t: "e" };
    }
    const sq = piece([[0, 0], [0, 1], [1, 0], [1, 1]]);
    const bar = piece([[0, 0], [0, 1]]);
    assert.equal(setIsPlayable(board, [sq]), true);
    assert.equal(setIsPlayable(board, [bar]), true);
    assert.equal(setIsPlayable(board, [sq, bar]), false, "both need the only pocket");
  });

  it("refills a crowded board with a set the player can fully place", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const match = newEndlessMatch();
      const board = emptyBoard();
      // Pseudo-random ~60% fill with no full lines.
      let s = seed * 7919;
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (rnd() < 0.6) board[r][c] = block();
      for (let r = 0; r < SIZE; r++) board[r][r] = { t: "e" };
      match.board = board;
      match.tray = [null, null, null];
      refillIfNeeded(match);
      const set = match.tray.filter((p): p is Piece => p !== null);
      assert.equal(set.length, 3);
      assert.equal(setIsPlayable(match.board, set, 50000), true, `seed ${seed} produced a dead set`);
    }
  });
});

describe("game modes and feature sets", () => {
  const isPlainPiece = (p: Piece) => p.special === null && p.starAt === null && !p.gold;

  it("plain features never produce stars, specials or stones on pieces", () => {
    let s = 7;
    const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2000; i++) {
      assert.ok(isPlainPiece(makePiece(rng, undefined, PLAIN_FEATURES)), `piece ${i} was not plain`);
    }
  });

  it("sandbox runs stay plain through many refills, rerolls and continues", () => {
    let m: Match = newSandboxMatch();
    assert.equal(m.mode, "sandbox");
    for (let i = 0; i < 60; i++) {
      m.tray.filter((p): p is Piece => p !== null).forEach((p) => assert.ok(isPlainPiece(p)));
      m = i % 3 === 0 ? refreshTray(m) : continueMatch(m);
    }
  });

  it("a classic level has no stones even when the level asks for some", () => {
    const m = newLevelMatch("classic", 5, { type: "score", value: 500 }, 6, PLAIN_FEATURES);
    assert.equal(m.board.flat().filter((c) => c.t !== "e").length, 0);
    m.tray.forEach((p) => p && assert.ok(isPlainPiece(p)));
  });

  it("adventure places stones only once stones are unlocked", () => {
    const noStones = newLevelMatch("adventure", 4, { type: "score", value: 500 }, 4, { ...PLAIN_FEATURES, specials: ["rocketH", "rocketV"] });
    assert.equal(noStones.board.flat().filter((c) => c.t === "k").length, 0);
    const withStones = newLevelMatch("adventure", 7, { type: "score", value: 500 }, 4, ALL_FEATURES);
    assert.equal(withStones.board.flat().filter((c) => c.t === "k").length, 4);
  });

  it("only unlocked specials appear", () => {
    let s = 99;
    const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const f = { ...PLAIN_FEATURES, specials: ["rocketH" as const, "rocketV" as const] };
    const seen = new Set<string>();
    for (let i = 0; i < 3000; i++) {
      const p = makePiece(rng, undefined, f);
      if (p.special) seen.add(p.special);
    }
    assert.deepEqual([...seen].sort(), ["rocketH", "rocketV"]);
  });

  it("old saved endless runs load as plain sandbox runs", () => {
    const legacy = { ...newSandboxMatch(), mode: "endless" } as unknown as Match;
    delete (legacy as Partial<Match>).features;
    const m = sanitizeMatch(legacy);
    assert.equal(m.mode, "sandbox");
    assert.deepEqual(m.features, PLAIN_FEATURES);
  });
});

describe("Block Blast scoring rules", () => {
  // A sandbox match with a custom board and tray of 1x1 pieces.
  const setup = (board: Cell[][]): Match => {
    const m = newSandboxMatch();
    m.board = board;
    m.tray = [piece([[0, 0]]), piece([[0, 0]]), piece([[0, 0]])];
    return m;
  };
  // Row r full except column `hole`.
  const almostRow = (board: Cell[][], r: number, hole: number) => {
    for (let c = 0; c < SIZE; c++) if (c !== hole) board[r][c] = block();
  };

  it("clears a full row and a full column in the same move", () => {
    const board = emptyBoard();
    almostRow(board, 7, 7);
    for (let r = 0; r < 7; r++) board[r][7] = block("pink");
    const res = placePiece(setup(board), 0, 7, 7);
    assert.ok(res.ok);
    assert.deepEqual(res.clear?.rows, [7]);
    assert.deepEqual(res.clear?.cols, [7]);
    assert.ok(boardIsEmptyLike(res.match.board));
    assert.equal(res.perfect, true);
  });

  it("keeps the combo alive for up to three non-clearing placements", () => {
    const board = emptyBoard();
    almostRow(board, 0, 0);
    almostRow(board, 7, 0);
    let m = setup(board);
    m.board[3][3] = block(); // keep the board from ever being empty
    let res = placePiece(m, 0, 0, 0); // clear row 0 -> combo 1
    assert.equal(res.combo, 1);
    m = res.match;
    m.tray = [piece([[0, 0]]), piece([[0, 0]]), piece([[0, 0]])];
    // Two placements with no clear: combo survives.
    m = placePiece(m, 0, 2, 2).match;
    m = placePiece(m, 1, 2, 4).match;
    assert.equal(m.combo, 1);
    assert.equal(m.sinceClear, 2);
    // A clear on the third move continues the streak.
    m.tray = [piece([[0, 0]]), null, null];
    res = placePiece(m, 0, 7, 0);
    assert.equal(res.combo, 2);
  });

  it("drops the combo after COMBO_WINDOW placements without a clear", () => {
    const board = emptyBoard();
    almostRow(board, 0, 0);
    board[4][4] = block();
    let m = placePiece(setup(board), 0, 0, 0).match;
    assert.equal(m.combo, 1);
    for (let i = 0; i < COMBO_WINDOW; i++) {
      m.tray = [piece([[0, 0]]), piece([[0, 0]]), piece([[0, 0]])];
      m = placePiece(m, 0, 2, i * 2).match;
    }
    assert.equal(m.combo, 0);
  });

  it("scores multi-line clears on a growing curve", () => {
    const one = emptyBoard();
    almostRow(one, 0, 0);
    one[5][5] = block();
    const two = emptyBoard();
    almostRow(two, 0, 0);
    for (let r = 1; r < SIZE; r++) two[r][0] = block();
    two[5][5] = block();
    const a = placePiece(setup(one), 0, 0, 0).gained;
    const b = placePiece(setup(two), 0, 0, 0).gained;
    assert.equal(a, 10 + 100);
    assert.equal(b, 10 + 300 + 25); // 2 lines (100+200) + intersection bonus
  });

  it("awards the perfect-clear bonus only when the board ends empty", () => {
    const board = emptyBoard();
    almostRow(board, 0, 0);
    const res = placePiece(setup(board), 0, 0, 0);
    assert.equal(res.perfect, true);
    assert.equal(res.gained, 10 + 100 + PERFECT_BONUS);
  });

  it("names clears by size", () => {
    assert.equal(praiseFor(1, false), null);
    assert.equal(praiseFor(2, false), "Good!");
    assert.equal(praiseFor(4, false), "Excellent!");
    assert.equal(praiseFor(1, true), "Perfect!");
  });

  describe("fair dealing", () => {
    it("deals the same trays from the same seed and board", () => {
      const a = newSandboxMatch();
      const b = newSandboxMatch();
      a.seed = b.seed = 12345;
      a.deals = b.deals = 0;
      a.tray = [null, null, null];
      b.tray = [null, null, null];
      refillIfNeeded(a);
      refillIfNeeded(b);
      assert.deepEqual(a.tray.map((p) => p && [p.shape, p.cells, p.color]), b.tray.map((p) => p && [p.shape, p.cells, p.color]));
    });

    it("every dealt tray can be fully placed from the board it was dealt on", () => {
      let seed = 1;
      for (let g = 0; g < 40; g++) {
        const m = newSandboxMatch();
        m.seed = seed++;
        for (let step = 0; step < 60 && !m.over; step++) {
          if (m.tray.every((p) => p === null)) {
            refillIfNeeded(m);
            const dealt = (m.tray as Array<Piece | null>).filter((p): p is Piece => p !== null);
            if (!m.over) assert.ok(setIsPlayable(m.board, dealt, 20000) || occupancy(m.board) > 0.5, "playable tray");
          }
          // Play the first piece that fits, at its first legal spot.
          const i = m.tray.findIndex((p) => p && canPlaceAnywhere(m.board, p.cells));
          if (i < 0) break;
          const p = m.tray[i]!;
          let done = false;
          for (let r = 0; r < SIZE && !done; r++)
            for (let c = 0; c < SIZE && !done; c++)
              if (canPlace(m.board, p.cells, r, c)) {
                Object.assign(m, placePiece(m, i, r, c).match);
                done = true;
              }
        }
      }
    });

    it("game over only when no remaining piece fits", () => {
      const m = newSandboxMatch();
      m.board = emptyBoard();
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if ((r + c) % 2 === 0) m.board[r][c] = block();
      m.tray = [piece([[0, 0], [0, 1]]), null, null];
      assert.equal(checkOver(m).over, true);
      m.tray = [piece([[0, 0], [0, 1]]), piece([[0, 0]]), null];
      assert.equal(checkOver(m).over, false);
    });

    it("leans toward small pieces as the board fills (board state only)", () => {
      assert.equal(bulkyFactor(0.1), 1);
      assert.equal(bulkyFactor(0.45), 0.6);
      assert.equal(bulkyFactor(0.7), 0.3);
    });

    it("Continue always empties the two fullest rows", () => {
      const board = emptyBoard();
      board[2] = filledRow();
      board[2][0] = { t: "e" };
      board[5] = filledRow();
      board[7][0] = block();
      assert.deepEqual(continueRows(board), [2, 5]);
      const m = newSandboxMatch();
      m.board = board;
      m.over = true;
      const next = continueMatch(m);
      assert.ok(next.board[2].every((c) => c.t === "e") && next.board[5].every((c) => c.t === "e"));
      assert.equal(next.over, false);
    });

    it("deal streams advance per deal", () => {
      const m = newSandboxMatch();
      m.seed = 7;
      m.deals = 0;
      const a = dealRng(m)();
      const b = dealRng(m)();
      assert.notEqual(a, b);
      assert.equal(m.deals, 2);
    });
  });
});

function boardIsEmptyLike(board: Cell[][]): boolean {
  return board.every((row) => row.every((c) => c.t === "e"));
}

describe("special clears and line goals", () => {
  const piece1 = (special: "rocketH" | "rocketV" | "bomb"): Piece => ({ id: "z", shape: "o1", cells: [[0, 0]], color: "azure", starAt: null, gold: false, special, specialAt: 0 });
  const lineMatch = () => {
    const m = newLevelMatch("adventure", 5, { type: "lines", value: 10 }, 0, { stars: false, specials: ["rocketH", "rocketV", "bomb"], stones: false, visitors: [] });
    m.board = emptyBoard();
    m.lines = 0;
    m.goalProgress = 0;
    return m;
  };

  it("an arrow that empties a half-full row counts as a line (but scores as a special)", () => {
    const m = lineMatch();
    for (const c of [0, 1, 6]) m.board[5]![c] = { t: "b", c: "pink" };
    m.tray = [piece1("rocketH"), null, { ...piece1("bomb"), special: null, specialAt: null }];
    const r = placePiece(m, 0, 5, 3);
    assert.ok(r.ok);
    assert.equal(r.clear?.lines, 0);
    assert.equal(r.clear?.zapLines, 1);
    assert.equal(r.match.lines, 1);
    assert.equal(r.match.goalProgress, 1);
  });

  it("zapping a nearly empty row does not count", () => {
    const m = lineMatch();
    m.board[5]![0] = { t: "b", c: "pink" };
    m.tray = [piece1("rocketH"), null, { ...piece1("bomb"), special: null, specialAt: null }];
    const r = placePiece(m, 0, 5, 3);
    assert.ok(r.ok);
    assert.equal(r.clear?.zapLines ?? 0, 0);
    assert.equal(r.match.lines, 0);
  });

  it("a bomb's partial hole never counts as a line", () => {
    const m = lineMatch();
    for (let c = 0; c < 6; c++) m.board[3]![c] = { t: "b", c: "lime" };
    m.tray = [piece1("bomb"), null, { ...piece1("bomb"), special: null, specialAt: null }];
    const r = placePiece(m, 0, 4, 2);
    assert.ok(r.ok);
    assert.equal(r.clear?.zapLines ?? 0, 0);
    assert.equal(r.match.lines, 0);
  });
});
