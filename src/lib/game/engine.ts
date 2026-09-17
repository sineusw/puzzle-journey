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

export type Match = {
  board: Cell[][];
  tray: Array<Piece | null>;
  score: number;
  combo: number;
  bestCombo: number;
  lines: number;
  moves: number;
  shield: number;
  over: boolean;
  won: boolean;
  mode: "endless" | "adventure";
  levelId: number | null;
  goal: Goal | null;
  goalProgress: number;
  stonesCleared: number;
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
};

export type PlaceResult = {
  ok: boolean;
  match: Match;
  clear: ClearInfo | null;
  gained: number;
  combo: number;
  coins: number;
};

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
const WEIGHT_SUM = SHAPES.reduce((a, s) => a + s.weight, 0);

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
  return {
    ...match,
    board: cloneBoard(match.board ?? emptyBoard()),
    tray: (match.tray ?? [null, null, null]).map((p) => (p ? sanitizePiece(p) : null)),
    goal: match.goal ? { ...match.goal } : null,
  };
}

export function cloneMatch(m: Match): Match {
  return {
    ...m,
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

function pickShape(rng: () => number): Shape {
  let roll = rng() * WEIGHT_SUM;
  for (const shape of SHAPES) {
    roll -= shape.weight;
    if (roll <= 0) return shape;
  }
  return SHAPES[0];
}

function pickColor(rng: () => number): ColorId {
  return COLORS[Math.floor(rng() * COLORS.length)]!;
}

export function makePiece(rng: () => number, forceShape?: string): Piece {
  const shape = forceShape
    ? SHAPE_MAP.get(forceShape) ?? pickShape(rng)
    : pickShape(rng);
  const turns = Math.floor(rng() * 4);
  const cells = rotateN(shape.cells, turns);
  const starRoll = rng();
  const gold = starRoll > 0.97;
  const starAt = gold || starRoll > 0.9 ? Math.floor(rng() * cells.length) : null;
  const specRoll = rng();
  let special: SpecialId | null = null;
  if (specRoll > 0.93) special = "blast";
  else if (specRoll > 0.78) special = "bomb";
  else if (specRoll > 0.64) special = rng() > 0.5 ? "rocketH" : "rocketV";
  else if (specRoll > 0.52) special = "stone";
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

function defaultRng(): () => number {
  return Math.random;
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

/** Mid-run board that matches the Puzzle Journey mock — no full lines. */
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
  put(3, 5, { t: "b", c: "amber", sp: "rocketV" });
  put(3, 6, blk("amber"));
  put(3, 7, blk("violet"));
  put(4, 3, { t: "b", c: "pink", sp: "bomb" });
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
  };
  const seen = new Set<string>();
  for (let wave = 0; wave < SIZE; wave++) {
    const { rows, cols } = findFullLines(board);
    if (rows.length + cols.length === 0) break;
    const info = applyLineClear(board, rows, cols);
    const acc: SpecialAcc = { bombs: 0, rockets: 0, blasts: 0, queued: [], extra: [] };
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
  stampPiece(next, piece, row, col);
  return resolveClears(next);
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

function scoreFor(piece: Piece, clear: ClearInfo | null, combo: number): number {
  let score = piece.cells.length * 10;
  if (clear && (clear.lines > 0 || clear.bombs || clear.rockets || clear.blasts)) {
    score += clear.lines * 100 * combo;
    if (clear.lines > 1) score += (clear.lines - 1) * 50 * combo;
    score += clear.intersections * 25 * combo;
    score += clear.stars * 50 + clear.golds * 150;
    score += clear.bombs * 80 * combo;
    score += clear.rockets * 70 * combo;
    score += clear.blasts * 240 * combo;
  }
  return score;
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

function fillTray(match: Match, rng: () => number, easy: boolean): void {
  const makeFitting = (): Piece[] => {
    if (easy) {
      return [
        makePiece(rng, "o4"),
        makePiece(rng, "i3"),
        makePiece(rng, "l3"),
      ];
    }
    for (let attempt = 0; attempt < 28; attempt++) {
      const pieces = [makePiece(rng), makePiece(rng), makePiece(rng)];
      if (pieces.some((p) => canPlaceAnywhere(match.board, p.cells))) return pieces;
    }
    const fallback = [makePiece(rng, "o1"), makePiece(rng, "i2"), makePiece(rng, "l3")];
    if (!fallback.some((p) => canPlaceAnywhere(match.board, p.cells))) {
      fallback[0] = makePiece(rng, "o1");
    }
    return fallback;
  };
  const pieces = makeFitting();
  if (!pieces.some((p) => p.special)) {
    const i = Math.floor(rng() * pieces.length);
    const roll = rng();
    const special: SpecialId =
      roll > 0.82 ? "blast" : roll > 0.5 ? "bomb" : roll > 0.22 ? (rng() > 0.5 ? "rocketH" : "rocketV") : "stone";
    pieces[i] = { ...pieces[i]!, special, specialAt: 0 };
  }
  match.tray = pieces;
}

export function refillIfNeeded(match: Match, rng: () => number = defaultRng()): Match {
  if (match.tray.every((p) => p === null)) fillTray(match, rng, false);
  return checkOver(match);
}

function blankMatch(): Match {
  return {
    board: emptyBoard(),
    tray: [null, null, null],
    score: 0,
    combo: 0,
    bestCombo: 0,
    lines: 0,
    moves: 0,
    shield: 0,
    over: false,
    won: false,
    mode: "endless",
    levelId: null,
    goal: null,
    goalProgress: 0,
    stonesCleared: 0,
  };
}

export function newGoalMatch(goal: Goal): Match {
  const match = newEndlessMatch();
  match.mode = "adventure";
  match.goal = goal;
  match.levelId = null;
  updateGoal(match);
  return match;
}

export function newEndlessMatch(opts?: { showcase?: boolean }): Match {
  const match = blankMatch();
  if (opts?.showcase) {
    match.board = openingBoard();
    match.tray = openingTray();
    return checkOver(match);
  }
  fillTray(match, defaultRng(), true);
  return match;
}

export function newAdventureMatch(levelId: number, goal: Goal, stones: number): Match {
  const rng = mulberry32(levelId * 9973 + 17);
  const board = emptyBoard();
  sprinkleStones(board, stones, rng);
  const match = blankMatch();
  match.board = board;
  match.mode = "adventure";
  match.levelId = levelId;
  match.goal = goal;
  fillTray(match, rng, levelId <= 2);
  updateGoal(match);
  return match;
}

export function placePiece(
  match: Match,
  trayIndex: number,
  row: number,
  col: number,
): PlaceResult {
  const piece = match.tray[trayIndex];
  if (!piece || match.over) {
    return { ok: false, match, clear: null, gained: 0, combo: match.combo, coins: 0 };
  }
  if (!canPlace(match.board, piece.cells, row, col)) {
    return { ok: false, match, clear: null, gained: 0, combo: match.combo, coins: 0 };
  }

  const next = cloneMatch(match);
  stampPiece(next.board, piece, row, col);
  const clear = resolveClears(next.board);
  next.tray[trayIndex] = null;
  next.moves += 1;

  if (clear) {
    next.combo = match.combo + 1;
    next.lines += clear.lines;
    next.stonesCleared += clear.cells.filter((c) => c.cell.t === "k").length;
  } else if (next.shield > 0) {
    next.shield -= 1;
  } else {
    next.combo = 0;
  }
  next.bestCombo = Math.max(next.bestCombo, next.combo);

  const comboForScore = Math.max(1, next.combo);
  const gained = scoreFor(piece, clear, comboForScore);
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
    coins: coinsFor(clear, gained),
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
  fillTray(next, defaultRng(), false);
  next.over = false;
  checkOver(next);
  return next;
}

export function applyFreeze(match: Match): Match {
  const next = cloneMatch(match);
  next.shield += 2;
  return next;
}

export function continueMatch(match: Match): Match {
  const next = cloneMatch(match);
  const occupied: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!isEmpty(next.board[r][c])) occupied.push({ r, c });
    }
  }
  occupied.sort(() => Math.random() - 0.5);
  const remove = Math.min(6, occupied.length);
  for (let i = 0; i < remove; i++) {
    const cell = occupied[i]!;
    next.board[cell.r][cell.c] = { t: "e" };
  }
  next.over = false;
  fillTray(next, defaultRng(), false);
  checkOver(next);
  return next;
}

export function comboLabel(combo: number): string {
  if (combo <= 1) return "Clear";
  if (combo === 2) return "Nice";
  if (combo === 3) return "Great";
  if (combo === 4) return "Super";
  if (combo === 5) return "Amazing";
  if (combo === 6) return "Unreal";
  return "Legendary";
}

export function burstLabel(lines: number): string {
  if (lines <= 1) return "Line";
  if (lines === 2) return "Double";
  if (lines === 3) return "Triple";
  if (lines === 4) return "Quad";
  if (lines === 5) return "Penta";
  return "Mega";
}

export function snapPlace(
  board: Cell[][],
  cells: CellPos[],
  row: number,
  col: number,
): { r: number; c: number } | null {
  if (canPlace(board, cells, row, col)) return { r: row, c: col };
  let best: { r: number; c: number; d: number } | null = null;
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
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
