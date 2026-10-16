/**
 * Hands-on tutorial: short scripted boards the player plays through, each
 * with one simple instruction and a glowing spot showing where to go.
 * Pure data + helpers so it can be tested without the UI.
 */

import { emptyBoard, PLAIN_FEATURES, cloneFeatures, newSandboxMatch, type Cell, type ColorId, type Match, type Piece, type SpecialId } from "./engine.ts";

export type LessonId = "basics" | "arrows" | "bombs" | "blast";

export type TutorialStep = {
  /** One short, kid-simple instruction. */
  say: string;
  /** A smaller hint under it. */
  hint?: string;
  /** What the coach says after the move works. */
  praise: string;
  board: Cell[][];
  piece: Piece;
  /** Top-left cell where the piece must go (its cells glow). */
  at: { r: number; c: number };
};

const b = (c: ColorId): Cell => ({ t: "b", c });

function piece(shape: string, cells: Array<[number, number]>, color: ColorId, special: SpecialId | null = null): Piece {
  return { id: `tut-${shape}-${special ?? "plain"}`, shape, cells, color, starAt: null, gold: false, special, specialAt: special ? 0 : null };
}

function board(fill: (put: (r: number, c: number, color?: ColorId) => void) => void): Cell[][] {
  const out = emptyBoard();
  const colors: ColorId[] = ["pink", "cyan", "amber", "lime", "violet", "orange", "azure"];
  fill((r, c, color) => {
    out[r]![c] = b(color ?? colors[(r * 3 + c) % colors.length]!);
  });
  return out;
}

const BASICS: TutorialStep[] = [
  {
    say: "Drag the block onto the glowing squares.",
    hint: "Press, hold, and slide it up onto the board.",
    praise: "Nice!",
    board: board(() => {}),
    piece: piece("o4", [[0, 0], [0, 1], [1, 0], [1, 1]], "lime"),
    at: { r: 3, c: 3 },
  },
  {
    say: "Fill the whole row to make it pop!",
    hint: "A row goes side to side.",
    praise: "Pop! The row cleared.",
    board: board((put) => {
      for (let c = 0; c < 6; c++) put(7, c);
      put(5, 2, "cyan");
    }),
    piece: piece("i2", [[0, 0], [0, 1]], "amber"),
    at: { r: 7, c: 6 },
  },
  {
    say: "Up-and-down lines pop too!",
    hint: "Fill this column from top to bottom.",
    praise: "Pop! Columns count too.",
    board: board((put) => {
      for (let r = 3; r < 8; r++) put(r, 0);
      put(6, 4, "pink");
    }),
    piece: piece("i3", [[0, 0], [1, 0], [2, 0]], "violet"),
    at: { r: 0, c: 0 },
  },
  {
    say: "Some blocks have holes!",
    hint: "The hole stays empty, so this one fits around that block. Blocks never turn, so look before you drop.",
    praise: "Perfect fit!",
    board: board((put) => {
      for (let c = 0; c < 8; c++) if (c < 2 || c > 4) put(7, c);
      put(6, 3, "cyan");
    }),
    piece: piece("u5", [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]], "orange"),
    at: { r: 6, c: 2 },
  },
];

const ARROWS: TutorialStep[] = [
  {
    say: "This arrow block goes ZAP!",
    hint: "Put it down and every block in its up-and-down line disappears.",
    praise: "ZAP! The whole line is gone.",
    board: board((put) => {
      for (const r of [0, 1, 2, 5, 6, 7]) put(r, 4);
      put(2, 1, "lime");
      put(6, 6, "pink");
    }),
    piece: piece("o1", [[0, 0]], "azure", "rocketV"),
    at: { r: 4, c: 4 },
  },
  {
    say: "This arrow points side to side.",
    hint: "Put it down and every block in its side-to-side line disappears.",
    praise: "ZAP! Side to side!",
    board: board((put) => {
      for (const c of [0, 1, 2, 5, 6, 7]) put(3, c);
      put(0, 2, "violet");
      put(6, 5, "lime");
    }),
    piece: piece("o1", [[0, 0]], "azure", "rocketH"),
    at: { r: 3, c: 3 },
  },
];

const BOMBS: TutorialStep[] = [
  {
    say: "This bomb block goes BOOM!",
    hint: "Put it down and the blocks all around it disappear.",
    praise: "BOOM! All cleared around it.",
    board: board((put) => {
      for (const [r, c] of [[2, 2], [2, 3], [2, 4], [3, 2], [3, 4], [4, 2], [4, 3], [4, 4], [7, 7], [0, 0]] as const) put(r, c);
    }),
    piece: piece("o1", [[0, 0]], "violet", "bomb"),
    at: { r: 3, c: 3 },
  },
];

const BLAST: TutorialStep[] = [
  {
    say: "The golden block is super rare!",
    hint: "Put it down and every block on the board disappears.",
    praise: "WOW! A clean board!",
    board: board((put) => {
      for (const [r, c] of [[0, 1], [1, 5], [2, 2], [3, 6], [5, 0], [5, 4], [6, 2], [7, 6]] as const) put(r, c);
    }),
    piece: piece("o1", [[0, 0]], "amber", "blast"),
    at: { r: 4, c: 3 },
  },
];

export const LESSONS: Record<LessonId, TutorialStep[]> = { basics: BASICS, arrows: ARROWS, bombs: BOMBS, blast: BLAST };

/** Which lesson teaches an Adventure unlock, if any. */
export function lessonForUnlock(unlock: string | null): LessonId | null {
  return unlock === "arrows" ? "arrows" : unlock === "bombs" ? "bombs" : unlock === "blast" ? "blast" : null;
}

/** The scripted match for one step: just this board and this one piece. */
export function stepMatch(step: TutorialStep): Match {
  const m = newSandboxMatch();
  m.board = step.board.map((row) => row.map((cell) => ({ ...cell })));
  m.tray = [null, { ...step.piece, cells: step.piece.cells.map(([r, c]) => [r, c] as [number, number]) }, null];
  m.features = cloneFeatures(PLAIN_FEATURES);
  m.score = 0;
  m.over = false;
  m.won = false;
  return m;
}

/** Cells the step's piece must cover. */
export function targetCells(step: TutorialStep): Array<{ r: number; c: number }> {
  return step.piece.cells.map(([dr, dc]) => ({ r: step.at.r + dr, c: step.at.c + dc }));
}
