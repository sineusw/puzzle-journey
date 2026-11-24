import { useEffect, useRef } from "react";
import { Fireworks } from "./fireworks";
import { useGame } from "@/lib/game/store";
import { LESSONS, targetCells, type LessonId } from "@/lib/game/tutorial";

const LESSON_TITLE: Record<LessonId, string> = {
  basics: "How to play",
  arrows: "Arrow blocks",
  bombs: "Bomb blocks",
  blast: "Golden block",
};

/** The coach card above the board: step dots, one simple instruction, Skip. */
export function TutorialCoach() {
  const tutorial = useGame((s) => s.tutorial);
  const skip = useGame((s) => s.skipTutorial);
  if (!tutorial) return null;
  const steps = LESSONS[tutorial.lesson];
  const step = steps[tutorial.index]!;
  const praising = tutorial.phase === "praise" || tutorial.phase === "done";
  return (
    <div
      className={`pj-coach${praising ? " is-praise" : ""}`}
      data-testid="tutorial"
      role="status"
      aria-live="polite"
    >
      <div className="pj-coach-top">
        <span className="pj-coach-tag">Tutorial</span>
        <span className="pj-coach-step">
          Step {tutorial.index + 1} of {steps.length}
        </span>
        <span className="pj-coach-dots" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={
                i < tutorial.index || (i === tutorial.index && praising)
                  ? "is-done"
                  : i === tutorial.index
                    ? "is-now"
                    : ""
              }
            />
          ))}
        </span>
        <button type="button" className="pj-coach-skip" data-testid="tutorial-skip" onClick={skip}>
          Skip
        </button>
      </div>
      <p className="pj-coach-say" key={`${tutorial.index}-${tutorial.phase}`}>
        {praising ? step.praise : step.say}
      </p>
      {!praising && step.hint ? <p className="pj-coach-hint">{step.hint}</p> : null}
    </div>
  );
}

/** A big, obvious Skip button where the power-ups usually sit. */
export function TutorialSkipBar() {
  const skip = useGame((s) => s.skipTutorial);
  const phase = useGame((s) => s.tutorial?.phase);
  if (!phase || phase === "intro" || phase === "done") return null;
  return (
    <div className="pj-tut-skipbar">
      <button
        type="button"
        className="pj-tut-skip-big"
        data-testid="tutorial-skip-big"
        onClick={skip}
      >
        Skip tutorial ›
      </button>
    </div>
  );
}

/** Welcome (Start / Skip) and "Tutorial complete" screens. */
export function TutorialScreens() {
  const tutorial = useGame((s) => s.tutorial);
  const begin = useGame((s) => s.beginTutorial);
  const skip = useGame((s) => s.skipTutorial);
  const finish = useGame((s) => s.finishTutorial);
  if (!tutorial || (tutorial.phase !== "intro" && tutorial.phase !== "done")) return null;
  const steps = LESSONS[tutorial.lesson].length;
  if (tutorial.phase === "intro") {
    return (
      <div
        className="pj-modal center pj-tut-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tut-title"
      >
        <div className="pj-sheet pj-tut-card text-center" data-testid="tutorial-welcome">
          <div className="pj-tut-ribbon">Tutorial</div>
          <h2 id="tut-title" className="pj-tut-title">
            Welcome to Block Journey!
          </h2>
          <p className="pj-tut-lead">
            Learn to play in <b>{steps} quick moves</b>. It takes about 30 seconds.
          </p>
          <div className="pj-tut-demo" aria-hidden="true">
            <span className="pj-tut-demo-board">
              {Array.from({ length: 16 }, (_, i) => (
                <span key={i} className={[5, 6, 9, 10].includes(i) ? "is-goal" : ""} />
              ))}
            </span>
            <span className="pj-tut-demo-piece">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span className="pj-tut-demo-finger" />
          </div>
          <button
            type="button"
            className="pj-btn pj-btn-primary pj-tut-btn mt-4 w-full"
            data-testid="tutorial-start"
            onClick={begin}
          >
            ▶ Start tutorial
          </button>
          <button
            type="button"
            className="pj-btn pj-btn-ghost pj-tut-btn mt-2 w-full"
            data-testid="tutorial-skip-intro"
            onClick={skip}
          >
            Skip tutorial
          </button>
          <p className="pj-tut-fine">You can replay it any time from Settings → How to play.</p>
        </div>
      </div>
    );
  }
  return (
    <div
      className="pj-modal center pj-tut-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tut-done"
    >
      <Fireworks />
      <div className="pj-tut-burst" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <span
            key={i}
            style={{ ["--a" as string]: `${i * 15}deg`, ["--d" as string]: `${(i % 4) * 60}ms` }}
          />
        ))}
      </div>
      <div className="pj-sheet pj-tut-card is-done text-center" data-testid="tutorial-done">
        <div className="pj-tut-ribbon is-done">{LESSON_TITLE[tutorial.lesson]}</div>
        <div className="pj-tut-trophy" aria-hidden="true">
          ★
        </div>
        <h2 id="tut-done" className="pj-tut-title">
          {tutorial.lesson === "basics" ? "Tutorial complete!" : "You got it!"}
        </h2>
        <p className="pj-tut-lead">
          {tutorial.lesson === "basics"
            ? "You’re ready to play. Have fun on the island!"
            : "Now you know how it works. Back to your game!"}
        </p>
        <button
          type="button"
          className="pj-btn pj-btn-primary pj-tut-btn mt-4 w-full"
          data-testid="tutorial-finish"
          onClick={finish}
        >
          {tutorial.lesson === "basics" ? "Start playing" : "Back to my game"}
        </button>
      </div>
    </div>
  );
}

/**
 * A ghost copy of the piece glides from the tray to the glowing squares,
 * with a finger, over and over, until the player drags it themselves.
 */
export function TutorialHand({ dragging }: { dragging: boolean }) {
  const tutorial = useGame((s) => s.tutorial);
  const ref = useRef<HTMLDivElement | null>(null);
  const active = tutorial?.phase === "play" && !dragging;
  useEffect(() => {
    const el = ref.current;
    if (!el || !active || !tutorial) return;
    const step = LESSONS[tutorial.lesson][tutorial.index];
    if (!step) return;
    let anim: Animation | null = null;
    const run = () => {
      const slot = document.querySelector<HTMLElement>(
        '[data-testid="tray-1"] .pj-mini, [data-testid="tray-1"]',
      );
      const cells = targetCells(step)
        .map(({ r, c }) =>
          document.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`)?.getBoundingClientRect(),
        )
        .filter((b): b is DOMRect => Boolean(b));
      if (!slot || !cells.length) return;
      const s = slot.getBoundingClientRect();
      const x0 = Math.min(...cells.map((b) => b.left));
      const x1 = Math.max(...cells.map((b) => b.right));
      const y0 = Math.min(...cells.map((b) => b.top));
      const y1 = Math.max(...cells.map((b) => b.bottom));
      const ghost = el.querySelector<HTMLElement>(".pj-hand-ghost")!;
      ghost.innerHTML = "";
      const src = document.querySelector<HTMLElement>('[data-testid="tray-1"] .pj-mini');
      if (src) ghost.appendChild(src.cloneNode(true));
      const fromX = s.left + s.width / 2;
      const fromY = s.top + s.height / 2;
      const toX = (x0 + x1) / 2;
      const toY = (y0 + y1) / 2;
      const scale = Math.max(1, (x1 - x0) / Math.max(1, s.width * 0.6));
      anim?.cancel();
      anim = el.animate(
        [
          { transform: `translate(${fromX}px, ${fromY}px) scale(1)`, opacity: 0 },
          { transform: `translate(${fromX}px, ${fromY}px) scale(1)`, opacity: 1, offset: 0.12 },
          {
            transform: `translate(${fromX}px, ${fromY - 8}px) scale(1.05)`,
            opacity: 1,
            offset: 0.22,
          },
          {
            transform: `translate(${toX}px, ${toY}px) scale(${Math.min(scale, 1.6)})`,
            opacity: 1,
            offset: 0.68,
            easing: "ease-in-out",
          },
          {
            transform: `translate(${toX}px, ${toY}px) scale(${Math.min(scale, 1.6)})`,
            opacity: 1,
            offset: 0.85,
          },
          { transform: `translate(${toX}px, ${toY}px) scale(${Math.min(scale, 1.6)})`, opacity: 0 },
        ],
        { duration: 2400, iterations: Infinity, easing: "ease-out" },
      );
    };
    const t = window.setTimeout(run, 450);
    window.addEventListener("resize", run);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", run);
      anim?.cancel();
    };
  }, [active, tutorial]);
  if (!active) return null;
  return (
    <div ref={ref} className="pj-hand" aria-hidden="true" data-testid="tutorial-hand">
      <div className="pj-hand-ghost" />
      <div className="pj-hand-finger">
        <svg viewBox="0 0 40 48" width="40" height="48">
          <path
            d="M14 4c2.2 0 4 1.8 4 4v14l1-.2c1.2-2 4.3-2 5.4.3 1.6-1.6 4.6-1.1 5.4 1 2-1 4.8.4 4.8 2.9V36c0 6.6-5.4 12-12 12h-2.4c-4 0-7.6-2.1-9.7-5.5L3.6 34c-1.3-2.1-.2-4.9 2.1-5.6 1.5-.4 3 .1 4.1 1.2l.2.2V8c0-2.2 1.8-4 4-4Z"
            fill="#fff"
            stroke="#1b2b44"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
