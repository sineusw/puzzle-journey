import { useGame } from "@/lib/game/store";
import { LESSONS } from "@/lib/game/tutorial";

/** The tutorial's coach card: one simple instruction, progress, and Skip. */
export function TutorialCoach() {
  const tutorial = useGame((s) => s.tutorial);
  const skip = useGame((s) => s.skipTutorial);
  if (!tutorial) return null;
  const steps = LESSONS[tutorial.lesson];
  const step = steps[tutorial.index]!;
  const praising = tutorial.phase === "praise";
  return (
    <div className={`pj-coach${praising ? " is-praise" : ""}`} data-testid="tutorial" role="status" aria-live="polite">
      <div className="pj-coach-top">
        <span className="pj-coach-dots" aria-label={`Step ${tutorial.index + 1} of ${steps.length}`}>
          {steps.map((_, i) => (
            <span key={i} className={i < tutorial.index || (i === tutorial.index && praising) ? "is-done" : i === tutorial.index ? "is-now" : ""} />
          ))}
        </span>
        <button type="button" className="pj-coach-skip" data-testid="tutorial-skip" onClick={skip}>
          Skip tutorial
        </button>
      </div>
      <p className="pj-coach-say" key={`${tutorial.index}-${tutorial.phase}`}>
        {praising ? step.praise : step.say}
      </p>
      {!praising && step.hint ? <p className="pj-coach-hint">{step.hint}</p> : null}
    </div>
  );
}
