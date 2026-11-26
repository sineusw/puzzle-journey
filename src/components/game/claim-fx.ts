import * as audio from "@/lib/game/audio";

const BITS = ["🪙", "💎", "⭐", "✨", "🪙", "🎉"];

/**
 * Reward claim juice: the button pops, coins and gems burst out of it,
 * a coin-counter sound plays and the phone buzzes in a rising pattern.
 */
export function celebrateClaim(e: { currentTarget: EventTarget | null }, big = false): void {
  const el = e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
  audio.vibrate(big ? [20, 40, 20, 40, 30, 50, 60] : [16, 40, 16, 40, 40]);
  audio.feelCoins(big ? 10 : 6);
  if (big) audio.feelMilestone();
  if (!el || typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  el.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(0.94)" }, { transform: "scale(1)" }], { duration: 380, easing: "ease-out" });
  const b = el.getBoundingClientRect();
  const x0 = b.left + b.width / 2;
  const y0 = b.top + b.height / 2;
  const n = big ? 22 : 14;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.textContent = BITS[i % BITS.length]!;
    s.style.cssText = `position:fixed;left:${x0}px;top:${y0}px;z-index:9999;pointer-events:none;font-size:${18 + Math.random() * 14}px;translate:-50% -50%`;
    document.body.appendChild(s);
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const d = 70 + Math.random() * (big ? 140 : 90);
    s.animate(
      [
        { transform: "translate(0,0) scale(0.4) rotate(0)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d - 40}px) scale(1.2) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${Math.cos(a) * d * 1.1}px, ${Math.sin(a) * d + 60}px) scale(0.8)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.3,1)" },
    ).finished.then(() => s.remove(), () => s.remove());
  }
}
