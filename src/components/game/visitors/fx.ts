/**
 * Lightweight particle effects for Island Visitor events.
 *
 * One full-screen canvas, drawn only while particles are alive. Kinds are
 * tuned for the visitors: dust puffs, sparkles, leaves, stone debris, paint,
 * feathers, magic motes and expanding shockwave rings.
 */

export type FxKind = "dust" | "sparkle" | "leaf" | "debris" | "paint" | "feather" | "magic" | "confetti";

type Particle = {
  kind: FxKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  drag: number;
  life: number;
  max: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  sway: number;
};

type Ring = { x: number; y: number; r0: number; r1: number; life: number; max: number; color: string; width: number };

export type BurstOpts = {
  count?: number;
  color?: string | string[];
  speed?: number;
  /** Direction in radians (0 = right, -PI/2 = up). */
  angle?: number;
  /** Cone width in radians; Math.PI * 2 for all around. */
  spread?: number;
  size?: number;
  life?: number;
  gravity?: number;
};

const DEFAULTS: Record<FxKind, Required<Omit<BurstOpts, "angle" | "spread" | "count">>> = {
  dust: { color: "#e8d9bf", speed: 70, size: 7, life: 520, gravity: -20 },
  sparkle: { color: "#fff3b0", speed: 160, size: 6, life: 700, gravity: 60 },
  leaf: { color: ["#3fae4a", "#6ccf55", "#2b8a3e"], speed: 140, size: 7, life: 1300, gravity: 120 },
  debris: { color: ["#b9b2a6", "#8d867b", "#d9d2c4"], speed: 300, size: 6, life: 900, gravity: 900 },
  paint: { color: "#ff4fa3", speed: 260, size: 6, life: 700, gravity: 700 },
  feather: { color: ["#64d26b", "#3fb4f0", "#ffd84a"], speed: 110, size: 7, life: 1400, gravity: 60 },
  magic: { color: ["#d8b4ff", "#ffe27a", "#9fe8ff"], speed: 120, size: 3.5, life: 900, gravity: -40 },
  confetti: { color: ["#ffd84a", "#ff6fb5", "#5ec8ff", "#7cf5ac"], speed: 260, size: 6, life: 1200, gravity: 500 },
};

function pick(c: string | string[]): string {
  return Array.isArray(c) ? c[Math.floor(Math.random() * c.length)]! : c;
}

export class Fx {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private parts: Particle[] = [];
  private rings: Ring[] = [];
  private raf: number | null = null;
  private last = 0;
  private dpr = 1;
  /** Fewer particles when the player prefers reduced motion. */
  scale = 1;

  constructor(host: HTMLElement) {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "pj-fx-canvas";
    host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;
    this.resize();
  }

  resize(): void {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(window.innerWidth * this.dpr);
    this.canvas.height = Math.round(window.innerHeight * this.dpr);
  }

  burst(kind: FxKind, x: number, y: number, opts: BurstOpts = {}): void {
    const d = DEFAULTS[kind];
    const count = Math.max(1, Math.round((opts.count ?? 12) * this.scale));
    const angle = opts.angle ?? -Math.PI / 2;
    const spread = opts.spread ?? Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const sp = (opts.speed ?? d.speed) * (0.45 + Math.random() * 0.75);
      const life = (opts.life ?? d.life) * (0.7 + Math.random() * 0.5);
      this.parts.push({
        kind,
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        g: opts.gravity ?? d.gravity,
        drag: kind === "dust" || kind === "magic" ? 2.2 : kind === "leaf" || kind === "feather" ? 1.4 : 0.4,
        life,
        max: life,
        size: (opts.size ?? d.size) * (0.7 + Math.random() * 0.6),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * (kind === "debris" || kind === "confetti" ? 14 : 5),
        color: pick(opts.color ?? d.color),
        sway: Math.random() * Math.PI * 2,
      });
    }
    this.start();
  }

  ring(x: number, y: number, opts: { color?: string; from?: number; to?: number; ms?: number; width?: number } = {}): void {
    const ms = opts.ms ?? 520;
    this.rings.push({
      x,
      y,
      r0: opts.from ?? 6,
      r1: opts.to ?? 80,
      life: ms,
      max: ms,
      color: opts.color ?? "rgba(255,240,200,0.9)",
      width: opts.width ?? 4,
    });
    this.start();
  }

  /** A trail of particles along a line, e.g. a wand beam. */
  trail(kind: FxKind, x0: number, y0: number, x1: number, y1: number, n: number, opts: BurstOpts = {}): void {
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      this.burst(kind, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, { count: 1, speed: 30, ...opts });
    }
  }

  clear(): void {
    this.parts = [];
    this.rings = [];
  }

  destroy(): void {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.canvas.remove();
  }

  private start(): void {
    if (this.raf !== null) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { ctx, dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.rings = this.rings.filter((r) => (r.life -= dt * 1000) > 0);
    for (const r of this.rings) {
      const t = 1 - r.life / r.max;
      const e = 1 - (1 - t) * (1 - t);
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width * (1 - t * 0.6);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * e, 0, Math.PI * 2);
      ctx.stroke();
    }

    this.parts = this.parts.filter((p) => (p.life -= dt * 1000) > 0);
    for (const p of this.parts) {
      p.vx -= p.vx * p.drag * dt;
      p.vy -= p.vy * p.drag * dt;
      p.vy += p.g * dt;
      p.sway += dt * 5;
      const swayX = p.kind === "leaf" || p.kind === "feather" ? Math.sin(p.sway) * 40 * dt : 0;
      p.x += p.vx * dt + swayX;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      this.draw(p);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (this.parts.length || this.rings.length) this.raf = requestAnimationFrame(this.frame);
    else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.raf = null;
    }
  };

  private draw(p: Particle): void {
    const { ctx } = this;
    const t = 1 - p.life / p.max; // 0 → 1 over life
    // setTransform instead of save/translate/rotate/restore: cheaper per particle.
    const cos = Math.cos(p.rot);
    const sin = Math.sin(p.rot);
    ctx.setTransform(this.dpr * cos, this.dpr * sin, -this.dpr * sin, this.dpr * cos, this.dpr * p.x, this.dpr * p.y);
    ctx.fillStyle = p.color;
    switch (p.kind) {
      case "dust": {
        ctx.globalAlpha = 0.55 * (1 - t);
        const r = p.size * (0.8 + t * 1.8);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "sparkle":
      case "magic": {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = (1 - t) * (0.6 + 0.4 * Math.sin(p.sway * 3));
        const r = p.size * (p.kind === "sparkle" ? 1 - t * 0.4 : 1);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          ctx.lineTo(Math.cos(a) * r * 1.8, Math.sin(a) * r * 1.8);
          ctx.lineTo(Math.cos(a + Math.PI / 4) * r * 0.45, Math.sin(a + Math.PI / 4) * r * 0.45);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "leaf":
      case "feather": {
        ctx.globalAlpha = Math.min(1, (1 - t) * 1.6);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.3, p.size * (p.kind === "feather" ? 0.38 : 0.6), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-p.size * 1.2, 0);
        ctx.lineTo(p.size * 1.2, 0);
        ctx.stroke();
        break;
      }
      case "debris": {
        ctx.globalAlpha = Math.min(1, (1 - t) * 2);
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(-s, -s * 0.6);
        ctx.lineTo(s * 0.8, -s);
        ctx.lineTo(s, s * 0.7);
        ctx.lineTo(-s * 0.6, s);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(-s * 0.5, -s * 0.6, s * 0.7, s * 0.3);
        break;
      }
      case "paint": {
        ctx.globalAlpha = Math.min(1, (1 - t) * 1.8);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * (1 - t * 0.3), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.beginPath();
        ctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "confetti": {
        ctx.globalAlpha = Math.min(1, (1 - t) * 2);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        break;
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }
}
