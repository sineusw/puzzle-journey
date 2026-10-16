/**
 * Small looping demos that teach the game without words: what a special
 * block does when its line clears, and which odd-shaped pieces to expect.
 */

import { useEffect, useState } from "react";
import { shapeCells, UNUSUAL_SHAPES, type ColorId, type SpecialId } from "@/lib/game/engine";
import { SpecialFace } from "./tile-art";

const tile = (c: ColorId) => "/art/tiles/" + c + ".webp";

type DemoKind = Exclude<SpecialId, "stone">;

const N = 5;
const GAP = { r: 2, c: 2 };

/** Starting board for each demo: the gap at the centre completes a line. */
function startCells(kind: DemoKind): Set<string> {
  const on = new Set<string>();
  const add = (r: number, c: number) => on.add(`${r}-${c}`);
  if (kind === "rocketH") {
    // Column 2 is one short; the arrow then wipes row 2.
    for (let r = 0; r < N; r++) if (r !== GAP.r) add(r, GAP.c);
    for (const c of [0, 1, 3, 4]) add(GAP.r, c);
    add(0, 0); add(4, 4); add(3, 0);
  } else {
    // Row 2 is one short.
    for (let c = 0; c < N; c++) if (c !== GAP.c) add(GAP.r, c);
    if (kind === "rocketV") for (const r of [0, 1, 3, 4]) add(r, GAP.c);
    if (kind === "bomb") for (const [r, c] of [[1, 1], [1, 2], [1, 3], [3, 1], [3, 2], [3, 3]]) add(r!, c!);
    if (kind === "blast") for (const [r, c] of [[0, 0], [0, 3], [1, 1], [1, 4], [3, 0], [3, 2], [4, 1], [4, 3]]) add(r!, c!);
    add(0, 4); add(4, 0);
  }
  return on;
}

function lineCells(kind: DemoKind): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i < N; i++) s.add(kind === "rocketH" ? `${i}-${GAP.c}` : `${GAP.r}-${i}`);
  return s;
}

function effectCells(kind: DemoKind): Set<string> {
  const s = new Set<string>();
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const hit =
        kind === "rocketV" ? c === GAP.c : kind === "rocketH" ? r === GAP.r : kind === "bomb" ? Math.abs(r - GAP.r) <= 1 && Math.abs(c - GAP.c) <= 1 : true;
      if (hit) s.add(`${r}-${c}`);
    }
  }
  return s;
}

const STEP_TEXT: Record<DemoKind, [string, string, string]> = {
  rocketV: ["Drop the arrow block into a line", "The row fills and clears…", "…then the ↕ arrow wipes its whole column!"],
  rocketH: ["Drop the arrow block into a line", "The column fills and clears…", "…then the ↔ arrow wipes its whole row!"],
  bomb: ["Drop the bomb block into a line", "The line fills and clears…", "…then the bomb clears all 8 blocks around it!"],
  blast: ["Drop the golden block into a line", "The line fills and clears…", "…then it clears the whole board!"],
};

const COLORS: ColorId[] = ["cyan", "lime", "pink", "amber", "azure", "violet", "orange"];

/** A looping 5×5 demo: place → line clears → the special goes off. */
export function SpecialDemo({ kind }: { kind: DemoKind }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t = window.setInterval(() => setStep((s) => (s + 1) % 4), reduce ? 2200 : 1300);
    return () => window.clearInterval(t);
  }, []);
  const start = startCells(kind);
  const line = lineCells(kind);
  const effect = effectCells(kind);
  const pieceColor: ColorId = kind === "bomb" ? "violet" : kind === "blast" ? "amber" : "cyan";
  const cells = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const key = `${r}-${c}`;
      const isGap = r === GAP.r && c === GAP.c;
      const filled = start.has(key) || (isGap && step >= 1);
      const gone = (step >= 2 && line.has(key)) || (step >= 3 && effect.has(key));
      const color = COLORS[(r * 3 + c * 5) % COLORS.length]!;
      let cls = "pj-demo-cell";
      if (isGap && step === 0) cls += " is-target";
      if (filled && !gone) cls += " is-on";
      if (filled && gone) cls += " is-gone";
      if (step === 3 && effect.has(key) && !line.has(key)) cls += " is-hit";
      cells.push(
        <span key={key} className={cls}>
          {filled ? (
            <span className="pj-demo-tile" style={{ backgroundImage: `url(${tile(isGap ? pieceColor : color)})` }}>
              {isGap ? <SpecialFace kind={kind} /> : null}
            </span>
          ) : null}
        </span>,
      );
    }
  }
  const beam = step === 3 && (kind === "rocketV" || kind === "rocketH") ? <span className={`pj-demo-beam is-${kind === "rocketV" ? "col" : "row"}`} /> : null;
  const text = step === 0 ? STEP_TEXT[kind][0] : STEP_TEXT[kind][Math.min(2, step - 1)];
  return (
    <figure className="pj-demo" data-testid={`demo-${kind}`}>
      <div className="pj-demo-grid" aria-hidden="true">
        {cells}
        {beam}
      </div>
      <figcaption className="pj-demo-cap">{text}</figcaption>
    </figure>
  );
}

/** One piece drawn small, with its gaps visible. */
export function MiniShape({ id, color }: { id: string; color: ColorId }) {
  const cells = shapeCells(id);
  const rows = Math.max(...cells.map(([r]) => r)) + 1;
  const cols = Math.max(...cells.map(([, c]) => c)) + 1;
  const on = new Set(cells.map(([r, c]) => `${r}-${c}`));
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push(
        <span key={`${r}-${c}`} className={on.has(`${r}-${c}`) ? "pj-shape-on" : "pj-shape-gap"} style={on.has(`${r}-${c}`) ? { backgroundImage: `url(${tile(color)})` } : undefined} />,
      );
    }
  }
  return (
    <span className="pj-shape-mini" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, aspectRatio: `${cols} / ${rows}` }}>
      {out}
    </span>
  );
}

/** "Not your usual blocks": the gap and odd shapes, shown up front. */
export function ShapeGallery({ compact = false }: { compact?: boolean }) {
  const shown = compact ? UNUSUAL_SHAPES.slice(0, 6) : UNUSUAL_SHAPES;
  return (
    <div className="pj-shapes" data-testid="shape-gallery">
      {shown.map((id, i) => (
        <span key={id} className="pj-shape-item" style={{ animationDelay: `${i * 70}ms` }}>
          <MiniShape id={id} color={COLORS[i % COLORS.length]!} />
        </span>
      ))}
    </div>
  );
}
