/**
 * Island Visitor choreography.
 *
 * Each visitor runs a short scripted scene over the board: an entrance, travel
 * to the target cell, an action with effects, a reaction and an exit. The
 * board change itself is applied by `commit()` at the moment of impact so the
 * puzzle state and the animation stay in sync.
 *
 * Everything here is imperative DOM + one particle canvas, driven by
 * requestAnimationFrame, so the React tree never re-renders per frame.
 */

import type { CellPos, ColorId } from "@/lib/game/engine";
import { VISITOR_META, type VisitorEvent, type VisitorId } from "@/lib/game/visitors";
import * as audio from "@/lib/game/audio";
import { cellTextureUrl, colorTextureUrl } from "../block";
import { CHARACTER_ART } from "./characters";
import { Fx } from "./fx";

export class Cancelled extends Error {}

export type SceneHooks = {
  /** Apply the visitor's board change now. */
  commit: () => void;
  /** Hide board cells while a copy of their block is being carried. */
  hide: (cells: string[]) => void;
  shake: boolean;
  reduce: boolean;
};

type Ctl = { cancelled: boolean; reduce: boolean };

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t * t;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function tween(ctl: Ctl, ms: number, fn: (e: number, t: number) => void, ease = easeInOut): Promise<void> {
  const dur = ctl.reduce ? Math.min(ms, 180) : ms;
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    const step = (now: number) => {
      if (ctl.cancelled) return reject(new Cancelled());
      const t = dur <= 0 ? 1 : Math.min(1, (now - t0) / dur);
      fn(ease(t), t);
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

const wait = (ctl: Ctl, ms: number) => tween(ctl, ctl.reduce ? Math.min(ms, 120) : ms, () => {});

/* ---------------------------------------------------------------- geometry */

type Box = { x: number; y: number; w: number; h: number; cx: number; cy: number };

class Board {
  constructor(private grid: HTMLElement) {}
  cell([r, c]: CellPos): Box {
    const el = this.grid.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`);
    const b = (el ?? this.grid).getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height, cx: b.left + b.width / 2, cy: b.top + b.height / 2 };
  }
  get box(): Box {
    const b = this.grid.getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height, cx: b.left + b.width / 2, cy: b.top + b.height / 2 };
  }
  get size(): number {
    return this.cell([0, 0]).w;
  }
  frame(): HTMLElement | null {
    return this.grid.closest<HTMLElement>(".pj-frame");
  }
}

/* ------------------------------------------------------------------- actor */

class Actor {
  el: HTMLDivElement;
  body: HTMLDivElement;
  img: HTMLDivElement;
  /** Horizontal bands of the character art that bend independently. */
  private slices: HTMLDivElement[] = [];
  shadow: HTMLDivElement;
  prop: HTMLDivElement;
  bubble: HTMLDivElement;
  x = 0;
  y = 0;
  lift = 0;
  w: number;
  h: number;
  sx = 1;
  sy = 1;
  rot = 0;
  flip = 1;
  private bubbleTimer = 0;
  /** Smoothed 3D yaw: 0 = facing right, 180 = facing left. */
  private turn = 0;
  private lastX = 0;
  private lean = 0;
  private still = false;
  private vxs = 0;
  private lastLift = 0;
  private vys = 0;
  private wiggleUntil = 0;
  private born = performance.now();
  private raf = 0;
  private reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  constructor(host: HTMLElement, id: VisitorId, height: number) {
    const aspect = { milo: 371 / 653, luna: 480 / 700, kai: 385 / 695, nia: 450 / 693, pip: 459 / 675 }[id];
    this.h = height;
    this.w = height * aspect;
    this.el = document.createElement("div");
    this.el.className = `pj-actor is-${id}`;
    this.el.style.width = `${this.w}px`;
    this.el.style.height = `${this.h}px`;
    this.shadow = document.createElement("div");
    this.shadow.className = "pj-actor-shadow";
    this.body = document.createElement("div");
    this.body.className = "pj-actor-body";
    // The art is cut into stacked bands: feet stay planted while the body,
    // shoulders and head sway, lag behind movement and bounce on landings.
    this.img = document.createElement("div");
    this.img.className = "pj-actor-img pj-actor-rig";
    const N = 8;
    for (let i = 0; i < N; i++) {
      const band = document.createElement("div");
      band.className = "pj-actor-band";
      band.style.top = `${(i / N) * 100}%`;
      band.style.height = `calc(${100 / N}% + 1.5px)`;
      band.style.backgroundImage = `url(${CHARACTER_ART[id]})`;
      band.style.backgroundSize = `${this.w}px ${this.h}px`;
      band.style.backgroundPosition = `0 ${-(i / N) * this.h}px`;
      this.img.appendChild(band);
      this.slices.push(band);
    }
    this.body.appendChild(this.img);
    // A soft highlight that sweeps across the character, masked to its
    // silhouette, so the art reads as a rounded 3D figure, not a flat cut-out.
    const shine = document.createElement("div");
    shine.className = "pj-actor-shine";
    const mask = `url(${CHARACTER_ART[id]})`;
    shine.style.maskImage = mask;
    shine.style.webkitMaskImage = mask;
    this.body.appendChild(shine);
    this.prop = document.createElement("div");
    this.prop.className = "pj-actor-prop";
    this.bubble = document.createElement("div");
    this.bubble.className = "pj-actor-bubble";
    this.el.append(this.shadow, this.body, this.prop, this.bubble);
    host.appendChild(this.el);
    // Life loop: smooth 3D turns, leaning into motion, idle look-around.
    const tick = () => {
      this.render(true);
      this.raf = requestAnimationFrame(tick);
    };
    if (!this.reduce) this.raf = requestAnimationFrame(tick);
  }

  private render(fromTick = false): void {
    const target = this.flip === 1 ? 0 : 180;
    this.turn += (target - this.turn) * (this.reduce ? 1 : 0.2);
    if (Math.abs(target - this.turn) < 0.5) this.turn = target;
    // Velocity is sampled once per frame (tweens also call render).
    const vx = fromTick ? this.x - this.lastX : 0;
    if (fromTick) {
      this.lastX = this.x;
      this.lean += (Math.max(-22, Math.min(22, vx * 2.2)) - this.lean) * 0.18;
      this.still = Math.abs(vx) < 0.3 && this.lift < 1;
      // Smoothed velocities drive the body's follow-through.
      this.vxs += (vx - this.vxs) * 0.25;
      const vy = this.lift - this.lastLift;
      this.lastLift = this.lift;
      this.vys += (vy - this.vys) * 0.3;
      this.bend((performance.now() - this.born) / 1000);
    }
    const t = (performance.now() - this.born) / 1000;
    const still = this.still;
    const look = still ? Math.sin(t * 1.7) * 14 : 0;
    const breathe = still ? Math.sin(t * 3.2) * 0.02 : 0;
    // Pop in with a spin the first half second.
    const pop = Math.min(1, t / 0.45);
    const popScale = pop < 1 ? 0.2 + 0.8 * (1 - (1 - pop) ** 3) * (1 + 0.15 * Math.sin(pop * Math.PI)) : 1;
    const popSpin = pop < 1 ? (1 - pop) * 360 : 0;
    const yaw = this.turn + popSpin + (this.flip === 1 ? -this.lean : this.lean) * 0.6 + look;
    this.body.style.transform =
      `translateY(${-this.lift}px) rotateY(${yaw}deg) rotateZ(${this.rot + this.lean * 0.25 * this.flip}deg) ` +
      `scale(${this.sx * popScale * (1 + breathe)}, ${this.sy * popScale * (1 - breathe)})`;
    this.body.style.setProperty("--shine", `${((t * 0.45) % 1.6) * 100 - 30}%`);
  }

  /** Feet position in viewport px; `lift` raises the body off the ground. */
  place(x: number, y: number, lift = this.lift): void {
    this.x = x;
    this.y = y;
    this.lift = lift;
    this.el.style.transform = `translate3d(${x - this.w / 2}px, ${y - this.h}px, 0)`;
    if (this.reduce) this.body.style.transform = `translateY(${-lift}px) scale(${this.flip * this.sx}, ${this.sy}) rotate(${this.rot}deg)`;
    else this.render();
    this.prop.style.transform = `translate(-50%, ${-lift}px)`;
    this.bubble.style.transform = `translate(-50%, ${-lift}px)`;
    const k = Math.max(0.35, 1 - lift / (this.h * 1.4));
    this.shadow.style.transform = `translateX(-50%) scale(${k})`;
    this.shadow.style.opacity = String(0.55 * k);
  }

  /** Bend the bands: an S-curve sway, trailing on moves, bounce on landings. */
  private bend(t: number): void {
    const n = this.slices.length;
    const wiggle = performance.now() < this.wiggleUntil ? 1 : 0;
    const dir = this.flip;
    for (let i = 0; i < n; i++) {
      const w = Math.pow((n - 1 - i) / (n - 1), 1.4); // 1 at the head, 0 at the feet
      const sway = Math.sin(t * 2.6 - i * 0.55) * (this.still ? 2.2 : 1.2) * w;
      const dance = wiggle ? Math.sin(t * 22 - i * 0.9) * 3.5 * w : 0;
      const trail = Math.max(-14, Math.min(14, -this.vxs * 2.2)) * w * dir;
      const bob = Math.max(-10, Math.min(10, this.vys * 1.4)) * w;
      this.slices[i]!.style.transform = `translate3d(${(sway + dance + trail).toFixed(2)}px, ${bob.toFixed(2)}px, 0)`;
    }
  }

  pose(sx: number, sy: number, rot = this.rot): void {
    this.sx = sx;
    this.sy = sy;
    this.rot = rot;
    this.place(this.x, this.y);
  }

  face(dir: 1 | -1): void {
    this.flip = dir;
    this.place(this.x, this.y);
  }

  mode(name: "idle" | "hover" | "flap" | "run" | "none"): void {
    this.img.dataset.mode = name;
  }

  say(text: string, ms = 1300): void {
    // A happy wiggle every time they talk.
    this.wiggleUntil = performance.now() + 650;
    window.clearTimeout(this.bubbleTimer);
    this.bubble.textContent = text;
    this.bubble.classList.add("is-on");
    this.bubbleTimer = window.setTimeout(() => this.bubble.classList.remove("is-on"), ms);
  }

  /** Squash down, then spring back. */
  async squash(ctl: Ctl, amount = 0.2, ms = 140): Promise<void> {
    await tween(ctl, ms, (e) => this.pose(1 + amount * 0.6 * e, 1 - amount * e), easeOut);
    await tween(ctl, ms * 1.4, (e) => this.pose(lerp(1 + amount * 0.6, 1, e), lerp(1 - amount, 1, e)), easeOut);
  }

  /** Jump along a parabola to (tx, ty), with take-off squash and landing dust. */
  async hop(ctl: Ctl, fx: Fx, tx: number, ty: number, height: number, ms: number, opts: { dust?: boolean; spin?: number } = {}): Promise<void> {
    const x0 = this.x;
    const y0 = this.y;
    if (Math.abs(tx - x0) > 2) this.face(tx > x0 ? 1 : -1);
    await tween(ctl, 90, (e) => this.pose(1 + 0.14 * e, 1 - 0.2 * e), easeOut);
    const lean = Math.sign(tx - x0) * 8;
    await tween(
      ctl,
      ms,
      (_e, t) => {
        const x = lerp(x0, tx, t);
        const y = lerp(y0, ty, t);
        const arc = 4 * height * t * (1 - t);
        // Stretch on the way up, tuck at the top, reach down to land.
        const stretch = t < 0.35 ? 1.12 : t < 0.65 ? 0.9 : 1.06;
        this.sx = 2 - stretch;
        this.sy = stretch;
        this.rot = lean * (1 - 2 * t) + (opts.spin ?? 0) * t;
        this.place(x, y, arc);
      },
      (t) => t,
    );
    this.rot = 0;
    if (opts.dust !== false) {
      fx.burst("dust", tx, ty, { count: 7, angle: 0, spread: Math.PI * 2, speed: 60 });
    }
    await this.squash(ctl, 0.22, 90);
  }

  /** Walk with small bouncing steps. */
  async walk(ctl: Ctl, fx: Fx, tx: number, ty: number, msPerStep = 170, stepLen?: number): Promise<void> {
    const dist = Math.hypot(tx - this.x, ty - this.y);
    const len = stepLen ?? this.w * 0.55;
    const steps = Math.max(1, Math.round(dist / len));
    const x0 = this.x;
    const y0 = this.y;
    this.face(tx >= x0 ? 1 : -1);
    for (let i = 1; i <= steps; i++) {
      const fx0 = this.x;
      const fy0 = this.y;
      // A curved path (not a straight slide), with a little skip every third step.
      const arc = Math.sin((Math.PI * i) / steps) * Math.min(this.h * 0.35, dist * 0.18);
      const nx = lerp(x0, tx, i / steps);
      const ny = lerp(y0, ty, i / steps) - arc;
      const skip = i % 3 === 0 ? 2.2 : 1;
      const tilt = i % 2 ? 7 : -7;
      await tween(
        ctl,
        msPerStep,
        (_e, t) => {
          this.rot = tilt * Math.sin(Math.PI * t);
          this.sy = 1 - 0.06 * Math.sin(Math.PI * t * 2);
          this.sx = 2 - this.sy;
          this.place(lerp(fx0, nx, t), lerp(fy0, ny, t), Math.sin(Math.PI * t) * this.h * 0.08 * skip);
        },
        (t) => t,
      );
      fx.burst("dust", this.x, this.y, { count: 2, speed: 40, size: 5 });
    }
    this.pose(1, 1, 0);
  }

  remove(): void {
    window.clearTimeout(this.bubbleTimer);
    cancelAnimationFrame(this.raf);
    this.el.remove();
  }
}

/* ----------------------------------------------------------------- helpers */

function tile(host: HTMLElement, url: string | null, size: number, extraClass = ""): HTMLDivElement {
  const el = document.createElement("div");
  el.className = `pj-fly-tile ${extraClass}`;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  if (url) el.style.backgroundImage = `url(${url})`;
  host.appendChild(el);
  return el;
}

function placeEl(el: HTMLElement, x: number, y: number, scale = 1, rot = 0): void {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  el.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0) scale(${scale}) rotate(${rot}deg)`;
}

async function shakeBoard(ctl: Ctl, board: Board, power: number, ms = 360): Promise<void> {
  const frame = board.frame();
  if (!frame) return;
  await tween(
    ctl,
    ms,
    (_e, t) => {
      const k = (1 - t) * power;
      frame.style.translate = `${(Math.random() - 0.5) * 2 * k}px ${(Math.random() - 0.5) * 2 * k}px`;
    },
    (t) => t,
  ).finally(() => {
    frame.style.translate = "";
  });
}

const PAINT: Record<ColorId, string> = {
  cyan: "#3ec2ff",
  azure: "#2f6ff0",
  lime: "#4fd14a",
  pink: "#ff4f8f",
  amber: "#ffbd2e",
  orange: "#ff7a1f",
  violet: "#b54dff",
};

/* ------------------------------------------------------------------ scenes */

type Scene = {
  ctl: Ctl;
  fx: Fx;
  board: Board;
  host: HTMLElement;
  actor: Actor;
  hooks: SceneHooks;
  event: VisitorEvent;
  /** Viewport edges. */
  vw: number;
  vh: number;
};

/** Where a visitor stands to work on a cell: just below its center. */
function standAt(scene: Scene, at: CellPos): { x: number; y: number } {
  const c = scene.board.cell(at);
  return { x: c.cx, y: c.cy + c.h * 0.42 };
}

function entrySide(scene: Scene, x: number): 1 | -1 {
  return x < scene.vw / 2 ? -1 : 1;
}

async function warnBanner(scene: Scene): Promise<void> {
  const { host, event, ctl } = scene;
  const meta = VISITOR_META[event.visitor];
  const el = document.createElement("div");
  el.className = "pj-vis-warn";
  el.innerHTML = `<img src="${CHARACTER_ART[event.visitor]}" alt="" /><div><strong></strong><span></span></div>`;
  el.querySelector("strong")!.textContent = `${meta.name} is coming!`;
  el.querySelector("span")!.textContent = meta.cue;
  host.appendChild(el);
  audio.sfxVisitorWarn();
  try {
    await tween(ctl, 260, (e) => (el.style.transform = `translate(-50%, ${lerp(-40, 0, e)}px) scale(${lerp(0.8, 1, e)})`), easeOut);
    el.style.opacity = "1";
    await wait(ctl, 460);
    await tween(ctl, 160, (e) => (el.style.opacity = String(1 - e)));
  } finally {
    el.remove();
  }
}

/** Milo: swings in on a vine, grabs a block, carries it overhead, slams it down. */
async function sceneMilo(s: Scene): Promise<void> {
  const { ctl, fx, board, actor, hooks, host } = s;
  const a = s.event.action;
  if (a.kind !== "move") return;
  const size = board.size;
  const from = standAt(s, a.from);
  const to = standAt(s, a.to);
  const side = entrySide(s, from.x);

  // Vine from above the board; Milo swings in on it like a pendulum.
  const pivot = { x: from.x - side * size * 0.6, y: board.box.y - size * 3.2 };
  const len = from.y - actor.h * 0.82 - pivot.y;
  const vine = document.createElement("div");
  vine.className = "pj-vine";
  host.appendChild(vine);
  const hang = (theta: number) => {
    const hx = pivot.x + Math.sin(theta) * len;
    const hy = pivot.y + Math.cos(theta) * len;
    vine.style.height = `${len}px`;
    vine.style.transform = `translate3d(${pivot.x}px, ${pivot.y}px, 0) rotate(${(-theta * 180) / Math.PI}deg)`;
    actor.rot = (-theta * 180) / Math.PI * 0.6;
    actor.place(hx, hy + actor.h * 0.82, 0);
  };
  actor.face(side === -1 ? 1 : -1);
  audio.sfxVisitor("milo");
  audio.visitorTheme("milo");
  const start = side * 1.25;
  const end = Math.asin(Math.max(-1, Math.min(1, (from.x - pivot.x) / len))) || 0;
  await tween(ctl, 760, (e) => hang(lerp(start, end - side * 0.28, e)), easeOut);
  fx.burst("leaf", pivot.x, pivot.y + 10, { count: 8, speed: 80, angle: Math.PI / 2, spread: 1.6 });
  await tween(ctl, 200, (e) => hang(lerp(end - side * 0.28, end, e)), easeInOut);
  // Let go and drop to the board.
  vine.classList.add("is-gone");
  actor.rot = 0;
  await actor.hop(ctl, fx, from.x, from.y, size * 0.6, 260);
  actor.say("Ooh-ooh!");

  // Grab the block: it pops out of its cell and sits above his head.
  const url = cellTextureUrl(a.cell);
  const block = tile(host, url, size * 0.92, "is-held");
  const cellBox = board.cell(a.from);
  hooks.hide([`${a.from[0]}-${a.from[1]}`]);
  await actor.squash(ctl, 0.25, 110);
  audio.sfxVisitorAct("milo");
  const headY = () => actor.y - actor.h - actor.lift - size * 0.4;
  await tween(ctl, 300, (e) => placeEl(block, lerp(cellBox.cx, actor.x, e), lerp(cellBox.cy, headY(), e), 1, e * 360), easeOut);

  // Carry it in one or two hops, block riding overhead.
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const hops = dist > size * 4.5 ? 2 : 1;
  const follow = () => placeEl(block, actor.x, headY(), 1, Math.sin(performance.now() / 90) * 6);
  const ride = window.setInterval(follow, 16);
  try {
    for (let i = 1; i <= hops; i++) {
      await actor.hop(ctl, fx, lerp(from.x, to.x, i / hops), lerp(from.y, to.y, i / hops), size * 1.6, 440);
    }
  } finally {
    window.clearInterval(ride);
  }

  // Slam it down into the target cell.
  const target = board.cell(a.to);
  await tween(ctl, 120, (e) => placeEl(block, actor.x, headY() - e * size * 0.5, 1.1), easeOut);
  await tween(ctl, 200, (e) => placeEl(block, lerp(actor.x, target.cx, e), lerp(headY() - size * 0.5, target.cy, e), lerp(1.1, 1, e)), easeIn);
  block.remove();
  hooks.commit();
  hooks.hide([]);
  fx.ring(target.cx, target.cy, { to: size * 1.6, color: "rgba(255,236,170,0.95)" });
  fx.burst("leaf", target.cx, target.cy, { count: 10, speed: 170 });
  fx.burst("dust", target.cx, target.cy + size * 0.4, { count: 8, speed: 90 });
  if (hooks.shake) void shakeBoard(ctl, board, 3, 220);

  // Cheer and bounce away.
  actor.say("Ta-da!");
  await actor.hop(ctl, fx, actor.x, actor.y, size * 0.9, 320, { dust: false, spin: 360 });
  fx.burst("sparkle", actor.x, actor.y - actor.h * 0.7, { count: 10 });
  const out = actor.x < s.vw / 2 ? -actor.w : s.vw + actor.w;
  await actor.hop(ctl, fx, out, actor.y - size, size * 2.4, 520, { dust: false });
}

/** Luna: teleports in through a magic ring and enchants a block with a wand beam. */
async function sceneLuna(s: Scene): Promise<void> {
  const { ctl, fx, board, actor, hooks, host } = s;
  const a = s.event.action;
  if (a.kind !== "enchant") return;
  const size = board.size;
  const cell = board.cell(a.at);
  const side = cell.cx > board.box.cx ? -1 : 1;
  const spot = { x: cell.cx + side * size * 1.6, y: cell.cy + size * 0.6 };
  const clampX = Math.max(board.box.x + actor.w * 0.4, Math.min(board.box.x + board.box.w - actor.w * 0.4, spot.x));

  // Portal: rings and a spiral of motes, then she grows out of it, spinning.
  audio.sfxVisitor("luna");
  audio.visitorTheme("luna");
  for (let i = 0; i < 3; i++) fx.ring(clampX, spot.y - actor.h * 0.4, { to: size * (1.4 + i * 0.6), color: "rgba(196,140,255,0.9)", ms: 520 + i * 160 });
  fx.burst("magic", clampX, spot.y - actor.h * 0.45, { count: 26, speed: 160 });
  actor.face(side === -1 ? 1 : -1);
  actor.mode("hover");
  await tween(ctl, 560, (e) => {
    actor.sx = actor.sy = e;
    actor.rot = (1 - e) * 540;
    actor.place(clampX, spot.y, size * 0.35);
  }, easeOut);
  actor.pose(1, 1, 0);
  actor.say("Abracadabra!");
  await wait(ctl, 280);

  // Raise the wand: lean back, then a beam reaches the cell.
  await tween(ctl, 220, (e) => actor.pose(1, 1, -side * 10 * e), easeOut);
  const wand = { x: actor.x - side * actor.w * 0.38, y: actor.y - actor.lift - actor.h * 0.68 };
  const beam = document.createElement("div");
  beam.className = "pj-beam";
  host.appendChild(beam);
  const rune = document.createElement("div");
  rune.className = "pj-rune";
  rune.style.width = rune.style.height = `${size * 1.7}px`;
  host.appendChild(rune);
  placeEl(rune, cell.cx, cell.cy);
  const dx = cell.cx - wand.x;
  const dy = cell.cy - wand.y;
  const full = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  audio.sfxVisitorAct("luna");
  await tween(ctl, 360, (e) => {
    beam.style.width = `${full * e}px`;
    beam.style.transform = `translate3d(${wand.x}px, ${wand.y}px, 0) rotate(${ang}deg)`;
    rune.style.opacity = String(e);
  }, easeOut);
  fx.trail("magic", wand.x, wand.y, cell.cx, cell.cy, 12, { speed: 40 });
  await wait(ctl, 260);

  // The block takes the enchantment.
  hooks.commit();
  fx.ring(cell.cx, cell.cy, { to: size * 1.8, color: "rgba(255,226,122,0.95)", width: 5 });
  fx.burst("sparkle", cell.cx, cell.cy, { count: 22, speed: 220, color: ["#fff3b0", "#d8b4ff"] });
  await tween(ctl, 240, (e) => {
    beam.style.opacity = String(1 - e);
    rune.style.opacity = String(1 - e);
  });
  beam.remove();
  rune.remove();
  await tween(ctl, 200, (e) => actor.pose(1, 1, -side * 10 * (1 - e)), easeOut);
  actor.say("A little magic!", 1100);
  await wait(ctl, 520);

  // Twirl out into a puff of smoke.
  fx.burst("magic", actor.x, actor.y - actor.h * 0.5, { count: 30, speed: 200 });
  await tween(ctl, 460, (e) => {
    actor.rot = e * 720;
    actor.sx = actor.sy = 1 - e;
    actor.place(actor.x, actor.y, actor.lift + e * size);
  }, easeIn);
  fx.burst("dust", actor.x, actor.y - actor.h * 0.4, { count: 12, color: "#cdb8f0", speed: 90 });
}

/** Kai: stomps in, leaps onto the cell and hammers it — shockwave, rubble, shake. */
async function sceneKai(s: Scene): Promise<void> {
  const { ctl, fx, board, actor, hooks, host } = s;
  const a = s.event.action;
  if (a.kind !== "build" && a.kind !== "break") return;
  const size = board.size;
  const cell = board.cell(a.at);
  const side = entrySide(s, cell.cx);
  const ground = cell.cy + size * 0.42;
  const startX = side === -1 ? -actor.w : s.vw + actor.w;
  const nearX = side === -1 ? cell.cx - size * 1.5 : cell.cx + size * 1.5;

  audio.sfxVisitor("kai");
  audio.visitorTheme("kai");
  actor.mode("run");
  actor.place(startX, ground, 0);
  await actor.walk(ctl, fx, nearX, ground, 150);
  actor.mode("idle");
  actor.say("Hammer time!");

  // Wind up, leap, slam.
  await tween(ctl, 220, (e) => actor.pose(1 + 0.1 * e, 1 - 0.14 * e, side * 14 * e), easeOut);
  await actor.hop(ctl, fx, cell.cx, ground, size * 2.2, 420, { dust: false });
  await tween(ctl, 90, (e) => actor.pose(1, 1, -side * 22 * e), easeIn);
  audio.sfxVisitorAct("kai");

  if (a.kind === "build") {
    // A new stone drops in from above and lands with a thud.
    const stone = tile(host, "/art/tiles/stone.webp", size * 0.92, "is-dropped");
    await tween(ctl, 260, (e) => placeEl(stone, cell.cx, lerp(cell.cy - size * 4, cell.cy, e), 1.1 - 0.1 * e, (1 - e) * 40), easeIn);
    stone.remove();
  }
  hooks.commit();
  fx.ring(cell.cx, cell.cy, { to: size * 2.6, color: "rgba(255,232,190,0.9)", width: 6, ms: 460 });
  fx.ring(cell.cx, cell.cy, { to: size * 1.4, color: "rgba(255,255,255,0.8)", width: 3, ms: 300 });
  fx.burst("debris", cell.cx, cell.cy, { count: a.kind === "break" ? 22 : 12, speed: 340 });
  fx.burst("dust", cell.cx, cell.cy + size * 0.3, { count: 12, speed: 120 });
  if (hooks.shake) void shakeBoard(ctl, board, 7, 380);
  await tween(ctl, 160, (e) => actor.pose(1, 1, -side * 22 * (1 - e)), easeOut);
  await actor.squash(ctl, 0.2, 100);

  actor.say(a.kind === "break" ? "Cleared the way!" : "Built to last!", 1100);
  await actor.hop(ctl, fx, actor.x, actor.y, size * 0.7, 300);
  // Stomp back off the board.
  actor.mode("run");
  await actor.walk(ctl, fx, side === -1 ? -actor.w : s.vw + actor.w, ground, 130);
}

/** Nia: runs in, traces a glowing path through the blocks, and they slide along it. */
async function sceneNia(s: Scene): Promise<void> {
  const { ctl, fx, board, actor, hooks, host } = s;
  const a = s.event.action;
  if (a.kind !== "rotate" && a.kind !== "swap") return;
  const size = board.size;
  const moves =
    a.kind === "rotate"
      ? a.cells.map((m) => ({ from: m.from, to: m.to, cell: m.cell }))
      : [
          { from: a.a, to: a.b, cell: a.cellA },
          { from: a.b, to: a.a, cell: a.cellB },
        ];
  const pts = moves.map((m) => board.cell(m.from));
  const cx = pts.reduce((n, p) => n + p.cx, 0) / pts.length;
  const cy = pts.reduce((n, p) => n + p.cy, 0) / pts.length;
  const side = entrySide(s, cx);
  const ground = cy + size * 1.3;
  const standX = side === -1 ? cx - size * 1.6 : cx + size * 1.6;

  audio.sfxVisitor("nia");
  audio.visitorTheme("nia");
  actor.mode("run");
  actor.place(side === -1 ? -actor.w : s.vw + actor.w, ground, 0);
  await actor.walk(ctl, fx, standX, ground, 110, actor.w * 0.7);
  actor.mode("idle");
  actor.face(cx > actor.x ? 1 : -1);
  actor.say("This way!");

  // Draw the route through the cells.
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "pj-path");
  svg.setAttribute("width", String(s.vw));
  svg.setAttribute("height", String(s.vh));
  const path = document.createElementNS(svgNS, "path");
  const loop = a.kind === "rotate" ? [...pts, pts[0]!] : pts;
  path.setAttribute("d", loop.map((p, i) => `${i ? "L" : "M"}${p.cx},${p.cy}`).join(" "));
  svg.appendChild(path);
  host.appendChild(svg);
  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length}`;
  audio.sfxVisitorAct("nia");
  await tween(ctl, 520, (e) => (path.style.strokeDashoffset = String(length * (1 - e))), easeInOut);
  for (const p of pts) fx.burst("sparkle", p.cx, p.cy, { count: 5, color: "#9fe8ff", speed: 90 });

  // Blocks slide along the route to their new spots.
  const tiles = moves.map((m) => {
    const t = tile(host, cellTextureUrl(m.cell), size * 0.92, "is-held");
    const b = board.cell(m.from);
    placeEl(t, b.cx, b.cy);
    return t;
  });
  hooks.hide(moves.map((m) => `${m.from[0]}-${m.from[1]}`));
  await tween(ctl, 520, (e, t) => {
    moves.forEach((m, i) => {
      const f = board.cell(m.from);
      const to = board.cell(m.to);
      const arc = Math.sin(Math.PI * t) * size * 0.35;
      placeEl(tiles[i]!, lerp(f.cx, to.cx, e), lerp(f.cy, to.cy, e) - arc, 1 + Math.sin(Math.PI * t) * 0.12);
    });
  });
  tiles.forEach((t) => t.remove());
  hooks.commit();
  hooks.hide([]);
  for (const m of moves) {
    const to = board.cell(m.to);
    fx.burst("sparkle", to.cx, to.cy, { count: 6, color: ["#9fe8ff", "#fff3b0"], speed: 120 });
  }
  fx.ring(cx, cy, { to: size * 2.2, color: "rgba(159,232,255,0.85)" });
  await tween(ctl, 240, (e) => (svg.style.opacity = String(1 - e)));
  svg.remove();

  actor.say("Found it!", 1000);
  await actor.hop(ctl, fx, actor.x, actor.y, size * 0.8, 320);
  actor.mode("run");
  await actor.walk(ctl, fx, side === -1 ? -actor.w : s.vw + actor.w, ground, 100, actor.w * 0.8);
}

/** Pip: swoops in, flapping, and drops a paint bomb that splats a new color. */
async function scenePip(s: Scene): Promise<void> {
  const { ctl, fx, board, actor, hooks, host } = s;
  const a = s.event.action;
  if (a.kind !== "recolor") return;
  const size = board.size;
  const cell = board.cell(a.at);
  const hoverY = cell.y - size * 0.6;
  const fromRight = cell.cx < board.box.cx;
  const sx0 = fromRight ? s.vw + actor.w : -actor.w;
  const sy0 = board.box.y - size * 2;

  audio.sfxVisitor("pip");
  audio.visitorTheme("pip");
  actor.mode("flap");
  actor.face(fromRight ? -1 : 1);
  // Swoop: a curved dive that dips below the target, then rises into a hover.
  await tween(ctl, 900, (e) => {
    const x = lerp(sx0, cell.cx, e);
    const dip = Math.sin(Math.PI * e) * size * 1.6;
    const y = lerp(sy0, hoverY, e) + dip;
    actor.rot = (fromRight ? -1 : 1) * Math.cos(Math.PI * e) * 14;
    actor.place(x, y, 0);
    if (Math.random() < 0.25) fx.burst("feather", x, y - actor.h * 0.5, { count: 1, speed: 40 });
  }, easeOut);
  actor.rot = 0;
  actor.say("Squawk! Pretty!");
  await wait(ctl, 300);

  // Paint bomb: wobbles as it falls, then splats in the new color.
  const color = PAINT[a.to];
  const blob = document.createElement("div");
  blob.className = "pj-paint-blob";
  blob.style.setProperty("--paint", color);
  blob.style.width = blob.style.height = `${size * 0.6}px`;
  host.appendChild(blob);
  audio.sfxVisitorAct("pip");
  const y0 = actor.y - actor.h * 0.15;
  await tween(ctl, 380, (e) => placeEl(blob, cell.cx, lerp(y0, cell.cy, e), 1 + Math.sin(e * 18) * 0.08, e * 200), easeIn);
  blob.remove();
  hooks.commit();
  fx.burst("paint", cell.cx, cell.cy, { count: 22, color, speed: 300 });
  fx.ring(cell.cx, cell.cy, { to: size * 1.5, color, width: 6, ms: 420 });
  const splat = tile(host, colorTextureUrl(a.to), size * 0.92, "is-splat");
  placeEl(splat, cell.cx, cell.cy);
  void tween(ctl, 420, (e) => placeEl(splat, cell.cx, cell.cy, 1.25 - 0.25 * e), easeOut).then(() => splat.remove(), () => splat.remove());
  await tween(ctl, 360, (e) => actor.place(actor.x, hoverY - Math.sin(Math.PI * e) * size * 0.5, 0));

  // Fly up and away.
  const ex = fromRight ? -actor.w : s.vw + actor.w;
  actor.face(fromRight ? -1 : 1);
  const x0 = actor.x;
  const y0b = actor.y;
  await tween(ctl, 700, (e) => {
    actor.rot = (fromRight ? -1 : 1) * -12;
    actor.place(lerp(x0, ex, e), lerp(y0b, -actor.h, e * e), 0);
    if (Math.random() < 0.3) fx.burst("feather", actor.x, actor.y - actor.h * 0.4, { count: 1, speed: 40 });
  }, easeIn);
}

const SCENES: Record<VisitorId, (s: Scene) => Promise<void>> = {
  milo: sceneMilo,
  luna: sceneLuna,
  kai: sceneKai,
  nia: sceneNia,
  pip: scenePip,
};

/**
 * Play one visitor event. Resolves when the scene ends; `stop()` cancels it
 * (new game, leaving the screen) and cleans up every node it created.
 */
export function playVisitor(
  host: HTMLElement,
  grid: HTMLElement,
  event: VisitorEvent,
  hooks: SceneHooks,
): { done: Promise<void>; stop: () => void } {
  const ctl: Ctl = { cancelled: false, reduce: hooks.reduce };
  const fx = new Fx(host);
  fx.scale = hooks.reduce ? 0.3 : 1;
  const board = new Board(grid);
  const layer = document.createElement("div");
  layer.className = "pj-scene";
  host.appendChild(layer);
  const actor = new Actor(layer, event.visitor, Math.max(100, board.size * 4));
  actor.place(-500, -500, 0);
  actor.mode("idle");
  let committed = false;
  const scene: Scene = {
    ctl,
    fx,
    board,
    host: layer,
    actor,
    event,
    vw: window.innerWidth,
    vh: window.innerHeight,
    hooks: {
      ...hooks,
      commit: () => {
        if (committed) return;
        committed = true;
        hooks.commit();
      },
    },
  };

  const done = (async () => {
    try {
      await warnBanner(scene);
      await SCENES[event.visitor](scene);
      // Safety net: never leave the board change unapplied.
      scene.hooks.commit();
      await wait(ctl, 250);
    } catch (err) {
      if (!(err instanceof Cancelled)) {
        console.error("[visitors] scene failed", err);
        if (!ctl.cancelled) scene.hooks.commit();
      }
    } finally {
      hooks.hide([]);
      actor.remove();
      layer.remove();
      // Let the last particles finish before removing the canvas.
      window.setTimeout(() => fx.destroy(), 900);
    }
  })();

  return {
    done,
    stop: () => {
      ctl.cancelled = true;
      fx.clear();
    },
  };
}
