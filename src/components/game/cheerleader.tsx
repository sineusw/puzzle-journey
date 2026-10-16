import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/game/store";
import { VISITOR_IDS, type VisitorId } from "@/lib/game/visitors";
import { CHARACTER_ART } from "./visitors/characters";

const LINES: Record<VisitorId, string[]> = {
  milo: ["Ooh-ooh!", "Bananas!", "Swingin'!"],
  luna: ["Magical!", "Sparkly!", "Brilliant!"],
  kai: ["Solid!", "Nice build!", "Boom!"],
  nia: ["Great find!", "Onward!", "Wow!"],
  pip: ["Squawk!", "Pretty!", "Awesome!"],
};

/**
 * A character you've met pops up beside the board on big moments (combos,
 * multi-line clears, perfect clears, specials) to cheer, then ducks away.
 */
export function Cheerleader() {
  const fx = useGame((s) => s.fx);
  const seen = useGame((s) => s.profile.seenUnlocks);
  const busy = useGame((s) => s.visitorBusy || s.tutorial !== null);
  const [show, setShow] = useState<{ k: number; who: VisitorId; text: string; side: "l" | "r" } | null>(null);
  const last = useRef(0);
  useEffect(() => {
    if (!fx || busy) return;
    const lines = fx.rows.length + fx.cols.length;
    const big = fx.perfect || lines >= 2 || fx.combo >= 3 || (fx.fired?.length ?? 0) > 0;
    const now = Date.now();
    if (!big || now - last.current < 2500) return;
    last.current = now;
    const met = VISITOR_IDS.filter((v) => seen.includes(v as never));
    const pool: VisitorId[] = met.length ? met : ["milo"];
    const who = pool[Math.floor(Math.random() * pool.length)]!;
    const word = fx.perfect ? "PERFECT!" : fx.combo >= 3 ? `Combo ×${fx.combo}!` : LINES[who][Math.floor(Math.random() * 3)]!;
    setShow({ k: fx.id, who, text: word, side: Math.random() < 0.5 ? "l" : "r" });
    const t = window.setTimeout(() => setShow(null), 1500);
    return () => window.clearTimeout(t);
  }, [fx, busy, seen]);
  if (!show) return null;
  return (
    <div key={show.k} className={`pj-cheer is-${show.side}`} aria-hidden="true">
      <span className="pj-cheer-bubble">{show.text}</span>
      <img src={CHARACTER_ART[show.who]} alt="" draggable={false} />
    </div>
  );
}
