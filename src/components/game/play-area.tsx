import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent as PE } from "react";
import { bounds, canPlaceAnywhere, COMBO_WINDOW, placeFromCell, previewClear, SIZE, snapPlace, UNUSUAL_SHAPES, type Cell, type Piece } from "@/lib/game/engine";
import { useGame } from "@/lib/game/store";
import { LESSONS, targetCells } from "@/lib/game/tutorial";
import * as audio from "@/lib/game/audio";
import { BlockFace, PieceGrid, colorOf, colorTextureUrl, overlaysOf, pieceSize } from "./block";
import { BoardFxRunner } from "./board-fx";
import { SideRails } from "./overlays";
import { SPECIAL_WORDS } from "./explainers";
import { TutorialHand } from "./tutorial-coach";
import { VisitorLayer } from "./visitors/visitor-layer";

/** Tray pieces are drawn at this cell size before they're picked up. */
const TRAY_CELL = 23;

type Metrics = { left: number; top: number; cell: number; gap: number; stride: number; right: number; bottom: number };

type Drag = {
  index: number;
  pointerId: number;
  piece: Piece;
  x: number;
  y: number;
  startX: number;
  startY: number;
  lift: number;
  m: Metrics;
  moved: boolean;
  slot: DOMRect;
};

/** What the board shows under a dragged piece. */
type Preview = {
  r: number;
  c: number;
  /** Cells the piece would occupy. */
  shadow: Set<string>;
  /** Cells that would clear, tinted in the piece's color (Block Blast style). */
  tint: Set<string>;
  color: Piece["color"];
};

function measure(grid: HTMLElement): Metrics | null {
  const a = grid.querySelector<HTMLElement>('[data-cell="0-0"]');
  const b = grid.querySelector<HTMLElement>('[data-cell="0-1"]');
  if (!a) return null;
  const ar = a.getBoundingClientRect();
  const gap = b ? b.getBoundingClientRect().left - ar.right : 3;
  const cell = ar.width;
  const stride = cell + gap;
  return { left: ar.left, top: ar.top, cell, gap, stride, right: ar.left + SIZE * stride - gap, bottom: ar.top + SIZE * stride - gap };
}

/** Last effect played, so remounting the board (tab switch) never replays it. */
let lastFxId = 0;

export function PlayArea() {
  const board = useGame((s) => s.match.board);
  const tray = useGame((s) => s.match.tray);
  const seenShapes = useGame((s) => s.profile.seenShapes);
  const tutorial = useGame((s) => s.tutorial);
  const guide = useMemo(() => {
    if (!tutorial || tutorial.phase !== "play") return null;
    const step = LESSONS[tutorial.lesson][tutorial.index];
    return step ? new Set(targetCells(step).map(({ r, c }) => `${r}-${c}`)) : null;
  }, [tutorial]);
  const comboHeat = useGame((s) => (s.match.combo >= 5 ? "hot" : s.match.combo >= 2 ? "warm" : undefined));
  const over = useGame((s) => s.match.over);
  const selected = useGame((s) => s.selected);
  const targeting = useGame((s) => s.targeting);
  const visitorBusy = useGame((s) => s.visitorBusy);
  const visitorHide = useGame((s) => s.visitorHide);
  const fx = useGame((s) => s.fx);

  const gridRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const fxHostRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const ghostInnerRef = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<BoardFxRunner | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const frameReq = useRef<number | null>(null);
  const skipClick = useRef(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Hold the background ambience still while a piece is being dragged.
  useEffect(() => {
    const root = document.documentElement;
    if (dragIndex !== null) root.dataset.dragging = "1";
    else delete root.dataset.dragging;
  }, [dragIndex]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const previewKey = useRef("");
  const previewLines = useRef(0);

  // Latest values for stable callbacks.
  const live = useRef({ board, tray, over, selected, targeting, visitorBusy });
  live.current = { board, tray, over, selected, targeting, visitorBusy };

  // Size the board to the largest square that fits the space left for it.
  // Done in JS so every browser (Safari included) gets the same result.
  useLayoutEffect(() => {
    const row = rowRef.current;
    const frame = frameRef.current;
    if (!row || !frame) return;
    const fit = () => {
      const rails = row.querySelectorAll<HTMLElement>(".pj-rails");
      let railW = 0;
      rails.forEach((r) => (railW += r.offsetWidth));
      const gap = parseFloat(getComputedStyle(row).columnGap || "0") || 0;
      const w = row.clientWidth - railW - gap * rails.length;
      const h = row.clientHeight;
      const max = parseFloat(getComputedStyle(frame).getPropertyValue("--pj-board-max")) || 480;
      const size = Math.max(160, Math.floor(Math.min(w, h, max)));
      frame.style.setProperty("--bs", `${size}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(row);
    return () => ro.disconnect();
  }, []);

  // Board effects layer.
  useEffect(() => {
    if (!fxHostRef.current || !gridRef.current || !frameRef.current) return;
    const runner = new BoardFxRunner(fxHostRef.current, gridRef.current, frameRef.current);
    runnerRef.current = runner;
    const onResize = () => runner.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      runner.destroy();
      runnerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!fx || fx.id === lastFxId) return;
    lastFxId = fx.id;
    runnerRef.current?.play(fx);
  }, [fx]);

  const placeGhost = useCallback((d: Drag) => {
    const el = ghostRef.current;
    if (!el) return;
    const size = pieceSize(d.piece.cells, d.m.cell, d.m.gap);
    el.style.transform = `translate3d(${d.x - size.w / 2}px, ${d.y - d.lift - size.h / 2}px, 0)`;
  }, []);

  /** Work out where the piece would land and what would clear. */
  const updatePreview = useCallback((d: Drag) => {
    const { board: b } = live.current;
    const { m, piece } = d;
    const { rows, cols } = bounds(piece.cells);
    const w = cols * m.stride - m.gap;
    const h = rows * m.stride - m.gap;
    const cx = d.x;
    const cy = d.y - d.lift;
    const over = cx >= m.left - m.cell && cx <= m.right + m.cell && cy >= m.top - m.cell && cy <= m.bottom + m.cell;
    let next: Preview | null = null;
    if (over) {
      const c = Math.round((cx - w / 2 - m.left) / m.stride);
      const r = Math.round((cy - h / 2 - m.top) / m.stride);
      const snap = snapPlace(b, piece.cells, r, c);
      if (snap) {
        const key = `${snap.r},${snap.c}`;
        if (key === previewKey.current) return;
        previewKey.current = key;
        const shadow = new Set(piece.cells.map(([dr, dc]) => `${snap.r + dr}-${snap.c + dc}`));
        const tint = new Set<string>();
        const clear = previewClear(b, piece, snap.r, snap.c);
        if (clear) {
          for (const row of clear.rows) for (let x = 0; x < SIZE; x++) tint.add(`${row}-${x}`);
          for (const col of clear.cols) for (let y = 0; y < SIZE; y++) tint.add(`${y}-${col}`);
          for (const cell of clear.cells) tint.add(`${cell.r}-${cell.c}`);
        }
        next = { r: snap.r, c: snap.c, shadow, tint, color: piece.color };
        // Feedback while aiming: a tick per new spot, a shimmer when it would clear.
        const lines = clear ? clear.rows.length + clear.cols.length : 0;
        if (lines > 0 && previewLines.current === 0) audio.feelWouldClear(lines);
        else audio.feelSnap(snap.r);
        previewLines.current = lines;
      }
    }
    if (!next) {
      previewLines.current = 0;
      if (previewKey.current === "") return;
      previewKey.current = "";
    }
    ghostInnerRef.current?.classList.toggle("is-invalid", over && !next);
    setPreview(next);
  }, []);

  const endDrag = useCallback(
    (d: Drag, placed: boolean) => {
      dragRef.current = null;
      previewKey.current = "";
      setPreview(null);
      useGame.getState().setPointerBusy(false);
      const el = ghostRef.current;
      const inner = ghostInnerRef.current;
      if (placed || !el || !inner || !d.moved) {
        setDragIndex(null);
        return;
      }
      // Glide back to the tray.
      const size = pieceSize(d.piece.cells, d.m.cell, d.m.gap);
      const tx = d.slot.left + d.slot.width / 2 - size.w / 2;
      const ty = d.slot.top + d.slot.height / 2 - size.h / 2;
      el.classList.add("is-returning");
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      inner.style.transform = `scale(${TRAY_CELL / d.m.cell})`;
      window.setTimeout(() => setDragIndex((i) => (i === d.index ? null : i)), 190);
    },
    [],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      d.x = e.clientX;
      d.y = e.clientY;
      if (!d.moved && Math.hypot(d.x - d.startX, d.y - d.startY) > 6) d.moved = true;
      if (frameReq.current !== null) return;
      frameReq.current = requestAnimationFrame(() => {
        frameReq.current = null;
        const latest = dragRef.current;
        if (!latest) return;
        placeGhost(latest);
        updatePreview(latest);
        if (latest.moved) runnerRef.current?.trail(latest.x, latest.y - latest.lift, latest.piece.color);
      });
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (frameReq.current !== null) {
        cancelAnimationFrame(frameReq.current);
        frameReq.current = null;
      }
      d.x = e.clientX;
      d.y = e.clientY;
      previewKey.current = "";
      updatePreview(d);
      const target = previewKey.current ? previewKey.current.split(",").map(Number) : null;
      let placed = false;
      if (d.moved && target && e.type !== "pointercancel") {
        skipClick.current = true;
        // Only swallow the click that follows this drag; touch drags often send none.
        window.setTimeout(() => (skipClick.current = false), 350);
        placed = useGame.getState().tryPlace(d.index, target[0]!, target[1]!);
      } else if (d.moved) {
        audio.feelNope();
      }
      endDrag(d, placed);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      if (frameReq.current !== null) cancelAnimationFrame(frameReq.current);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [endDrag, placeGhost, updatePreview]);

  const onPieceDown = useCallback((index: number, e: PE<HTMLButtonElement>) => {
    const { tray: t, over: o, visitorBusy: busy } = live.current;
    const piece = t[index];
    if (o || busy || !piece || !gridRef.current) return;
    const m = measure(gridRef.current);
    if (!m) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    audio.feelPickup();
    previewLines.current = 0;
    dragRef.current = {
      index,
      pointerId: e.pointerId,
      piece,
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      lift: e.pointerType === "mouse" ? 0 : Math.max(64, m.cell * 1.9),
      m,
      moved: false,
      slot: e.currentTarget.getBoundingClientRect(),
    };
    previewKey.current = "";
    setDragIndex(index);
    useGame.getState().setPointerBusy(true);
    useGame.getState().selectPiece(index);
  }, []);

  // Position the ghost before it paints, then let it grow to board size.
  useLayoutEffect(() => {
    const d = dragRef.current;
    const el = ghostRef.current;
    const inner = ghostInnerRef.current;
    if (dragIndex === null || !d || !el || !inner) return;
    el.classList.remove("is-returning");
    const slot = d.slot;
    const size = pieceSize(d.piece.cells, d.m.cell, d.m.gap);
    el.style.transform = `translate3d(${slot.left + slot.width / 2 - size.w / 2}px, ${slot.top + slot.height / 2 - size.h / 2}px, 0)`;
    inner.style.transform = `scale(${TRAY_CELL / d.m.cell})`;
    const id = requestAnimationFrame(() => {
      if (dragRef.current !== d) return;
      el.classList.add("is-live");
      inner.style.transform = "scale(1)";
      placeGhost(d);
    });
    return () => cancelAnimationFrame(id);
  }, [dragIndex, placeGhost]);

  const onGridClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (!btn) return;
    const [r, c] = btn.dataset.cell!.split("-").map(Number) as [number, number];
    const s = live.current;
    if (s.visitorBusy) return;
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    const store = useGame.getState();
    // Tutorial: tapping a glowing square drops the block right there.
    const tut = store.tutorial;
    if (tut && tut.phase === "play") {
      const step = LESSONS[tut.lesson][tut.index];
      if (step && targetCells(step).some((t) => t.r === r && t.c === c)) {
        const slot = s.tray.findIndex((p) => p);
        if (slot >= 0) store.tryPlace(slot, step.at.r, step.at.c);
      }
      return;
    }
    if (s.targeting) {
      store.usePowerOnCell(r, c);
      return;
    }
    if (s.selected === null) return;
    const piece = s.tray[s.selected];
    if (!piece) return;
    const snap = placeFromCell(s.board, piece.cells, r, c);
    if (snap) store.tryPlace(s.selected, snap.r, snap.c);
    else store.tryPlace(s.selected, r, c);
  }, []);

  const draggingPiece = dragIndex !== null ? dragRef.current?.piece ?? tray[dragIndex] ?? null : null;
  const ghostMetrics = dragRef.current?.m;

  return (
    <div className={`pj-play ${visitorBusy ? "is-visiting" : ""}`}>
      <div ref={rowRef} className="pj-board-row">
        <SideRails side="l" />
        <div ref={frameRef} className="pj-frame" data-combo={comboHeat}>
          <ComboMeter />
          <BoardGrid
            gridRef={gridRef}
            board={board}
            preview={preview}
            targeting={Boolean(targeting)}
            hidden={visitorHide}
            guide={guide}
            onClick={onGridClick}
          />
        </div>
        <SideRails side="r" />
      </div>

      <div className="pj-tray-wrap">
        {tutorial ? null : <TrayTip tray={tray} />}
        <div className={`pj-tray${tutorial?.phase === "play" ? " is-tutorial" : ""}`} data-testid="tray">
          {tray.map((piece, i) => (
            <TraySlot
              key={piece?.id ?? `empty-${i}`}
              index={i}
              piece={piece}
              fits={piece ? canFit(board, piece) : true}
              selected={selected === i}
              lifted={dragIndex === i}
              disabled={!piece || over || visitorBusy}
              onDown={onPieceDown}
              isNew={Boolean(piece && (UNUSUAL_SHAPES as readonly string[]).includes(piece.shape) && !seenShapes.includes(piece.shape))}
            />
          ))}
        </div>
      </div>

      {draggingPiece && ghostMetrics ? (
        <div ref={ghostRef} className="pj-ghost" aria-hidden="true">
          <div ref={ghostInnerRef} className="pj-ghost-piece">
            <PieceGrid piece={draggingPiece} cell={ghostMetrics.cell} gap={ghostMetrics.gap} />
          </div>
        </div>
      ) : null}

      <div ref={fxHostRef} className="pj-boardfx-host" aria-hidden="true" />
      <VisitorLayer grid={gridRef.current} />
      <TutorialHand dragging={dragIndex !== null} />
    </div>
  );
}

/** Streak pill on the frame's top edge: combo level plus moves left to keep it. */
const ComboMeter = memo(function ComboMeter() {
  const combo = useGame((s) => s.match.combo);
  const since = useGame((s) => s.match.sinceClear);
  const tutorial = useGame((s) => s.tutorial !== null);
  if (combo < 1 || tutorial) return null;
  const left = Math.max(0, COMBO_WINDOW - since);
  return (
    <div className={`pj-combo-meter ${left <= 1 ? "is-last" : ""}`} data-testid="combo-meter" aria-label={`Combo ${combo}. ${left} moves left to keep it.`}>
      <span className="pj-combo-meter-label">Combo</span>
      <strong className="tabular-nums">×{combo}</strong>
      <span className="pj-combo-pips" aria-hidden="true">
        {Array.from({ length: COMBO_WINDOW }, (_, i) => (
          <i key={i} className={i < left ? "is-on" : ""} />
        ))}
      </span>
    </div>
  );
});

function canFit(board: Cell[][], piece: Piece): boolean {
  return canPlaceAnywhere(board, piece.cells);
}

/* ------------------------------------------------------------------ board */

/** A string that changes only when what a cell shows changes. */
function faceKey(cell: Cell): string {
  switch (cell.t) {
    case "e":
      return "";
    case "b":
      return `b:${cell.c}:${cell.sp ?? ""}:${(cell.ov ?? []).join(",")}`;
    case "s":
      return `s:${cell.c}:${cell.gold ? 1 : 0}:${cell.sp ?? ""}:${(cell.ov ?? []).join(",")}`;
    case "k":
      return `k:${cell.hp}:${cell.kind ?? ""}`;
    case "crate":
      return `c:${cell.hp}`;
    case "portal":
      return `p:${cell.hue}`;
  }
}

const BoardGrid = memo(function BoardGrid({
  gridRef,
  board,
  preview,
  targeting,
  hidden,
  guide,
  onClick,
}: {
  guide: Set<string> | null;
  gridRef: React.RefObject<HTMLDivElement | null>;
  board: Cell[][];
  preview: Preview | null;
  targeting: boolean;
  hidden: string[];
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
}) {
  const tintUrl = preview ? colorTextureUrl(preview.color) : null;
  const hide = useMemo(() => new Set(hidden), [hidden]);
  return (
    <div ref={gridRef} className="pj-grid" data-testid="board" onClick={onClick}>
      {board.flatMap((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`;
          return (
            <BoardCell
              key={key}
              k={key}
              cell={cell}
              face={faceKey(cell)}
              shadow={preview?.shadow.has(key) ? preview.color : null}
              tint={preview?.tint.has(key) && cell.t !== "e" ? tintUrl : null}
              target={targeting}
              guide={Boolean(guide?.has(key))}
              hidden={hide.has(key)}
            />
          );
        }),
      )}
    </div>
  );
});

type CellProps = {
  k: string;
  cell: Cell;
  face: string;
  shadow: Piece["color"] | null;
  tint: string | null;
  target: boolean;
  guide: boolean;
  hidden: boolean;
};

const BoardCell = memo(
  function BoardCell({ k, cell, shadow, tint, target, guide, hidden }: CellProps) {
    const [r, c] = k.split("-").map(Number) as [number, number];
    const col = colorOf(cell);
    const special = cell.t === "k" ? "stone" : cell.t === "b" || cell.t === "s" ? cell.sp : undefined;
    const cubeColor =
      special === "bomb" ? "violet" : special === "blast" ? "amber" : special === "rocketH" || special === "rocketV" ? "azure" : col;
    return (
      <button
        type="button"
        data-cell={k}
        data-testid={`cell-${k}`}
        className={`pj-well${target ? " is-target" : ""}${tint ? " is-clear" : ""}${guide ? " is-guide" : ""}`}
        aria-label={`Row ${r + 1} column ${c + 1}`}
      >
        {col && !hidden ? (
          <BlockFace
            color={cubeColor ?? "cyan"}
            star={cell.t === "s"}
            gold={cell.t === "s" && cell.gold}
            cracked={cell.t === "k"}
            special={special}
            stoneHp={cell.t === "k" ? cell.hp : undefined}
            overlays={overlaysOf(cell)}
          />
        ) : shadow ? (
          <BlockFace color={shadow} ghost />
        ) : null}
        {tint && !hidden ? <span className="pj-clear-tint" style={{ backgroundImage: `url(${tint})` }} /> : null}
      </button>
    );
  },
  (a, b) => a.face === b.face && a.shadow === b.shadow && a.tint === b.tint && a.target === b.target && a.guide === b.guide && a.hidden === b.hidden && a.k === b.k,
);

/* ------------------------------------------------------------------- tray */

const TIP_TEXT: Record<string, { title: string; body: string }> = {
  ...Object.fromEntries(Object.entries(SPECIAL_WORDS).map(([k, w]) => [k, { title: w.name, body: w.does }])),
  star: { title: "Star block", body: "Drop it anywhere and get bonus points right away. No full row needed!" },
  stone: { title: "Stone block", body: "Stones are tough. Clear blocks right next to a stone two times and it breaks." },
};

/** First time a special block shows up in the tray, say what it does. */
const TrayTip = memo(function TrayTip({ tray }: { tray: Array<Piece | null> }) {
  const seen = useGame((s) => s.profile.seenSpecialTips);
  const dismissTip = useGame((s) => s.dismissTip);
  const kinds = tray.flatMap((p) => (p ? [p.special ?? "", p.starAt !== null ? "star" : ""] : [])).filter(Boolean);
  const sp = kinds.find((k) => TIP_TEXT[k] && !seen.includes(k));
  if (!sp || !TIP_TEXT[sp]) return null;
  const tip = TIP_TEXT[sp]!;
  return (
    <div className="pj-tray-tip" role="status" data-testid="tray-tip">
      <strong>{tip.title}</strong>
      <span>{tip.body}</span>
      <button type="button" className="pj-tray-tip-ok" onClick={() => dismissTip(sp)}>
        Got it
      </button>
    </div>
  );
});

const TraySlot = memo(function TraySlot({
  index,
  piece,
  fits,
  selected,
  lifted,
  disabled,
  onDown,
  isNew,
}: {
  index: number;
  piece: Piece | null;
  fits: boolean;
  selected: boolean;
  lifted: boolean;
  disabled: boolean;
  onDown: (index: number, e: PE<HTMLButtonElement>) => void;
  isNew?: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={`tray-${index}`}
      className={`pj-slot${selected ? " is-selected" : ""}${piece && !fits ? " is-dead" : ""}${lifted ? " is-lifted" : ""}`}
      disabled={disabled}
      onPointerDown={(e) => onDown(index, e)}
      onClick={(e) => {
        if (e.detail !== 0 || !piece) return;
        useGame.getState().selectPiece(index);
      }}
      aria-label={piece ? `Next block ${index + 1}. Drag onto the board, or tap to select then tap a cell.` : `Empty slot ${index + 1}`}
    >
      {piece ? <PieceGrid piece={piece} cell={TRAY_CELL} faded={!fits || lifted} /> : null}
      {isNew && !lifted ? <span className="pj-new-tag">New shape</span> : null}
    </button>
  );
});
