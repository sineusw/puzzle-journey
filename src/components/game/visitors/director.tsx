import { useEffect } from "react";
import { useGame } from "@/lib/game/store";
import { VISITOR_IDS, type VisitorId } from "@/lib/game/visitors";
import { CHARACTER_ART } from "./characters";

export function VisitorDirector() {
  const started = useGame((s) => s.started);
  const tab = useGame((s) => s.tab);
  const panel = useGame((s) => s.panel);
  const match = useGame((s) => s.match);
  const visitorBusy = useGame((s) => s.visitorBusy);
  const pointerBusy = useGame((s) => s.pointerBusy);
  const targeting = useGame((s) => s.targeting);
  const maybeVisitor = useGame((s) => s.maybeVisitor);

  useEffect(() => {
    for (const src of Object.values(CHARACTER_ART)) {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
    }
  }, []);

  useEffect(() => {
    if (!started || tab !== "home" || panel || visitorBusy || pointerBusy || targeting) return;
    if (match.over || match.won) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    const id = window.setTimeout(() => maybeVisitor(), 1050);
    return () => window.clearTimeout(id);
  }, [started, tab, panel, visitorBusy, pointerBusy, targeting, match.moves, match.over, match.won, maybeVisitor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.shiftKey && e.altKey)) return;
      const map: Record<string, VisitorId> = { Digit1: "milo", Digit2: "luna", Digit3: "kai", Digit4: "nia", Digit5: "pip" };
      const who = map[e.code];
      if (!who) return;
      e.preventDefault();
      useGame.getState().summonVisitor(who);
    };
    window.addEventListener("keydown", onKey);
    const w = window as Window & { __pjSummon?: (id: VisitorId) => void; __pjVisitors?: typeof VISITOR_IDS };
    w.__pjSummon = (id) => useGame.getState().summonVisitor(id);
    w.__pjVisitors = VISITOR_IDS;
    return () => {
      window.removeEventListener("keydown", onKey);
      delete w.__pjSummon;
    };
  }, []);

  return null;
}
