/**
 * Opening screen: picks up exactly where the iPhone launch image leaves off
 * (same glow and logo), then the logo bounces in with a shine, leaves sway and
 * blocks drop, and it fades into the game. Tap anywhere to skip.
 */
import { useEffect, useState } from "react";

const BLOCKS = ["#ff5d73", "#ffc93c", "#4fd06a", "#4f9dff", "#b86bff", "#ff9a3c"];

export function IntroSplash() {
  const [phase, setPhase] = useState<"show" | "out" | "gone">("show");
  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem("pj-intro"));
      sessionStorage.setItem("pj-intro", "1");
    } catch {
      /* private mode */
    }
    if (seen) {
      setPhase("gone");
      return;
    }
    const t = window.setTimeout(() => setPhase((p) => (p === "show" ? "out" : p)), 2300);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    if (phase !== "out") return;
    const t = window.setTimeout(() => setPhase("gone"), 520);
    return () => window.clearTimeout(t);
  }, [phase]);
  if (phase === "gone") return null;
  return (
    <div className={`pj-intro${phase === "out" ? " is-out" : ""}`} onPointerDown={() => setPhase("out")} aria-hidden="true">
      <div className="pj-intro-rays" />
      <div className="pj-intro-glow" />
      <div className="pj-intro-blocks">
        {Array.from({ length: 14 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 53) % 100}%`,
              background: BLOCKS[i % BLOCKS.length],
              animationDelay: `${0.2 + ((i * 0.37) % 1.6)}s`,
              animationDuration: `${2.4 + (i % 4) * 0.5}s`,
              ["--r" as string]: `${(i % 2 ? 1 : -1) * (40 + i * 13)}deg`,
              ["--s" as string]: `${18 + (i % 3) * 8}px`,
            }}
          />
        ))}
      </div>
      <span className="pj-intro-leaf is-l">🌿</span>
      <span className="pj-intro-leaf is-r">🌴</span>
      <div className="pj-intro-logo">
        <img src="/art/logo-hd.webp" alt="Block Journey" draggable={false} />
        <span className="pj-intro-shine" />
      </div>
      <div className="pj-intro-bar">
        <i />
      </div>
      <div className="pj-intro-studio">Petty Games Studio</div>
    </div>
  );
}
