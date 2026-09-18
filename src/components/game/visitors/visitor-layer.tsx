import { useEffect, useRef, useState, type CSSProperties } from "react";
import { colorOf } from "../block";
import { BlockFace } from "../block";
import * as audio from "@/lib/game/audio";
import { affectedCells, VISITOR_META, type VisitorEvent, type VisitorPhase } from "@/lib/game/visitors";
import { useGame } from "@/lib/game/store";
import { VisitorSprite } from "./characters";

const PHASES: Array<{ phase: VisitorPhase; ms: number; reduced: number }> = [
  { phase: "warn", ms: 1100, reduced: 400 },
  { phase: "enter", ms: 800, reduced: 280 },
  { phase: "act", ms: 1100, reduced: 360 },
  { phase: "commit", ms: 520, reduced: 180 },
  { phase: "react", ms: 720, reduced: 260 },
  { phase: "exit", ms: 640, reduced: 220 },
];

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function VisitorLayer({ grid }: { grid: HTMLElement | null }) {
  const event = useGame((s) => s.visitorEvent);
  const commitVisitor = useGame((s) => s.commitVisitor);
  const endVisitor = useGame((s) => s.endVisitor);
  const [phase, setPhase] = useState<VisitorPhase>("warn");
  const timers = useRef<number[]>([]);
  const committed = useRef(false);

  useEffect(() => {
    committed.current = false;
    setPhase("warn");
    if (!event) return;
    const reduce = reducedMotion();
    let t = 0;
    const ids: number[] = [];
    for (const step of PHASES) {
      const wait = reduce ? step.reduced : step.ms;
      const id = window.setTimeout(() => {
        setPhase(step.phase);
        if (step.phase === "warn") audio.sfxVisitorWarn();
        if (step.phase === "enter") audio.sfxVisitor(event.visitor);
        if (step.phase === "act") audio.sfxVisitorAct(event.visitor);
        if (step.phase === "commit" && !committed.current) {
          committed.current = true;
          commitVisitor();
        }
        if (step.phase === "exit") {
          window.setTimeout(() => endVisitor(), reduce ? 220 : 640);
        }
      }, t);
      ids.push(id);
      t += wait;
    }
    timers.current = ids;
    return () => {
      ids.forEach((id) => window.clearTimeout(id));
    };
  }, [event?.id, commitVisitor, endVisitor, event]);

  if (!event) return null;
  const meta = VISITOR_META[event.visitor];
  const cells = affectedCells(event.action);
  const pose = phase === "act" || phase === "commit" ? "act" : phase === "react" ? "react" : "idle";
  const fly = event.action.kind === "move" && (phase === "act" || phase === "commit") ? flyStyle(grid, event) : null;

  return (
    <div className={`pj-vis-layer is-${phase} is-${meta.side}`} data-testid="visitor-layer" aria-live="polite">
      {phase === "warn" ? (
        <div className="pj-vis-warn">
          <VisitorSprite id={event.visitor} />
          <div>
            <strong>Someone’s coming!</strong>
            <span>{meta.cue}</span>
          </div>
        </div>
      ) : null}

      <div className={`pj-vis-actor is-${meta.side}`}>
        <VisitorSprite id={event.visitor} pose={pose} />
        {event.showName || phase === "enter" || phase === "act" ? (
          <div className="pj-vis-name">
            {meta.name} <em>{meta.title}</em>
          </div>
        ) : null}
      </div>

      {cells.map(([r, c]) => (
        <Highlight key={`${r}-${c}`} grid={grid} r={r} c={c} active={phase !== "warn" && phase !== "exit"} />
      ))}

      {fly && event.action.kind === "move" ? (
        <div className="pj-vis-fly" style={fly}>
          <BlockFace
            color={colorOf(event.action.cell) ?? "cyan"}
            star={event.action.cell.t === "s"}
            gold={event.action.cell.t === "s" && event.action.cell.gold}
          />
        </div>
      ) : null}

      {phase === "act" || phase === "commit" || phase === "react" ? <SparkleBurst visitor={event.visitor} /> : null}
    </div>
  );
}

function Highlight({ grid, r, c, active }: { grid: HTMLElement | null; r: number; c: number; active: boolean }) {
  const el = grid?.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`);
  if (!el || !active) return null;
  const box = el.getBoundingClientRect();
  return (
    <span
      className="pj-vis-hi"
      style={{
        position: "fixed",
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      }}
    />
  );
}

function flyStyle(grid: HTMLElement | null, event: VisitorEvent): CSSProperties | null {
  if (event.action.kind !== "move" || !grid) return null;
  const [fr, fc] = event.action.from;
  const [tr, tc] = event.action.to;
  const a = grid.querySelector<HTMLElement>(`[data-cell="${fr}-${fc}"]`);
  const b = grid.querySelector<HTMLElement>(`[data-cell="${tr}-${tc}"]`);
  if (!a || !b) return null;
  const host = grid.getBoundingClientRect();
  const from = a.getBoundingClientRect();
  const to = b.getBoundingClientRect();
  return {
    position: "fixed",
    left: from.left,
    top: from.top,
    width: from.width,
    height: from.height,
    ["--dx" as string]: `${to.left - from.left}px`,
    ["--dy" as string]: `${to.top - from.top}px`,
  };
}

function SparkleBurst({ visitor }: { visitor: VisitorEvent["visitor"] }) {
  return (
    <div className={`pj-vis-fx is-${visitor}`} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} style={{ ["--i" as string]: i }} />
      ))}
    </div>
  );
}
