import {
  COLORS,
  SIZE,
  checkOver,
  cloneBoard,
  cloneMatch,
  isEmpty,
  resolveClears,
  trayFits,
  type Cell,
  type CellPos,
  type ClearInfo,
  type ColorId,
  type Match,
  type SpecialId,
} from "../engine";
import type { VisitorAction, VisitorId, VisitorMood } from "./types";

export function isPlainBlock(cell: Cell): boolean {
  if (cell.t !== "b" && cell.t !== "s") return false;
  if (cell.sp) return false;
  if (cell.ov && cell.ov.length) return false;
  return true;
}

export function colorOfPlain(cell: Cell): ColorId | null {
  if (!isPlainBlock(cell)) return null;
  return cell.t === "b" || cell.t === "s" ? cell.c : null;
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && c >= 0 && r < SIZE && c < SIZE;
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
}

function scan(board: Cell[][], pred: (cell: Cell, r: number, c: number) => boolean): CellPos[] {
  const found: CellPos[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (pred(board[r][c]!, r, c)) found.push([r, c]);
    }
  }
  return found;
}

function empties(board: Cell[][]): CellPos[] {
  return scan(board, (cell) => isEmpty(cell));
}

function plains(board: Cell[][]): CellPos[] {
  return scan(board, (cell) => isPlainBlock(cell));
}

function stones(board: Cell[][]): CellPos[] {
  return scan(board, (cell) => cell.t === "k" && cell.kind !== "wall");
}

function occupiedCount(board: Cell[][]): number {
  let n = 0;
  for (const row of board) for (const cell of row) if (!isEmpty(cell)) n++;
  return n;
}

function remainsPlayable(match: Match, board: Cell[][]): boolean {
  const probe = cloneMatch(match);
  probe.board = board;
  probe.over = false;
  return trayFits(checkOver(probe));
}

function settle(match: Match, board: Cell[][]): { board: Cell[][]; clear: ClearInfo | null; playable: boolean } | null {
  const next = cloneBoard(board);
  const clear = resolveClears(next);
  if (!remainsPlayable(match, next)) return null;
  return { board: next, clear, playable: true };
}

function cloneCell(cell: Cell): Cell {
  return { ...cell };
}

export function applyVisitorAction(
  match: Match,
  action: VisitorAction,
): { match: Match; clear: ClearInfo | null } | null {
  if (match.over || match.won) return null;
  const board = cloneBoard(match.board);

  if (action.kind === "move") {
    const [fr, fc] = action.from;
    const [tr, tc] = action.to;
    if (!inBounds(fr, fc) || !inBounds(tr, tc)) return null;
    if (!isPlainBlock(board[fr][fc]!)) return null;
    if (!isEmpty(board[tr][tc]!)) return null;
    board[tr][tc] = cloneCell(board[fr][fc]!);
    board[fr][fc] = { t: "e" };
  } else if (action.kind === "enchant") {
    const [r, c] = action.at;
    if (!inBounds(r, c) || !isPlainBlock(board[r][c]!)) return null;
    const cell = board[r][c]!;
    if (cell.t !== "b" && cell.t !== "s") return null;
    board[r][c] = { ...cell, sp: action.special };
  } else if (action.kind === "build") {
    const [r, c] = action.at;
    if (!inBounds(r, c) || !isEmpty(board[r][c]!)) return null;
    board[r][c] = { t: "k", hp: 2 };
  } else if (action.kind === "break") {
    const [r, c] = action.at;
    if (!inBounds(r, c) || board[r][c]!.t !== "k") return null;
    const cell = board[r][c]!;
    if (cell.t === "k") {
      if (cell.kind === "wall") return null;
      board[r][c] = cell.hp <= 1 ? { t: "e" } : { t: "k", hp: 1, kind: cell.kind };
    }
  } else if (action.kind === "rotate") {
    for (const step of action.cells) {
      const [fr, fc] = step.from;
      if (!inBounds(fr, fc) || !isPlainBlock(board[fr][fc]!)) return null;
    }
    for (const step of action.cells) {
      const [fr, fc] = step.from;
      board[fr][fc] = { t: "e" };
    }
    for (const step of action.cells) {
      const [tr, tc] = step.to;
      if (!inBounds(tr, tc) || !isEmpty(board[tr][tc]!)) return null;
      board[tr][tc] = cloneCell(step.cell);
    }
  } else if (action.kind === "swap") {
    const [ar, ac] = action.a;
    const [br, bc] = action.b;
    if (!inBounds(ar, ac) || !inBounds(br, bc)) return null;
    if (!isPlainBlock(board[ar][ac]!) || !isPlainBlock(board[br][bc]!)) return null;
    const ca = cloneCell(board[ar][ac]!);
    board[ar][ac] = cloneCell(board[br][bc]!);
    board[br][bc] = ca;
  } else if (action.kind === "recolor") {
    const [r, c] = action.at;
    if (!inBounds(r, c) || !isPlainBlock(board[r][c]!)) return null;
    const cell = board[r][c]!;
    if (cell.t !== "b" && cell.t !== "s") return null;
    if (cell.c === action.to) return null;
    board[r][c] = { ...cell, c: action.to };
  }

  const settled = settle(match, board);
  if (!settled) return null;
  const next = cloneMatch(match);
  next.board = settled.board;
  if (settled.clear) {
    next.stonesCleared += settled.clear.cells.filter((x) => x.cell.t === "k").length;
  }
  checkOver(next);
  if (next.over) return null;
  return { match: next, clear: settled.clear };
}

export function planVisitor(
  match: Match,
  visitor: VisitorId,
  mood: VisitorMood = "help",
  rng: () => number = Math.random,
): VisitorAction | null {
  if (match.over || match.won) return null;
  if (visitor === "milo") return planMilo(match, rng);
  if (visitor === "luna") return planLuna(match, rng);
  if (visitor === "kai") return planKai(match, mood, rng);
  if (visitor === "nia") return planNia(match, rng);
  return planPip(match, mood, rng);
}

function tryAction(match: Match, action: VisitorAction): VisitorAction | null {
  return applyVisitorAction(match, action) ? action : null;
}

function planMilo(match: Match, rng: () => number): VisitorAction | null {
  const board = match.board;
  const froms = shuffled(plains(board), rng);
  const tos = shuffled(empties(board), rng);
  for (const from of froms) {
    const cell = cloneCell(board[from[0]]![from[1]]!);
    for (const to of tos) {
      const action: VisitorAction = { visitor: "milo", kind: "move", from, to, cell };
      if (tryAction(match, action)) return action;
    }
  }
  return null;
}

function planLuna(match: Match, rng: () => number): VisitorAction | null {
  const specials: Array<Exclude<SpecialId, "stone" | "blast">> = ["bomb", "rocketH", "rocketV"];
  for (const at of shuffled(plains(match.board), rng)) {
    const special = specials[Math.floor(rng() * specials.length)]!;
    const action: VisitorAction = { visitor: "luna", kind: "enchant", at, special };
    if (tryAction(match, action)) return action;
  }
  return null;
}

function planKai(match: Match, mood: VisitorMood, rng: () => number): VisitorAction | null {
  const board = match.board;
  const empty = shuffled(empties(board), rng);
  const rock = shuffled(stones(board), rng);
  const filled = occupiedCount(board);
  const crowded = filled >= 26 || rock.length >= 4 || empty.length <= 12;
  const preferBreak = mood === "help" ? crowded || rock.length > 0 && empty.length < 18 : !crowded;
  const order: Array<"break" | "build"> = preferBreak ? ["break", "build"] : ["build", "break"];
  for (const kind of order) {
    if (kind === "break") {
      for (const at of rock) {
        const action: VisitorAction = { visitor: "kai", kind: "break", at };
        if (tryAction(match, action)) return action;
      }
    } else {
      for (const at of empty) {
        const action: VisitorAction = { visitor: "kai", kind: "build", at };
        if (tryAction(match, action)) return action;
      }
    }
  }
  return null;
}

function planNia(match: Match, rng: () => number): VisitorAction | null {
  const board = match.board;
  const origins: CellPos[] = [];
  for (let r = 0; r < SIZE - 1; r++) {
    for (let c = 0; c < SIZE - 1; c++) {
      const quad: CellPos[] = [
        [r, c],
        [r, c + 1],
        [r + 1, c + 1],
        [r + 1, c],
      ];
      if (quad.every(([rr, cc]) => isPlainBlock(board[rr]![cc]!))) origins.push([r, c]);
    }
  }
  for (const origin of shuffled(origins, rng)) {
    const [r, c] = origin;
    const cycle: CellPos[] = [
      [r, c],
      [r, c + 1],
      [r + 1, c + 1],
      [r + 1, c],
    ];
    const cells = cycle.map((from, i) => {
      const to = cycle[(i + 1) % cycle.length]!;
      return { from, to, cell: cloneCell(board[from[0]]![from[1]]!) };
    });
    const action: VisitorAction = { visitor: "nia", kind: "rotate", origin, cells };
    if (tryAction(match, action)) return action;
  }
  const pts = shuffled(plains(board), rng);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
    ] as const) {
      const b: CellPos = [a[0] + dr, a[1] + dc];
      if (!inBounds(b[0], b[1]) || !isPlainBlock(board[b[0]]![b[1]]!)) continue;
      const action: VisitorAction = {
        visitor: "nia",
        kind: "swap",
        a,
        b,
        cellA: cloneCell(board[a[0]]![a[1]]!),
        cellB: cloneCell(board[b[0]]![b[1]]!),
      };
      if (tryAction(match, action)) return action;
    }
  }
  return null;
}

function planPip(match: Match, mood: VisitorMood, rng: () => number): VisitorAction | null {
  const board = match.board;
  for (const at of shuffled(plains(board), rng)) {
    const cell = board[at[0]]![at[1]]!;
    const from = colorOfPlain(cell);
    if (!from) continue;
    let palette = COLORS.filter((c) => c !== from);
    if (mood === "help") {
      const neighbors: ColorId[] = [];
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        const rr = at[0] + dr;
        const cc = at[1] + dc;
        if (!inBounds(rr, cc)) continue;
        const col = colorOfPlain(board[rr]![cc]!);
        if (col && col !== from) neighbors.push(col);
      }
      if (neighbors.length) palette = shuffled(neighbors, rng).concat(palette);
    }
    for (const to of shuffled(palette, rng)) {
      const action: VisitorAction = { visitor: "pip", kind: "recolor", at, from, to };
      if (tryAction(match, action)) return action;
    }
  }
  return null;
}

export function affectedCells(action: VisitorAction): CellPos[] {
  if (action.kind === "move") return [action.from, action.to];
  if (action.kind === "enchant" || action.kind === "build" || action.kind === "break" || action.kind === "recolor") {
    return [action.at];
  }
  if (action.kind === "rotate") return action.cells.map((s) => s.from);
  return [action.a, action.b];
}

export function pickMood(level: number, moves: number, rng: () => number): VisitorMood {
  if (level <= 2 || moves < 16) return "help";
  if (level <= 5) return rng() > 0.35 ? "help" : "mischief";
  return rng() > 0.5 ? "help" : "mischief";
}

export function nextVisitAt(moves: number, rng: () => number): number {
  const gap = 8 + Math.floor(rng() * 5);
  return moves + gap;
}
