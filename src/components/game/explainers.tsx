/**
 * Small looping demos that teach the game without words: what a special
 * block does the moment it's put down, and which odd-shaped pieces to expect.
 */

import { useEffect, useState } from "react";
import { shapeCells, UNUSUAL_SHAPES, type ColorId, type SpecialId } from "@/lib/game/engine";
import { SpecialFace } from "./tile-art";

const tile = (c: ColorId) => "/art/tiles/" + c + ".webp";

type DemoKind = Exclude<SpecialId, "stone">;

const N = 5;
const GAP = { r: 2, c: 2 };

/** Starting board for each demo: some blocks in the special's path, some not. */
function startCells(kind: DemoKind): Set<string> {
  const on = new Set<string>();
  const add = (r: number, c: number) => on.add(`${r}-${c}`);
  if (kind === "rocketV") for (const [r, c] of [[0, 2], [1, 2], [3, 2], [4, 2], [0, 0], [4, 4], [3, 0], [1, 4]]) add(r!, c!);
  if (kind === "rocketH") for (const [r, c] of [[2, 0], [2, 1], [2, 3], [2, 4], [0, 0], [4, 4], [0, 3], [4, 1]]) add(r!, c!);
  if (kind === "bomb") for (const [r, c] of [[1, 1], [1, 2], [1, 3], [2, 1], [3, 2], [3, 3], [0, 4], [4, 0], [4, 4]]) add(r!, c!);
  if (kind === "blast") for (const [r, c] of [[0, 0], [0, 3], [1, 1], [1, 4], [3, 0], [3, 2], [4, 1], [4, 3], [2, 4]]) add(r!, c!);
  return on;
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

/** Kid-simple words for each step: put it down → zap → gone. */
export const SPECIAL_WORDS: Record<DemoKind, { name: string; does: string; steps: [string, string, string] }> = {
  rocketV: {
    name: "Up-and-down arrow",
    does: "Put it down and ZAP! Every block in its line, top to bottom, disappears.",
    steps: ["Put the arrow block down…", "ZAP! ↕", "The whole up-and-down line is gone!"],
  },
  rocketH: {
    name: "Side-to-side arrow",
    does: "Put it down and ZAP! Every block in its line, left to right, disappears.",
    steps: ["Put the arrow block down…", "ZAP! ↔", "The whole side-to-side line is gone!"],
  },
  bomb: {
    name: "Bomb",
    does: "Put it down and BOOM! The blocks all around it disappear.",
    steps: ["Put the bomb block down…", "BOOM!", "Everything around it is gone!"],
  },
  blast: {
    name: "Golden block",
    does: "Put it down and WOW! Every block on the board disappears.",
    steps: ["Put the golden block down…", "WOW!", "The whole board is clean!"],
  },
};

const COLORS: ColorId[] = ["cyan", "lime", "pink", "amber", "azure", "violet", "orange"];

/** A looping 5×5 demo: put it down → it goes off → those blocks are gone. */
export function SpecialDemo({ kind }: { kind: DemoKind }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t = window.setInterval(() => setStep((s) => (s + 1) % 4), reduce ? 2200 : 1100);
    return () => window.clearInterval(t);
  }, []);
  const start = startCells(kind);
  const effect = effectCells(kind);
  const pieceColor: ColorId = kind === "bomb" ? "violet" : kind === "blast" ? "amber" : "cyan";
  const cells = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const key = `${r}-${c}`;
      const isGap = r === GAP.r && c === GAP.c;
      const filled = start.has(key) || (isGap && step >= 1);
      const gone = step >= 2 && effect.has(key);
      const color = COLORS[(r * 3 + c * 5) % COLORS.length]!;
      let cls = "pj-demo-cell";
      if (isGap && step === 0) cls += " is-target";
      if (filled && !gone) cls += " is-on";
      if (filled && gone) cls += " is-gone";
      if (step === 2 && effect.has(key)) cls += " is-hit";
      if (isGap && step === 1) cls += " is-armed";
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
  const beam = step === 2 && (kind === "rocketV" || kind === "rocketH") ? <span className={`pj-demo-beam is-${kind === "rocketV" ? "col" : "row"}`} /> : null;
  const text = SPECIAL_WORDS[kind].steps[Math.max(0, step - 1)];
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
