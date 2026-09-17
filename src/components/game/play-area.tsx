import { useCallback, useEffect, useRef, useState, type PointerEvent as PE } from "react";
import { bounds, canPlace, findHint, pieceFits, placeFromCell, previewClear, SIZE, snapPlace, type Piece } from "@/lib/game/engine";
import { useGame } from "@/lib/game/store";
import * as audio from "@/lib/game/audio";
import { BlockFace, PieceGrid, colorOf, overlaysOf, pieceSize } from "./block";
import { SideRails } from "./overlays";

type Drag = {
  index: number;
  pointerId: number;
  x: number;
  y: number;
  lift: number;
};

type Hover = { r: number; c: number; valid: boolean; rows: number[]; cols: number[]; extras: string[] };

function gridMetrics(grid: HTMLElement) {
  const a = grid.querySelector<HTMLElement>('[data-cell="0-0"]');
  const b = grid.querySelector<HTMLElement>('[data-cell="0-1"]');
  if (!a) return null;
  const ar = a.getBoundingClientRect();
  const br = b?.getBoundingClientRect();
  const cell = ar.width;
  const gap = br ? br.left - ar.right : 4;
  return { left: ar.left, top: ar.top, cell, gap, stride: cell + gap, right: ar.left + 8 * cell + 7 * (br ? br.left - ar.right : 4), bottom: ar.top + 8 * cell + 7 * (br ? br.left - ar.right : 4) };
}

export function PlayArea() {
  const match = useGame((s) => s.match);
  const selected = useGame((s) => s.selected);
  const targeting = useGame((s) => s.targeting);
  const flash = useGame((s) => s.flash);
  const shake = useGame((s) => s.shake);
  const comboPop = useGame((s) => s.comboPop);
  const selectPiece = useGame((s) => s.selectPiece);
  const rotateSelected = useGame((s) => s.rotateSelected);
  const tryPlace = useGame((s) => s.tryPlace);
  const usePowerOnCell = useGame((s) => s.usePowerOnCell);

  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const hoverRef = useRef<Hover | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [hint, setHint] = useState<{ r: number; c: number; index: number } | null>(null);
  const moved = useRef(false);
  const skipClick = useRef(false);
  const wasSelected = useRef(false);

  const setHoverBoth = (h: Hover | null) => {
    hoverRef.current = h;
    setHover(h);
  };

  const syncHover = useCallback(
    (x: number, y: number, piece: Piece, lift: number) => {
      const grid = gridRef.current;
      if (!grid) return;
      const m = gridMetrics(grid);
      if (!m) return;
      const { rows, cols } = bounds(piece.cells);
      const w = cols * m.cell + (cols - 1) * m.gap;
      const h = rows * m.cell + (rows - 1) * m.gap;
      const cx = x;
      const cy = y - lift;
      const left = cx - w / 2;
      const top = cy - h / 2;
      const over =
        cx >= m.left - m.cell &&
        cx <= m.right + m.cell &&
        cy >= m.top - m.cell &&
        cy <= m.bottom + m.cell;
      if (!over) {
        setHoverBoth(null);
        return;
      }
      const c = Math.round((left - m.left) / m.stride);
      const r = Math.round((top - m.top) / m.stride);
      const snap = snapPlace(match.board, piece.cells, r, c);
      if (snap) {
        const preview = previewClear(match.board, piece, snap.r, snap.c);
        setHoverBoth({
          r: snap.r,
          c: snap.c,
          valid: true,
          rows: preview?.rows ?? [],
          cols: preview?.cols ?? [],
          extras: (preview?.cells ?? []).map((x) => `${x.r}-${x.c}`),
        });
        return;
      }
      const valid = canPlace(match.board, piece.cells, r, c);
      setHoverBoth({ r, c, valid, rows: [], cols: [], extras: [] });
    },
    [match.board],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) moved.current = true;
      const next = { ...d, x: e.clientX, y: e.clientY };
      dragRef.current = next;
      setDrag(next);
      const piece = match.tray[d.index];
      if (piece) syncHover(next.x, next.y, piece, next.lift);
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const piece = match.tray[d.index];
      const h = hoverRef.current;
      dragRef.current = null;
      setDrag(null);
      if (piece && h?.valid && moved.current) {
        skipClick.current = true;
        tryPlace(d.index, h.r, h.c);
      } else if (!moved.current) {
        if (wasSelected.current) rotateSelected();
      } else if (moved.current && piece && h) {
        const snap = placeFromCell(match.board, piece.cells, h.r, h.c);
        if (snap) {
          skipClick.current = true;
          tryPlace(d.index, snap.r, snap.c);
        } else audio.sfxBad();
      } else if (moved.current && piece) {
        audio.sfxBad();
      }
      setHoverBoth(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [match.board, match.tray, rotateSelected, syncHover, tryPlace]);

  const onPieceDown = (index: number, e: PE<HTMLButtonElement>) => {
    if (match.over || !match.tray[index]) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    moved.current = false;
    wasSelected.current = selected === index;
    audio.sfxClick();
    const lift = e.pointerType === "mouse" ? 0 : 72;
    const d: Drag = { index, pointerId: e.pointerId, x: e.clientX, y: e.clientY, lift };
    dragRef.current = d;
    setDrag(d);
    selectPiece(index);
  };

  const onCellClick = (r: number, c: number) => {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    if (targeting) {
      usePowerOnCell(r, c);
      return;
    }
    if (selected === null) return;
    const piece = match.tray[selected];
    if (!piece) return;
    const snap = placeFromCell(match.board, piece.cells, r, c);
    if (snap) tryPlace(selected, snap.r, snap.c);
    else tryPlace(selected, r, c);
  };

  const showHint = () => {
    const index = selected !== null && match.tray[selected] ? selected : match.tray.findIndex((p) => p && pieceFits(match, p));
    const piece = index >= 0 ? match.tray[index] : null;
    if (!piece) {
      audio.sfxBad();
      return;
    }
    const pos = findHint(match.board, piece.cells);
    if (!pos) {
      audio.sfxBad();
      return;
    }
    audio.sfxClick();
    selectPiece(index);
    setHint({ ...pos, index });
    window.setTimeout(() => setHint(null), 1400);
  };

  const flashAt = (r: number, c: number) => flash.find((f) => f.r === r && f.c === c);

  const draggingPiece = drag ? match.tray[drag.index] : null;
  const ghostMetrics = (() => {
    if (!drag || !draggingPiece || !gridRef.current) return { cell: 28, gap: 2 };
    return gridMetrics(gridRef.current) ?? { cell: 28, gap: 2 };
  })();

  const hintCells = new Set<string>();
  if (hover?.valid && draggingPiece) {
    for (const [dr, dc] of draggingPiece.cells) hintCells.add(`${hover.r + dr}-${hover.c + dc}`);
  }
  if (hint) {
    const piece = match.tray[hint.index];
    if (piece) for (const [dr, dc] of piece.cells) hintCells.add(`${hint.r + dr}-${hint.c + dc}`);
  }

  const clearSet = new Set<string>();
  if (hover?.valid) {
    for (const r of hover.rows) for (let c = 0; c < SIZE; c++) clearSet.add(`${r}-${c}`);
    for (const c of hover.cols) for (let r = 0; r < SIZE; r++) clearSet.add(`${r}-${c}`);
    for (const key of hover.extras) clearSet.add(key);
  }

  return (
    <div className="pj-play">
      <div className="pj-board-row">
        <SideRails side="l" />
        <div className={`pj-frame ${shake ? "pj-shake" : ""}`}>
          <span className="pj-rivet tl" />
          <span className="pj-rivet tr" />
          <span className="pj-rivet bl" />
          <span className="pj-rivet br" />
          <div ref={gridRef} className="pj-grid" data-testid="board">
            {match.board.flatMap((row, r) =>
              row.map((cell, c) => {
                const key = `${r}-${c}`;
                const col = colorOf(cell);
                const ghost = flashAt(r, c);
                const hinted = hintCells.has(key);
                const willClear = clearSet.has(key);
                const special = cell.t === "k" ? "stone" : cell.t === "b" || cell.t === "s" ? cell.sp : undefined;
                const cubeColor = special === "bomb" ? "violet" : special === "blast" ? "amber" : special === "rocketH" || special === "rocketV" ? "azure" : col;
                return (
                  <button
                    key={key}
                    type="button"
                    data-cell={key}
                    data-testid={`cell-${r}-${c}`}
                    className={`pj-well ${willClear ? "is-clear" : ""} ${hinted ? "is-hint" : ""} ${targeting ? "is-target" : ""} ${ghost ? "is-boom" : ""}`}
                    onClick={() => onCellClick(r, c)}
                    aria-label={`Row ${r + 1} column ${c + 1}`}
                  >
                    {col ? (
                      <BlockFace
                        color={cubeColor ?? "cyan"}
                        star={cell.t === "s"}
                        gold={cell.t === "s" && cell.gold}
                        cracked={cell.t === "k"}
                        special={special}
                        stoneHp={cell.t === "k" ? cell.hp : undefined}
                        overlays={overlaysOf(cell)}
                      />
                    ) : hinted && draggingPiece ? (
                      <BlockFace color={draggingPiece.color} ghost />
                    ) : ghost ? (
                      <BlockFace
                        color={colorOf(ghost.cell) ?? "stone"}
                        star={ghost.cell.t === "s"}
                        gold={ghost.cell.t === "s" && ghost.cell.gold}
                        flash
                      />
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>
          {comboPop ? (
            <div className="pj-float">
              <div className="pj-combo">
                {comboPop.label}
                {comboPop.combo > 1 ? ` x${comboPop.combo}` : ""}
                <div className="pj-combo-pts">+{comboPop.score}</div>
              </div>
              <div className="pj-sparks" aria-hidden="true">
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} className="pj-spark" style={{ ["--a" as string]: `${i * 30}deg` }} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <SideRails side="r" />
      </div>

      <div className="pj-tray-wrap">
        <div className="pj-tray-bar">
          <span className="pj-tray-label">Next blocks</span>
          <button type="button" className="pj-hint-btn" onClick={showHint} data-testid="hint">
            Hint
          </button>
          <button type="button" className="pj-hint-btn" onClick={() => rotateSelected()} data-testid="rotate">
            Rotate
          </button>
        </div>
        <div className="pj-tray" data-testid="tray">
        {match.tray.map((piece, i) => {
          const fits = piece ? pieceFits(match, piece) : true;
          return (
            <button
              key={piece?.id ?? `empty-${i}`}
              type="button"
              data-testid={`tray-${i}`}
              className={`pj-slot ${selected === i ? "is-selected" : ""} ${piece && !fits ? "is-dead" : ""} ${drag?.index === i ? "is-lifted" : ""}`}
              disabled={!piece || match.over}
              onPointerDown={(e) => onPieceDown(i, e)}
              onClick={(e) => {
                if (e.detail !== 0) return;
                if (!piece) return;
                if (selected === i) rotateSelected();
                else selectPiece(i);
              }}
              aria-label={piece ? `Next block ${i + 1}. Tap to rotate, drag onto the board.` : `Empty slot ${i + 1}`}
            >
              {piece ? (
                <PieceGrid piece={piece} cell={20} faded={!fits || drag?.index === i} />
              ) : null}
            </button>
          );
        })}
        </div>
      </div>

      {drag && draggingPiece
        ? (() => {
            const size = pieceSize(draggingPiece.cells, ghostMetrics.cell, ghostMetrics.gap);
            return (
              <div
                className="pj-ghost"
                style={{
                  left: drag.x - size.w / 2,
                  top: drag.y - drag.lift - size.h / 2,
                  width: size.w,
                  height: size.h,
                }}
              >
                <PieceGrid
                  piece={draggingPiece}
                  cell={ghostMetrics.cell}
                  gap={ghostMetrics.gap}
                  faded={hover ? !hover.valid : false}
                />
              </div>
            );
          })()
        : null}
    </div>
  );
}
