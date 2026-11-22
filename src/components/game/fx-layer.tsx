import { useEffect, useRef, type RefObject } from "react";
import { useGame } from "@/lib/game/store";
import { SIZE } from "@/lib/game/engine";

const HEX: Record<string, string> = {
  cyan: "#22D3EE",
  lime: "#84CC16",
  pink: "#F472B6",
  amber: "#FBBF24",
  violet: "#A78BFA",
  orange: "#FB923C",
  azure: "#3B82F6",
  stone: "#94A3B8",
};

type Shard = { x: number; y: number; vx: number; vy: number; s: number; r: number; vr: number; c: string; t: number; l: number; d: number };
type Beam = { h: boolean; i: number; t: number };

/** Canvas overlay for clear juice: shattering blocks, light beams across cleared lines, wave timing. */
export function FxLayer({ gridRef }: { gridRef: RefObject<HTMLDivElement | null> }) {
  const flash = useGame((s) => s.flash);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fx = useRef<{ shards: Shard[]; beams: Beam[]; raf: number; last: number }>({ shards: [], beams: [], raf: 0, last: 0 });

  useEffect(() => {
    if (!flash.length) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const rowCount = new Map<number, number>();
    const colCount = new Map<number, number>();
    for (const f of flash) {
      rowCount.set(f.r, (rowCount.get(f.r) ?? 0) + 1);
      colCount.set(f.c, (colCount.get(f.c) ?? 0) + 1);
    }
    const rows = [...rowCount].filter(([, n]) => n >= SIZE).map(([i]) => i);
    const cols = [...colCount].filter(([, n]) => n >= SIZE).map(([i]) => i);
    const S = fx.current;
    for (const f of flash) {
      const cell = f.cell as { c?: string; t?: string };
      const color = HEX[cell.c ?? ""] ?? (cell.t === "k" ? HEX.stone : "#FFFFFF");
      const d = Math.min(Math.abs(f.c - 3.5), Math.abs(f.r - 3.5)) * 0.03;
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * Math.PI * 2;
        const v = 60 + Math.random() * 220;
        S.shards.push({ x: f.c + 0.5, y: f.r + 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, s: 0.12 + Math.random() * 0.16, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, c: color, t: -d, l: 0.55 + Math.random() * 0.45, d });
      }
    }
    rows.forEach((i) => S.beams.push({ h: true, i, t: 0 }));
    cols.forEach((i) => S.beams.push({ h: false, i, t: 0 }));
    if (!S.raf) {
      S.last = performance.now();
      const tick = (now: number) => {
        const cv = canvasRef.current;
        const grid = gridRef.current;
        const dt = Math.min(0.05, (now - S.last) / 1000);
        S.last = now;
        if (!cv || !grid) {
          S.raf = 0;
          return;
        }
        const host = cv.parentElement!.getBoundingClientRect();
        const g = grid.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (cv.width !== Math.round(host.width * dpr)) {
          cv.width = Math.round(host.width * dpr);
          cv.height = Math.round(host.height * dpr);
        }
        const ctx = cv.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, host.width, host.height);
        const ox = g.left - host.left;
        const oy = g.top - host.top;
        const cs = g.width / SIZE;
        ctx.globalCompositeOperation = "lighter";
        for (let i = S.beams.length - 1; i >= 0; i--) {
          const b = S.beams[i];
          b.t += dt;
          const a = Math.max(0, 1 - b.t / 0.45);
          const w = cs * (1 + b.t * 2.2);
          const mid = (b.h ? oy : ox) + (b.i + 0.5) * cs;
          const grad = b.h ? ctx.createLinearGradient(0, mid - w / 2, 0, mid + w / 2) : ctx.createLinearGradient(mid - w / 2, 0, mid + w / 2, 0);
          grad.addColorStop(0, "rgba(255,245,210,0)");
          grad.addColorStop(0.5, `rgba(255,245,210,${a * 0.85})`);
          grad.addColorStop(1, "rgba(255,245,210,0)");
          ctx.fillStyle = grad;
          if (b.h) ctx.fillRect(ox - 8, mid - w / 2, g.width + 16, w);
          else ctx.fillRect(mid - w / 2, oy - 8, w, g.height + 16);
          if (b.t > 0.45) S.beams.splice(i, 1);
        }
        ctx.globalCompositeOperation = "source-over";
        for (let i = S.shards.length - 1; i >= 0; i--) {
          const p = S.shards[i];
          p.t += dt;
          if (p.t < 0) continue;
          if (p.t < dt * 1.5) {
            ctx.globalCompositeOperation = "lighter";
            ctx.fillStyle = "rgba(255,255,255,.55)";
            ctx.beginPath();
            ctx.arc(ox + p.x * cs, oy + p.y * cs, cs * 0.6, 0, 7);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
          }
          p.vy += 900 * dt;
          p.x += (p.vx * dt) / cs;
          p.y += (p.vy * dt) / cs;
          p.r += p.vr * dt;
          const a = Math.max(0, 1 - p.t / p.l);
          const s = p.s * cs;
          ctx.save();
          ctx.translate(ox + p.x * cs, oy + p.y * cs);
          ctx.rotate(p.r);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.25);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.45)";
          ctx.fillRect(-s / 2 + s * 0.15, -s / 2 + s * 0.12, s * 0.7, s * 0.22);
          ctx.restore();
          if (p.t > p.l) S.shards.splice(i, 1);
        }
        ctx.globalAlpha = 1;
        if (S.shards.length || S.beams.length) S.raf = requestAnimationFrame(tick);
        else {
          ctx.clearRect(0, 0, host.width, host.height);
          S.raf = 0;
        }
      };
      S.raf = requestAnimationFrame(tick);
    }
  }, [flash, gridRef]);

  useEffect(() => () => cancelAnimationFrame(fx.current.raf), []);

  return <canvas ref={canvasRef} className="pj-fx" aria-hidden="true" />;
}
