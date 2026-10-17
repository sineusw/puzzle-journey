export const SIZE = 8;
export const TRAY_SLOTS = 3;

export type ColorId =
  | "cyan"
  | "lime"
  | "pink"
  | "amber"
  | "violet"
  | "orange"
  | "azure";

export const COLORS: ColorId[] = [
  "cyan",
  "lime",
  "pink",
  "amber",
  "violet",
  "orange",
  "azure",
];

export type SpecialId = "bomb" | "rocketH" | "rocketV" | "blast" | "stone";
export type OverlayId = "ice" | "chain" | "vine" | "lock";
export type ObstacleKind = "stone" | "steel" | "wall" | "crate";

export type Cell =
  | { t: "e" }
  | { t: "b"; c: ColorId; sp?: Exclude<SpecialId, "stone">; ov?: OverlayId[] }
  | { t: "s"; c: ColorId; gold?: boolean; sp?: Exclude<SpecialId, "stone">; ov?: OverlayId[] }
  | { t: "k"; hp: 1 | 2; kind?: ObstacleKind }
  | { t: "crate"; hp: 1 | 2 }
  | { t: "portal"; pair: string; hue: ColorId };

export type CellPos = [number, number];

export type Piece = {
  id: string;
  shape: string;
  cells: CellPos[];
  color: ColorId;
  starAt: number | null;
  gold: boolean;
  special: SpecialId | null;
  specialAt: number | null;
};

export type Goal =
  | { type: "score"; value: number }
  | { type: "lines"; value: number }
  | { type: "combo"; value: number };

/** Game modes. "classic" = plain-block levels, "adventure" = levels that
 *  unlock specials and visitors one at a time, "sandbox" = endless high
 *  score with plain blocks, "challenge" = short goal runs. */
export type GameMode = "classic" | "adventure" | "sandbox" | "challenge";

export type BlockSpecial = Exclude<SpecialId, "stone">;

/** What may appear in a match. Every generator and visitor obeys this. */
export type Features = {
  /** Star gem blocks (bonus points when cleared). */
  stars: boolean;
  /** Special blocks pieces can carry. */
  specials: BlockSpecial[];
  /** Stone obstacles on the board and on pieces. */
  stones: boolean;
  /** Island Visitor ids allowed to drop in. */
  visitors: string[];
};

export const PLAIN_FEATURES: Features = { stars: false, specials: [], stones: false, visitors: [] };

export const ALL_FEATURES: Features = {
  stars: true,
  specials: ["rocketH", "rocketV", "bomb", "blast"],
  stones: true,
  visitors: ["milo", "luna", "kai", "nia", "pip"],
};

export function cloneFeatures(f: Features): Features {
  return { stars: f.stars, specials: [...f.specials], stones: f.stones, visitors: [...f.visitors] };
}

export type Match = {
  board: Cell[][];
  tray: Array<Piece | null>;
  score: number;
  combo: number;
  bestCombo: number;
  lines: number;
  moves: number;
  shield: number;
  /** Placements since the last clear. The combo survives while this stays under COMBO_WINDOW. */
  sinceClear: number;
  /** Perfect (empty-board) clears this run. */
  perfects: number;
  over: boolean;
  won: boolean;
  mode: GameMode;
  levelId: number | null;
  features: Features;
  goal: Goal | null;
  goalProgress: number;
  stonesCleared: number;
  /** Seed for this game's deals, so any tray can be reproduced and tested. */
  seed?: number;
  /** Trays dealt so far (with `seed`, picks the next deal's random stream). */
  deals?: number;
};

export type ClearInfo = {
  rows: number[];
  cols: number[];
  cells: Array<{ r: number; c: number; cell: Cell }>;
  lines: number;
  intersections: number;
  stars: number;
  golds: number;
  waves: number;
  bombs: number;
  rockets: number;
  blasts: number;
  /** Specials that went off, in order, for captions and effects. */
  fired: Array<{ r: number; c: number; sp: Exclude<SpecialId, "stone"> }>;
  /** A star block's color sweep: which color popped and how many blocks. */
  swept?: { color: ColorId; count: number };
  /**
   * Rows and columns a special emptied (arrow, bomb, golden block, star pop)
   * that were at least half full. They count toward "Clear N lines" goals but
   * score as the special, not as a line clear.
   */
  zapLines?: number;
};

/** A line a special empties counts as cleared when it held at least this many blocks. */
export const ZAP_LINE_MIN = 4;

/**
 * Rows and columns that held at least ZAP_LINE_MIN blocks before and are
 * empty after (unbreakable cells aside).
 */
export function countZapLines(before: Cell[][], after: Cell[][]): number {
  let n = 0;
  const filled = (cell: Cell) => cell.t !== "e" && !isUnbreakable(cell);
  for (let i = 0; i < SIZE; i++) {
    let rowBefore = 0;
    let rowAfter = 0;
    let colBefore = 0;
    let colAfter = 0;
    for (let j = 0; j < SIZE; j++) {
      if (filled(before[i]![j]!)) rowBefore++;
      if (filled(after[i]![j]!)) rowAfter++;
      if (filled(before[j]![i]!)) colBefore++;
      if (filled(after[j]![i]!)) colAfter++;
    }
    if (rowBefore >= ZAP_LINE_MIN && rowAfter === 0) n++;
    if (colBefore >= ZAP_LINE_MIN && colAfter === 0) n++;
  }
  return n;
}

export type PlaceResult = {
  ok: boolean;
  match: Match;
  clear: ClearInfo | null;
  gained: number;
  combo: number;
  coins: number;
  /** The clear emptied the whole board. */
  perfect: boolean;
  /** A star block that paid its bonus on this drop. */
  star?: { r: number; c: number; gold: boolean; bonus: number } | null;
};

/**
 * Block Blast-style combo: a streak keeps going as long as the next clear
 * comes within this many placements of the last one.
 */
export const COMBO_WINDOW = 3;

/** Bonus for emptying the whole board, before the combo multiplier. */
export const PERFECT_BONUS = 300;
/** Points for dropping a star block (gold stars are worth more). */
export const STAR_BONUS = 50;
export const STAR_BONUS_GOLD = 200;

type Shape = {
  id: string;
  cells: CellPos[];
  weight: number;
};

const SHAPES: Shape[] = [
  { id: "o1", cells: [[0, 0]], weight: 5 },
  { id: "i2", cells: [[0, 0], [0, 1]], weight: 11 },
  { id: "i3", cells: [[0, 0], [0, 1], [0, 2]], weight: 11 },
  { id: "i4", cells: [[0, 0], [0, 1], [0, 2], [0, 3]], weight: 8 },
  { id: "i5", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], weight: 3 },
  {
    id: "o4",
    cells: [[0, 0], [0, 1], [1, 0], [1, 1]],
    weight: 11,
  },
  {
    id: "r23",
    cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
    weight: 5,
  },
  {
    id: "o9",
    cells: [
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1], [2, 2],
    ],
    weight: 2,
  },
  { id: "l3", cells: [[0, 0], [1, 0], [1, 1]], weight: 11 },
  { id: "l4", cells: [[0, 0], [1, 0], [2, 0], [2, 1]], weight: 8 },
  { id: "j4", cells: [[0, 1], [1, 1], [2, 0], [2, 1]], weight: 8 },
  { id: "l5", cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], weight: 5 },
  { id: "t4", cells: [[0, 0], [0, 1], [0, 2], [1, 1]], weight: 8 },
  { id: "t5", cells: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]], weight: 3 },
  { id: "s4", cells: [[0, 1], [0, 2], [1, 0], [1, 1]], weight: 6 },
  { id: "z4", cells: [[0, 0], [0, 1], [1, 1], [1, 2]], weight: 6 },
  { id: "u5", cells: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]], weight: 4 },
  { id: "plus", cells: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]], weight: 3 },
  { id: "corner5", cells: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], weight: 5 },
  { id: "z5", cells: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]], weight: 3 },
  { id: "diag2", cells: [[0, 0], [1, 1]], weight: 2 },
  { id: "h3", cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2]], weight: 3 },
];

const SHAPE_MAP = new Map(SHAPES.map((s) => [s.id, s]));

/** Cells of a shape by id (for the shape gallery). */
export function shapeCells(id: string): CellPos[] {
  return SHAPE_MAP.get(id)?.cells ?? [[0, 0]];
}

/** Shapes a Tetris player won't expect: gaps, diagonals, pentominoes. */
export const UNUSUAL_SHAPES = ["diag2", "h3", "u5", "plus", "corner5", "z5", "t5", "i5", "o9"] as const;

let seq = 1;
export function uid(prefix = "p"): string {
  return `${prefix}${seq++}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyBoard(): Cell[][] {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ t: "e" as const })),
  );
}

export function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function clonePiece(piece: Piece): Piece {
  return sanitizePiece(piece);
}

export function sanitizePiece(piece: Piece): Piece {
  return {
    id: piece.id,
    shape: piece.shape,
    cells: (piece.cells ?? []).map(([r, c]) => [r, c] as CellPos),
    color: piece.color,
    starAt: piece.starAt ?? null,
    gold: Boolean(piece.gold),
    special: piece.special ?? null,
    specialAt: piece.specialAt ?? null,
  };
}

export function sanitizeMatch(match: Match): Match {
  const legacyMode = (match.mode as string) === "endless";
  return {
    ...match,
    mode: legacyMode ? "sandbox" : match.mode,
    sinceClear: match.sinceClear ?? 0,
    perfects: match.perfects ?? 0,
    features: match.features ? cloneFeatures(match.features) : legacyMode ? cloneFeatures(PLAIN_FEATURES) : cloneFeatures(ALL_FEATURES),
    // Special blocks never wait on the board: an old save's leftovers turn plain.
    board: cloneBoard(match.board ?? emptyBoard()).map((row) => row.map((cell) => ((cell.t === "b" || cell.t === "s") && cell.sp ? { ...cell, sp: undefined } : cell))),
    tray: (match.tray ?? [null, null, null]).map((p) =>
      p ? (p.special && p.special !== "stone" && p.cells.length > 1 ? specialPiece(p.special) : sanitizePiece(p)) : null,
    ),
    goal: match.goal ? { ...match.goal } : null,
  };
}

export function cloneMatch(m: Match): Match {
  return {
    ...m,
    features: cloneFeatures(m.features),
    board: cloneBoard(m.board),
    tray: m.tray.map((p) => (p ? clonePiece(p) : null)),
    goal: m.goal ? { ...m.goal } : null,
  };
}

export function normalize(cells: CellPos[]): CellPos[] {
  const minR = Math.min(...cells.map((x) => x[0]));
  const minC = Math.min(...cells.map((x) => x[1]));
  return cells.map(([r, c]) => [r - minR, c - minC]);
}

export function rotateCW(cells: CellPos[]): CellPos[] {
  return normalize(cells.map(([r, c]) => [c, -r]));
}

export function rotateN(cells: CellPos[], n: number): CellPos[] {
  let next = cells;
  const turns = ((n % 4) + 4) % 4;
  for (let i = 0; i < turns; i++) next = rotateCW(next);
  return next;
}

export function bounds(cells: CellPos[]): { rows: number; cols: number } {
  return {
    rows: Math.max(...cells.map((x) => x[0])) + 1,
    cols: Math.max(...cells.map((x) => x[1])) + 1,
  };
}

export function isEmpty(cell: Cell): boolean {
  return cell.t === "e";
}

export function isUnbreakable(cell: Cell): boolean {
  return cell.t === "k" && cell.kind === "wall";
}

const OVERLAY_ORDER: OverlayId[] = ["ice", "chain", "vine", "lock"];

export function peelCell(board: Cell[][], r: number, c: number): boolean {
  if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return false;
  const cell = board[r][c];
  if (isEmpty(cell) || isUnbreakable(cell)) return false;
  if (cell.t === "k" || cell.t === "crate") {
    if (cell.hp <= 1) board[r][c] = { t: "e" };
    else board[r][c] = { ...cell, hp: 1 };
    return true;
  }
  if ((cell.t === "b" || cell.t === "s") && cell.ov && cell.ov.length) {
    const next = cell.ov.slice().sort((a, b) => OVERLAY_ORDER.indexOf(a) - OVERLAY_ORDER.indexOf(b));
    next.shift();
    board[r][c] = { ...cell, ov: next.length ? next : undefined };
    return true;
  }
  board[r][c] = { t: "e" };
  return true;
}

export function canPlace(
  board: Cell[][],
  cells: CellPos[],
  row: number,
  col: number,
): boolean {
  for (const [dr, dc] of cells) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return false;
    if (!isEmpty(board[r][c])) return false;
  }
  return true;
}

export function canPlaceAnywhere(board: Cell[][], cells: CellPos[]): boolean {
  const { rows, cols } = bounds(cells);
  for (let r = 0; r <= SIZE - rows; r++) {
    for (let c = 0; c <= SIZE - cols; c++) {
      if (canPlace(board, cells, r, c)) return true;
    }
  }
  return false;
}

export function findHint(
  board: Cell[][],
  cells: CellPos[],
): { r: number; c: number } | null {
  const { rows, cols } = bounds(cells);
  for (let r = 0; r <= SIZE - rows; r++) {
    for (let c = 0; c <= SIZE - cols; c++) {
      if (canPlace(board, cells, r, c)) return { r, c };
    }
  }
  return null;
}

/** Shapes that are hard to fit: five-block pieces, the 3×3, and gap shapes. */
const BULKY = new Set(["i5", "o9", "l5", "t5", "u5", "plus", "corner5", "z5", "h3", "diag2", "r23"]);

/**
 * How often bulky shapes appear, by how full the board is. A documented,
 * fixed curve based only on the board: the fuller it gets, the more the
 * deal leans on small, easy-to-read pieces.
 *   under 35% full → normal mix · 35–55% → bulky ×0.6 · over 55% → bulky ×0.3
 */
export function bulkyFactor(occupancy: number): number {
  return occupancy < 0.35 ? 1 : occupancy < 0.55 ? 0.6 : 0.3;
}

function pickShape(rng: () => number, occupancy = 0): Shape {
  const k = bulkyFactor(occupancy);
  const weightOf = (sh: Shape) => (BULKY.has(sh.id) ? sh.weight * k : sh.weight);
  const total = SHAPES.reduce((a, sh) => a + weightOf(sh), 0);
  let roll = rng() * total;
  for (const shape of SHAPES) {
    roll -= weightOf(shape);
    if (roll <= 0) return shape;
  }
  return SHAPES[0];
}

/** Share of board cells that are filled (0–1). */
export function occupancy(board: Cell[][]): number {
  let n = 0;
  for (const row of board) for (const cell of row) if (!isEmpty(cell)) n++;
  return n / (SIZE * SIZE);
}

/** The random stream for this match's next deal (reproducible from seed + deal count). */
export function dealRng(match: Match): () => number {
  if (match.seed === undefined) match.seed = Math.floor(Math.random() * 2 ** 31);
  const n = match.deals ?? 0;
  match.deals = n + 1;
  return mulberry32((match.seed ^ Math.imul(n + 1, 0x9e3779b1)) >>> 0);
}

function pickColor(rng: () => number): ColorId {
  return COLORS[Math.floor(rng() * COLORS.length)]!;
}

/** Pick a special a piece may carry under `features`, or null. */
function rollSpecial(rng: () => number, features: Features): SpecialId | null {
  const roll = rng();
  const has = (sp: BlockSpecial) => features.specials.includes(sp);
  if (roll > 0.985 && has("blast")) return "blast";
  if (roll > 0.93 && has("bomb")) return "bomb";
  if (roll > 0.85 && (has("rocketH") || has("rocketV"))) {
    const dirs = (["rocketH", "rocketV"] as const).filter(has);
    return dirs[Math.floor(rng() * dirs.length)]!;
  }
  if (roll > 0.75 && features.stones) return "stone";
  return null;
}

export function makePiece(rng: () => number, forceShape?: string, features: Features = ALL_FEATURES, occ = 0): Piece {
  const shape = forceShape
    ? SHAPE_MAP.get(forceShape) ?? pickShape(rng, occ)
    : pickShape(rng, occ);
  const turns = Math.floor(rng() * 4);
  const cells = rotateN(shape.cells, turns);
  const starRoll = rng();
  const gold = features.stars && starRoll > 0.97;
  const starAt = features.stars && (gold || starRoll > 0.9) ? Math.floor(rng() * cells.length) : null;
  const special = rollSpecial(rng, features);
  // Bombs, arrows and golden blocks always come as their own single block,
  // so every one behaves the same wherever you drop it.
  if (special && special !== "stone") return specialPiece(special);
  const specialAt = special !== null ? Math.floor(rng() * cells.length) : null;
  return {
    id: uid(),
    shape: shape.id,
    cells,
    color: pickColor(rng),
    starAt,
    gold,
    special,
    specialAt,
  };
}

/** A one-square piece that is a special block (bomb, arrow or golden block). */
export function specialPiece(special: Exclude<SpecialId, "stone">): Piece {
  const color: ColorId = special === "bomb" ? "violet" : special === "blast" ? "amber" : "azure";
  return { id: uid(), shape: "o1", cells: [[0, 0]], color, starAt: null, gold: false, special, specialAt: 0 };
}

export function namedPiece(
  shapeId: string,
  color: ColorId,
  cells: CellPos[],
  starAt: number | null = null,
  gold = false,
  special: SpecialId | null = null,
  specialAt: number | null = null,
): Piece {
  return { id: uid(), shape: shapeId, cells, color, starAt, gold, special, specialAt };
}

export function rotatePiece(piece: Piece): Piece {
  const next = clonePiece(piece);
  next.cells = rotateCW(next.cells);
  return next;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


function sprinkleStones(board: Cell[][], count: number, rng: () => number): void {
  let placed = 0;
  let guard = 0;
  while (placed < count && guard < 200) {
    guard++;
    const r = Math.floor(rng() * SIZE);
    const c = Math.floor(rng() * SIZE);
    if (!isEmpty(board[r][c])) continue;
    board[r][c] = { t: "k", hp: rng() > 0.55 ? 2 : 1 };
    placed++;
  }
}

/** Mid-run board that matches the Block Journey mock — no full lines. */
export function openingBoard(): Cell[][] {
  const b = emptyBoard();
  const put = (r: number, c: number, cell: Cell) => {
    b[r][c] = cell;
  };
  const blk = (c: ColorId): Cell => ({ t: "b", c });
  const star = (c: ColorId, gold = false): Cell => ({ t: "s", c, gold });
  const stone = (hp: 1 | 2 = 1): Cell => ({ t: "k", hp });

  put(0, 2, blk("cyan"));
  put(0, 3, blk("cyan"));
  put(1, 2, blk("cyan"));
  put(1, 3, blk("lime"));
  put(2, 2, stone(1));
  put(2, 3, blk("lime"));
  put(2, 5, star("azure"));
  put(2, 7, blk("violet"));
  put(3, 5, blk("amber"));
  put(3, 6, blk("amber"));
  put(3, 7, blk("violet"));
  put(4, 3, blk("pink"));
  put(4, 4, blk("pink"));
  put(4, 6, blk("amber"));
  put(4, 7, blk("amber"));
  put(5, 2, star("azure"));
  put(5, 3, blk("pink"));
  put(5, 4, blk("pink"));
  put(6, 0, blk("lime"));
  put(6, 1, blk("lime"));
  put(6, 2, blk("lime"));
  put(6, 4, star("orange", true));
  put(6, 6, stone(2));
  put(7, 0, blk("cyan"));
  put(7, 1, blk("cyan"));
  put(7, 2, stone(1));
  put(7, 3, blk("amber"));
  put(7, 6, star("violet"));
  put(7, 7, blk("violet"));
  return b;
}

export function openingTray(): Array<Piece | null> {
  return [
    namedPiece("t4", "pink", [[0, 1], [1, 0], [1, 1], [1, 2]]),
    namedPiece("o4", "amber", [[0, 0], [0, 1], [1, 0], [1, 1]], null, false, "bomb", 0),
    namedPiece("l4", "cyan", [[0, 0], [1, 0], [1, 1], [1, 2]], null, false, "rocketH", 3),
  ];
}

function findFullLines(board: Cell[][]): { rows: number[]; cols: number[] } {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let r = 0; r < SIZE; r++) {
    if (board[r].every((cell) => !isEmpty(cell))) rows.push(r);
  }
  for (let c = 0; c < SIZE; c++) {
    let full = true;
    for (let r = 0; r < SIZE; r++) {
      if (isEmpty(board[r][c])) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }
  return { rows, cols };
}

function applyLineClear(board: Cell[][], rows: number[], cols: number[]): ClearInfo {
  const marked = new Set<string>();
  const cells: ClearInfo["cells"] = [];
  let stars = 0;
  let golds = 0;
  let intersections = 0;

  const mark = (r: number, c: number, fromRow: boolean, fromCol: boolean) => {
    const key = `${r},${c}`;
    if (marked.has(key)) return;
    marked.add(key);
    const cell = board[r][c];
    cells.push({ r, c, cell: { ...cell } });
    if (fromRow && fromCol) intersections++;
    if (cell.t === "s") {
      stars++;
      if (cell.gold) golds++;
    }
  };

  const rowSet = new Set(rows);
  const colSet = new Set(cols);
  for (const r of rows) {
    for (let c = 0; c < SIZE; c++) mark(r, c, true, colSet.has(c));
  }
  for (const c of cols) {
    for (let r = 0; r < SIZE; r++) mark(r, c, rowSet.has(r), true);
  }

  for (const { r, c } of cells) {
    peelCell(board, r, c);
  }

  return {
    rows,
    cols,
    cells,
    lines: rows.length + cols.length,
    intersections,
    stars,
    golds,
    waves: 1,
    bombs: 0,
    rockets: 0,
    blasts: 0,
    fired: [],
  };
}

function specialOf(cell: Cell): Exclude<SpecialId, "stone"> | null {
  if (cell.t === "b" || cell.t === "s") return cell.sp ?? null;
  return null;
}

type SpecialAcc = {
  bombs: number;
  rockets: number;
  blasts: number;
  queued: Array<{ r: number; c: number; sp: Exclude<SpecialId, "stone"> }>;
  fired: Array<{ r: number; c: number; sp: Exclude<SpecialId, "stone"> }>;
  extra: Array<{ r: number; c: number; cell: Cell }>;
};

function hitCell(board: Cell[][], r: number, c: number, acc: SpecialAcc): boolean {
  if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return false;
  const cell = board[r][c];
  if (isEmpty(cell) || isUnbreakable(cell)) return false;
  const sp = specialOf(cell);
  acc.extra.push({ r, c, cell: { ...cell } });
  peelCell(board, r, c);
  if (isEmpty(board[r][c]) && sp) acc.queued.push({ r, c, sp });
  return true;
}

function fireSpecial(board: Cell[][], r: number, c: number, sp: Exclude<SpecialId, "stone">, acc: SpecialAcc): void {
  acc.fired.push({ r, c, sp });
  if (sp === "bomb") {
    acc.bombs++;
    for (let rr = r - 1; rr <= r + 1; rr++) {
      for (let cc = c - 1; cc <= c + 1; cc++) hitCell(board, rr, cc, acc);
    }
  } else if (sp === "rocketH") {
    acc.rockets++;
    for (let cc = 0; cc < SIZE; cc++) hitCell(board, r, cc, acc);
  } else if (sp === "rocketV") {
    acc.rockets++;
    for (let rr = 0; rr < SIZE; rr++) hitCell(board, rr, c, acc);
  } else if (sp === "blast") {
    acc.blasts++;
    for (let rr = 0; rr < SIZE; rr++) {
      for (let cc = 0; cc < SIZE; cc++) hitCell(board, rr, cc, acc);
    }
  }
}

/**
 * A special block goes off the moment it's placed: an arrow zaps its whole
 * row or column, a bomb clears the 3×3 around it, a golden block clears the
 * board. Any specials it hits go off too.
 */
function detonatePlaced(board: Cell[][], piece: Piece, row: number, col: number): ClearInfo | null {
  const sp = piece.special;
  if (!sp || sp === "stone" || piece.specialAt === null) return null;
  const at = piece.cells[piece.specialAt];
  if (!at) return null;
  const r = row + at[0];
  const c = col + at[1];
  const here = board[r]?.[c];
  if (!here || (here.t !== "b" && here.t !== "s") || here.sp !== sp) return null;
  const acc: SpecialAcc = { bombs: 0, rockets: 0, blasts: 0, queued: [], fired: [], extra: [] };
  const done = new Set<string>([`${r},${c},${sp}`]);
  fireSpecial(board, r, c, sp, acc);
  while (acc.queued.length) {
    const next = acc.queued.shift()!;
    const key = `${next.r},${next.c},${next.sp}`;
    if (done.has(key)) continue;
    done.add(key);
    fireSpecial(board, next.r, next.c, next.sp, acc);
  }
  const seen = new Set<string>();
  const cells = acc.extra.filter(({ r: rr, c: cc }) => (seen.has(`${rr},${cc}`) ? false : (seen.add(`${rr},${cc}`), true)));
  return {
    rows: [],
    cols: [],
    cells,
    lines: 0,
    intersections: 0,
    stars: 0,
    golds: 0,
    waves: 1,
    bombs: acc.bombs,
    rockets: acc.rockets,
    blasts: acc.blasts,
    fired: acc.fired,
  };
}

/** Set off the special block sitting at (r, c), e.g. after Luna's magic. */
export function detonateAt(board: Cell[][], r: number, c: number): ClearInfo | null {
  const cell = board[r]?.[c];
  if (!cell || (cell.t !== "b" && cell.t !== "s") || !cell.sp) return null;
  return detonatePlaced(board, { id: "x", shape: "o1", cells: [[0, 0]], color: cell.c, starAt: null, gold: false, special: cell.sp, specialAt: 0 }, r, c);
}

export function mergeClears(a: ClearInfo | null, b: ClearInfo | null): ClearInfo | null {
  if (!a) return b;
  if (!b) return a;
  const seen = new Set(a.cells.map(({ r, c }) => `${r},${c}`));
  return {
    rows: [...b.rows],
    cols: [...b.cols],
    cells: [...a.cells, ...b.cells.filter(({ r, c }) => !seen.has(`${r},${c}`))],
    lines: a.lines + b.lines,
    intersections: a.intersections + b.intersections,
    stars: a.stars + b.stars,
    golds: a.golds + b.golds,
    waves: a.waves + b.waves,
    bombs: a.bombs + b.bombs,
    rockets: a.rockets + b.rockets,
    blasts: a.blasts + b.blasts,
    fired: [...a.fired, ...b.fired],
    ...(a.zapLines || b.zapLines ? { zapLines: (a.zapLines ?? 0) + (b.zapLines ?? 0) } : {}),
    ...(a.swept || b.swept ? { swept: b.swept ?? a.swept } : {}),
  };
}

/** Put a piece down: its special goes off, then full lines clear. */
function settlePiece(board: Cell[][], piece: Piece, row: number, col: number): ClearInfo | null {
  stampPiece(board, piece, row, col);
  // Full lines first (a special inside one goes off with it)…
  const lines = resolveClears(board);
  const at = piece.specialAt !== null ? piece.cells[piece.specialAt] : undefined;
  const alreadyFired = Boolean(at && lines?.fired.some((f) => f.r === row + at[0] && f.c === col + at[1]));
  const beforeSpecials = cloneBoard(board);
  // …then a special that's still sitting there goes off right away.
  let specials = alreadyFired ? null : detonatePlaced(board, piece, row, col);
  // Nothing ever waits for a full line: any other special left on the board goes off too.
  specials = mergeClears(specials, fireDormant(board));
  if (specials) {
    const zap = countZapLines(beforeSpecials, board);
    if (zap) specials.zapLines = zap;
  }
  let clear = mergeClears(lines, specials);
  // Stones crack when anything right next to them clears (two cracks break one).
  clear = mergeClears(clear, crackStonesNear(board, clear));
  return clear;
}

/** Each stone touching a cleared cell takes one hit (once per move). */
function crackStonesNear(board: Cell[][], clear: ClearInfo | null): ClearInfo | null {
  if (!clear || !clear.cells.length) return null;
  const gone = new Set(clear.cells.map(({ r, c }) => `${r},${c}`));
  const hit = new Set<string>();
  const cells: ClearInfo["cells"] = [];
  for (const { r, c } of clear.cells) {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const rr = r + dr;
      const cc = c + dc;
      const key = `${rr},${cc}`;
      if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE || hit.has(key) || gone.has(key)) continue;
      const cell = board[rr]![cc]!;
      if (cell.t !== "k" || isUnbreakable(cell)) continue;
      hit.add(key);
      const before = { ...cell };
      peelCell(board, rr, cc);
      if (board[rr]![cc]!.t === "e") cells.push({ r: rr, c: cc, cell: before });
    }
  }
  if (!cells.length) return null;
  return { rows: [], cols: [], cells, lines: 0, intersections: 0, stars: 0, golds: 0, waves: 0, bombs: 0, rockets: 0, blasts: 0, fired: [] };
}

/** Set off every special block still sitting on the board. */
function fireDormant(board: Cell[][]): ClearInfo | null {
  let out: ClearInfo | null = null;
  for (let guard = 0; guard < SIZE * SIZE; guard++) {
    let found: { r: number; c: number } | null = null;
    for (let r = 0; r < SIZE && !found; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = board[r]![c]!;
        if ((cell.t === "b" || cell.t === "s") && cell.sp) {
          found = { r, c };
          break;
        }
      }
    }
    if (!found) break;
    const boom = detonateAt(board, found.r, found.c);
    if (!boom) {
      const cell = board[found.r]![found.c]!;
      if (cell.t === "b" || cell.t === "s") board[found.r]![found.c] = { ...cell, sp: undefined };
      continue;
    }
    out = mergeClears(out, boom);
  }
  return out;
}

export function resolveClears(board: Cell[][]): ClearInfo | null {
  const merged: ClearInfo = {
    rows: [],
    cols: [],
    cells: [],
    lines: 0,
    intersections: 0,
    stars: 0,
    golds: 0,
    waves: 0,
    bombs: 0,
    rockets: 0,
    blasts: 0,
    fired: [],
  };
  const seen = new Set<string>();
  for (let wave = 0; wave < SIZE; wave++) {
    const { rows, cols } = findFullLines(board);
    if (rows.length + cols.length === 0) break;
    const info = applyLineClear(board, rows, cols);
    const acc: SpecialAcc = { bombs: 0, rockets: 0, blasts: 0, queued: [], fired: [], extra: [] };
    const fired = new Set<string>();
    for (const cell of info.cells) {
      const sp = specialOf(cell.cell);
      if (!sp) continue;
      const key = `${cell.r},${cell.c},${sp}`;
      if (fired.has(key)) continue;
      fired.add(key);
      fireSpecial(board, cell.r, cell.c, sp, acc);
    }
    while (acc.queued.length) {
      const next = acc.queued.shift()!;
      const key = `${next.r},${next.c},${next.sp}`;
      if (fired.has(key)) continue;
      fired.add(key);
      fireSpecial(board, next.r, next.c, next.sp, acc);
    }
    merged.waves++;
    merged.lines += info.lines;
    merged.intersections += info.intersections;
    merged.stars += info.stars;
    merged.golds += info.golds;
    merged.bombs += acc.bombs;
    merged.rockets += acc.rockets;
    merged.blasts += acc.blasts;
    merged.fired.push(...acc.fired);
    for (const r of rows) if (!merged.rows.includes(r)) merged.rows.push(r);
    for (const c of cols) if (!merged.cols.includes(c)) merged.cols.push(c);
    for (const cell of info.cells) {
      const key = `${cell.r},${cell.c}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.cells.push(cell);
    }
    for (const cell of acc.extra) {
      const key = `${cell.r},${cell.c}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.cells.push(cell);
    }
  }
  return merged.lines > 0 || merged.bombs > 0 || merged.rockets > 0 || merged.blasts > 0 ? merged : null;
}

export function previewClear(
  board: Cell[][],
  piece: Piece,
  row: number,
  col: number,
): ClearInfo | null {
  if (!canPlace(board, piece.cells, row, col)) return null;
  const next = cloneBoard(board);
  return settleWithStar(next, piece, row, col);
}

/**
 * A star block is a color bomb: drop it and every block of its color on the
 * board pops (the piece itself included).
 */
export function colorSweep(board: Cell[][], color: ColorId): ClearInfo | null {
  const cells: ClearInfo["cells"] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = board[r]![c]!;
      if ((cell.t === "b" || cell.t === "s") && cell.c === color) {
        cells.push({ r, c, cell: { ...cell } });
        peelCell(board, r, c);
      }
    }
  }
  if (!cells.length) return null;
  return { rows: [], cols: [], cells, lines: 0, intersections: 0, stars: 0, golds: 0, waves: 1, bombs: 0, rockets: 0, blasts: 0, fired: [], swept: { color, count: cells.length } };
}

/** Put a piece down, then (for a star block) sweep its color. */
function settleWithStar(board: Cell[][], piece: Piece, row: number, col: number): ClearInfo | null {
  const star = piece.starAt !== null;
  const clear = settlePiece(board, star ? { ...piece, starAt: null, gold: false } : piece, row, col);
  if (!star) return clear;
  const beforeSweep = cloneBoard(board);
  const sweep = colorSweep(board, piece.color);
  if (sweep) {
    const zap = countZapLines(beforeSweep, board);
    if (zap) sweep.zapLines = zap;
  }
  const merged = mergeClears(clear, sweep);
  if (merged && sweep?.swept) merged.swept = sweep.swept;
  return merged;
}

function stampPiece(board: Cell[][], piece: Piece, row: number, col: number): void {
  piece.cells.forEach(([dr, dc], i) => {
    const r = row + dr;
    const c = col + dc;
    const isSpec = piece.special !== null && piece.specialAt === i;
    if (isSpec && piece.special === "stone") {
      board[r][c] = { t: "k", hp: 2 };
      return;
    }
    const star = piece.starAt === i;
    const sp = isSpec && piece.special && piece.special !== "stone" ? piece.special : undefined;
    if (star) board[r][c] = { t: "s", c: piece.color, gold: piece.gold, ...(sp ? { sp } : {}) };
    else board[r][c] = { t: "b", c: piece.color, ...(sp ? { sp } : {}) };
  });
}

/**
 * Score for one placement, Block Blast style:
 * - every block placed is worth 10
 * - each cleared line is worth 100; clearing several at once adds a growing
 *   bonus (2 lines = 300, 3 = 600, 4 = 1,000 …) instead of a flat sum
 * - the whole clear is multiplied by the current combo streak
 * - stars, specials and a perfect (empty-board) clear add on top
 */
function scoreFor(piece: Piece, clear: ClearInfo | null, combo: number, perfect: boolean): number {
  let score = piece.cells.length * 10;
  if (clear && (clear.lines > 0 || clear.bombs || clear.rockets || clear.blasts || clear.swept)) {
    const n = clear.lines;
    const lineScore = (100 * n * (n + 1)) / 2;
    score += lineScore * combo;
    score += clear.intersections * 25 * combo;
    score += clear.stars * 50 + clear.golds * 150;
    score += clear.bombs * 80 * combo;
    score += clear.rockets * 70 * combo;
    score += clear.blasts * 240 * combo;
    score += (clear.swept?.count ?? 0) * 15 * combo;
    if (perfect) score += PERFECT_BONUS * combo;
  }
  return score;
}

/** True when nothing breakable is left on the board. */
export function boardIsEmpty(board: Cell[][]): boolean {
  return board.every((row) => row.every((cell) => cell.t === "e" || isUnbreakable(cell)));
}

function coinsFor(clear: ClearInfo | null, gained: number): number {
  const lineCoins = clear ? clear.lines * 4 : 0;
  return lineCoins + Math.floor(gained / 80);
}

function updateGoal(match: Match): void {
  if (!match.goal) {
    match.goalProgress = 0;
    match.won = false;
    return;
  }
  if (match.goal.type === "score") match.goalProgress = match.score;
  else if (match.goal.type === "lines") match.goalProgress = match.lines;
  else match.goalProgress = match.bestCombo;
  match.won = match.goalProgress >= match.goal.value;
}

export function trayFits(match: Match): boolean {
  const remaining = match.tray.filter((p): p is Piece => p !== null);
  if (remaining.length === 0) return true;
  return remaining.some((p) => canPlaceAnywhere(match.board, p.cells));
}

export function checkOver(match: Match): Match {
  if (match.won) {
    match.over = false;
    return match;
  }
  const remaining = match.tray.filter((p): p is Piece => p !== null);
  if (remaining.length === 0) {
    match.over = false;
    return match;
  }
  match.over = !remaining.some((p) => canPlaceAnywhere(match.board, p.cells));
  return match;
}

/**
 * True when every piece in the set can be placed, one after another, in some
 * order — including the line clears each placement triggers. This is what
 * keeps a fresh set from being a guaranteed loss.
 *
 * The search is bounded by `budget` placements tried; if the budget runs out
 * the set is treated as playable (we only ever reject sets we've *proven* dead).
 */
/**
 * True when there is at least one order and set of spots that places every
 * piece, using the same placement rules as real play (clears, specials,
 * stones). The search is capped; if the cap runs out first the tray is NOT
 * treated as proven, so the dealer tries another or falls back to small
 * pieces that are checked the same way.
 */
export function setIsPlayable(board: Cell[][], pieces: Piece[], budget = 6000): boolean {
  let tries = 0;
  const visit = (b: Cell[][], left: Piece[]): boolean => {
    if (left.length === 0) return true;
    if (left.length === 1) return canPlaceAnywhere(b, left[0]!.cells);
    for (let i = 0; i < left.length; i++) {
      const p = left[i]!;
      const { rows, cols } = bounds(p.cells);
      const rest = left.filter((_, j) => j !== i);
      for (let r = 0; r <= SIZE - rows; r++) {
        for (let c = 0; c <= SIZE - cols; c++) {
          if (!canPlace(b, p.cells, r, c)) continue;
          if (++tries > budget) return false;
          const next = cloneBoard(b);
          settlePiece(next, p, r, c);
          if (visit(next, rest)) return true;
        }
      }
    }
    return false;
  };
  return visit(board, pieces);
}

function fillTray(match: Match, rng: () => number, easy: boolean): void {
  const f = match.features;
  const occ = occupancy(match.board);
  const make = (shape?: string) => makePiece(rng, shape, f, occ);
  const makeFitting = (): Piece[] => {
    if (easy) {
      return [make("o4"), make("i3"), make("l3")];
    }
    let partial: Piece[] | null = null;
    for (let attempt = 0; attempt < 28; attempt++) {
      const pieces = [make(), make(), make()];
      // Variety you can read: never three of the same shape in one tray.
      if (pieces[0]!.shape === pieces[1]!.shape && pieces[1]!.shape === pieces[2]!.shape) continue;
      if (!pieces.some((p) => canPlaceAnywhere(match.board, p.cells))) continue;
      if (setIsPlayable(match.board, pieces)) return pieces;
      partial ??= pieces;
    }
    // Crowded board: small pieces are the fairest offer if they all fit.
    const small = [make("o1"), make("i2"), make("l3")];
    if (setIsPlayable(match.board, small)) return small;
    return partial ?? small;
  };
  const pieces = makeFitting();
  // When specials are unlocked, make sure they actually show up now and then:
  // half the sets without one get one of the allowed kinds.
  const anySpecial = f.specials.length > 0 || f.stones;
  if (anySpecial && !pieces.some((p) => p.special) && rng() < 0.3) {
    const i = Math.floor(rng() * pieces.length);
    const special = rollSpecial(() => 0.76 + rng() * 0.24, f);
    if (special) pieces[i] = special === "stone" ? { ...pieces[i]!, special, specialAt: 0 } : specialPiece(special);
  }
  match.tray = pieces;
}

export function refillIfNeeded(match: Match, rng?: () => number): Match {
  if (match.tray.every((p) => p === null)) fillTray(match, rng ?? dealRng(match), false);
  return checkOver(match);
}

function blankMatch(features: Features = PLAIN_FEATURES): Match {
  return {
    features: cloneFeatures(features),
    board: emptyBoard(),
    tray: [null, null, null],
    score: 0,
    combo: 0,
    bestCombo: 0,
    lines: 0,
    moves: 0,
    shield: 0,
    sinceClear: 0,
    perfects: 0,
    over: false,
    won: false,
    mode: "sandbox",
    levelId: null,
    goal: null,
    goalProgress: 0,
    stonesCleared: 0,
    // One random seed per game; every deal after this is reproducible from it.
    seed: Math.floor(Math.random() * 2 ** 31),
    deals: 0,
  };
}

/** Short goal run on a fresh board (Challenges). Uses the full feature set. */
export function newGoalMatch(goal: Goal, features: Features = ALL_FEATURES): Match {
  const match = blankMatch(features);
  match.mode = "challenge";
  match.goal = goal;
  fillTray(match, dealRng(match), true);
  updateGoal(match);
  return match;
}

/** Sandbox: endless, plain blocks only, chase the high score. */
export function newSandboxMatch(): Match {
  const match = blankMatch(PLAIN_FEATURES);
  match.mode = "sandbox";
  fillTray(match, dealRng(match), true);
  return match;
}

/** Kept for older callers and tests: the endless run is now Sandbox. */
export function newEndlessMatch(opts?: { showcase?: boolean }): Match {
  if (opts?.showcase) {
    const match = blankMatch(ALL_FEATURES);
    match.board = openingBoard();
    match.tray = openingTray();
    return checkOver(match);
  }
  return newSandboxMatch();
}

/** A level in Classic or Adventure. Stones are only placed when allowed. */
export function newLevelMatch(
  mode: "classic" | "adventure",
  levelId: number,
  goal: Goal,
  stones: number,
  features: Features,
): Match {
  const rng = mulberry32(levelId * 9973 + (mode === "classic" ? 4219 : 17));
  const board = emptyBoard();
  if (features.stones) sprinkleStones(board, stones, rng);
  const match = blankMatch(features);
  match.board = board;
  match.mode = mode;
  match.levelId = levelId;
  match.goal = goal;
  fillTray(match, rng, levelId <= 2);
  updateGoal(match);
  return match;
}

export function newAdventureMatch(levelId: number, goal: Goal, stones: number, features: Features = ALL_FEATURES): Match {
  return newLevelMatch("adventure", levelId, goal, stones, features);
}

export function placePiece(
  match: Match,
  trayIndex: number,
  row: number,
  col: number,
): PlaceResult {
  const piece = match.tray[trayIndex];
  if (!piece || match.over) {
    return { ok: false, match, clear: null, gained: 0, combo: match.combo, coins: 0, perfect: false };
  }
  if (!canPlace(match.board, piece.cells, row, col)) {
    return { ok: false, match, clear: null, gained: 0, combo: match.combo, coins: 0, perfect: false };
  }

  const next = cloneMatch(match);
  // A star block pays its bonus the moment it's dropped, then is a plain block.
  const starBonus = piece.starAt !== null ? (piece.gold ? STAR_BONUS_GOLD : STAR_BONUS) : 0;
  const clear = settleWithStar(next.board, piece, row, col);
  next.tray[trayIndex] = null;
  next.moves += 1;

  if (clear) {
    // A clear within the window extends the streak; otherwise it starts a new one.
    next.combo = match.sinceClear < COMBO_WINDOW ? match.combo + 1 : 1;
    next.sinceClear = 0;
    next.lines += clear.lines + (clear.zapLines ?? 0);
    next.stonesCleared += clear.cells.filter((c) => c.cell.t === "k").length;
  } else {
    next.sinceClear = match.sinceClear + 1;
    if (next.sinceClear >= COMBO_WINDOW && next.combo > 0) {
      // Frost: spend a charge to keep the streak alive a little longer.
      if (next.shield > 0) {
        next.shield -= 1;
        next.sinceClear = COMBO_WINDOW - 1;
      } else {
        next.combo = 0;
      }
    }
  }
  next.bestCombo = Math.max(next.bestCombo, next.combo);

  // A golden block empties the board by itself; that isn't a "perfect" clear.
  const perfect = Boolean(clear) && !clear?.blasts && boardIsEmpty(next.board);
  if (perfect) next.perfects += 1;
  const comboForScore = Math.max(1, next.combo);
  const gained = scoreFor(piece, clear, comboForScore, perfect) + starBonus;
  next.score += gained;
  updateGoal(next);
  refillIfNeeded(next);
  checkOver(next);

  return {
    ok: true,
    match: next,
    clear,
    gained,
    combo: next.combo,
    coins: coinsFor(clear, gained) + (perfect ? 20 : 0),
    perfect,
    star:
      starBonus && piece.starAt !== null && piece.cells[piece.starAt]
        ? { r: row + piece.cells[piece.starAt]![0], c: col + piece.cells[piece.starAt]![1], gold: piece.gold, bonus: starBonus }
        : null,
  };
}

export function hammerCell(match: Match, row: number, col: number): Match | null {
  if (row < 0 || col < 0 || row >= SIZE || col >= SIZE) return null;
  if (isEmpty(match.board[row][col]) || isUnbreakable(match.board[row][col])) return null;
  const next = cloneMatch(match);
  peelCell(next.board, row, col);
  next.over = false;
  checkOver(next);
  return next;
}

export function bombCell(match: Match, row: number, col: number): Match | null {
  if (row < 0 || col < 0 || row >= SIZE || col >= SIZE) return null;
  const next = cloneMatch(match);
  let hit = false;
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) continue;
      if (!isEmpty(next.board[r][c])) {
        next.board[r][c] = { t: "e" };
        hit = true;
      }
    }
  }
  if (!hit) return null;
  next.over = false;
  checkOver(next);
  return next;
}

export function refreshTray(match: Match): Match {
  const next = cloneMatch(match);
  fillTray(next, dealRng(next), false);
  next.over = false;
  checkOver(next);
  return next;
}

export function applyFreeze(match: Match): Match {
  const next = cloneMatch(match);
  next.shield += 2;
  return next;
}

/** The rows Continue will empty: the two fullest (ties go to the lower row). */
export function continueRows(board: Cell[][]): number[] {
  return board
    .map((row, r) => ({ r, n: row.filter((cell) => !isEmpty(cell)).length }))
    .sort((a, b) => b.n - a.n || b.r - a.r)
    .slice(0, 2)
    .map((x) => x.r)
    .sort((a, b) => a - b);
}

export function continueMatch(match: Match): Match {
  const next = cloneMatch(match);
  // Predictable: Continue always empties the two fullest rows, then deals a
  // tray that's checked to fit.
  for (const r of continueRows(next.board)) for (let c = 0; c < SIZE; c++) next.board[r]![c] = { t: "e" };
  next.over = false;
  fillTray(next, dealRng(next), false);
  checkOver(next);
  return next;
}

/** Praise for a clear, by how many lines went at once. Null for a single line. */
export function praiseFor(lines: number, perfect: boolean): string | null {
  if (perfect) return "Perfect!";
  if (lines >= 6) return "Unbelievable!";
  if (lines === 5) return "Amazing!";
  if (lines === 4) return "Excellent!";
  if (lines === 3) return "Great!";
  if (lines === 2) return "Good!";
  return null;
}

/** Kept for older callers. */
export function comboLabel(combo: number): string {
  return combo > 1 ? `Combo ${combo}` : "Clear";
}

export function burstLabel(lines: number): string {
  return praiseFor(lines, false) ?? "Line";
}

/**
 * How far (in cells) a drag may be nudged to the nearest legal spot.
 * Kept at 1 so a drop never lands somewhere the player wasn't pointing.
 */
export const SNAP_RADIUS = 1;

export function snapPlace(
  board: Cell[][],
  cells: CellPos[],
  row: number,
  col: number,
): { r: number; c: number } | null {
  if (canPlace(board, cells, row, col)) return { r: row, c: col };
  let best: { r: number; c: number; d: number } | null = null;
  for (let dr = -SNAP_RADIUS; dr <= SNAP_RADIUS; dr++) {
    for (let dc = -SNAP_RADIUS; dc <= SNAP_RADIUS; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (!canPlace(board, cells, r, c)) continue;
      const d = dr * dr + dc * dc;
      if (!best || d < best.d) best = { r, c, d };
    }
  }
  return best ? { r: best.r, c: best.c } : null;
}

export function placeFromCell(
  board: Cell[][],
  cells: CellPos[],
  row: number,
  col: number,
): { r: number; c: number } | null {
  let best: { r: number; c: number; d: number } | null = null;
  for (const [dr, dc] of cells) {
    const r = row - dr;
    const c = col - dc;
    if (!canPlace(board, cells, r, c)) continue;
    const d = dr * dr + dc * dc;
    if (!best || d < best.d) best = { r, c, d };
  }
  return best ? { r: best.r, c: best.c } : snapPlace(board, cells, row, col);
}

export function cellColor(cell: Cell): ColorId | "stone" | "crate" | "wall" | null {
  if (cell.t === "b" || cell.t === "s") return cell.c;
  if (cell.t === "k") return cell.kind === "wall" ? "wall" : cell.kind === "crate" ? "crate" : "stone";
  if (cell.t === "crate") return "crate";
  if (cell.t === "portal") return cell.hue;
  return null;
}

export function pieceFits(match: Match, piece: Piece): boolean {
  return canPlaceAnywhere(match.board, piece.cells);
}
