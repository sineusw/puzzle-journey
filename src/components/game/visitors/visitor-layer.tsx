import { memo, useEffect, useRef } from "react";
import { VISITOR_META } from "@/lib/game/visitors";
import { useGame } from "@/lib/game/store";
import { playVisitor } from "./choreography";

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hosts an Island Visitor scene over the board. The choreography itself is
 * imperative (see choreography.ts); this component starts it when a visit
 * begins and tears it down if the player leaves mid-visit.
 */
export const VisitorLayer = memo(function VisitorLayer({ grid }: { grid: HTMLElement | null }) {
  const event = useGame((s) => s.visitorEvent);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!event || !host.current || !grid) return;
    const s = useGame.getState();
    let finished = false;
    const run = playVisitor(host.current, grid, event, {
      commit: () => useGame.getState().commitVisitor(),
      hide: (cells) => useGame.getState().setVisitorHide(cells),
      shake: s.profile.settings.shake,
      reduce: reducedMotion(),
    });
    run.done.then(() => {
      finished = true;
      if (useGame.getState().visitorEvent?.id === event.id) useGame.getState().endVisitor();
    });
    return () => {
      run.stop();
      // Leaving mid-visit (new run, another tab): release the board.
      if (!finished && useGame.getState().visitorEvent?.id === event.id) useGame.getState().endVisitor();
    };
    // Restart only when a new visit begins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, grid]);

  return (
    <div ref={host} className="pj-vis-stage" data-testid="visitor-layer" aria-live="polite">
      {event ? <span className="sr-only">{VISITOR_META[event.visitor].name} is visiting the board.</span> : null}
    </div>
  );
});
