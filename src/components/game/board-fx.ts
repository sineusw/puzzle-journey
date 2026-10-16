/**
 * Board effects: landing bounce, line-clear burst, score fly-up, praise,
 * combo badge, perfect clear and board shake.
 *
 * Runs imperatively on the Web Animations API plus one particle canvas, so a
 * move costs one React render and every animation runs on the compositor.
 * The board itself is already updated when this starts; cleared blocks are
 * drawn as short-lived copies on top, so nothing can reappear on the board.
 */

import type { BoardFx } from "@/lib/game/store";
import type { ColorId } from "@/lib/game/engine";
import * as audio from "@/lib/game/audio";
import { cheer } from "@/lib/game/voice";
import { cellTextureUrl } from "./block";
import { Fx } from "./visitors/fx";

const BLOCK_HEX: Record<ColorId | "stone", string> = {
  cyan: "#5fd2ff",
  azure: "#4f8bff",
  lime: "#6fe05a",
  pink: "#ff5f9e",
  amber: "#ffc93c",
  orange: "#ff8a3a",
  violet: "#c26bff",
  stone: "#cfc7b8",
};

/** Small praise for a single-line clear, so every match is acknowledged. */
const MINI_PRAISE = ["Nice!", "Sweet!", "Neat!", "Good one!", "Clean!"];
let miniIdx = 0;

/** Tier of a praise word, for its jingle (1 = Good … 5 = Unbelievable). */
const PRAISE_TIER: Record<string, number> = { "Good!": 1, "Great!": 2, "Excellent!": 3, "Amazing!": 4, "Unbelievable!": 5, "Perfect!": 5 };

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export class BoardFxRunner {
  private fx: Fx;
  private layer: HTMLDivElement;

  constructor(
    host: HTMLElement,
    private grid: HTMLElement,
    private frame: HTMLElement,
  ) {
    this.layer = document.createElement("div");
    this.layer.className = "pj-boardfx";
    host.appendChild(this.layer);
    this.fx = new Fx(this.layer);
  }

  destroy(): void {
    this.fx.destroy();
    this.layer.remove();
  }

  resize(): void {
    this.fx.resize();
  }

  /** Cell boxes from one measurement of the grid — no per-cell layout reads. */
  private cellBoxes(): (r: number, c: number) => { left: number; top: number; width: number; height: number } {
    const a = this.grid.querySelector<HTMLElement>('[data-cell="0-0"]')!.getBoundingClientRect();
    const b = this.grid.querySelector<HTMLElement>('[data-cell="1-1"]')!.getBoundingClientRect();
    const sx = b.left - a.left;
    const sy = b.top - a.top;
    return (r, c) => ({ left: a.left + c * sx, top: a.top + r * sy, width: a.width, height: a.height });
  }

  play(e: BoardFx): void {
    const reduce = reducedMotion();
    this.fx.scale = reduce ? 0.35 : 1;
    const gridBox = this.grid.getBoundingClientRect();
    const boxOf = this.cellBoxes();
    const cell = gridBox.width / 8;
    const originX = gridBox.left + (e.origin.c + 0.5) * cell;
    const originY = gridBox.top + (e.origin.r + 0.5) * cell;

    // Landing: the placed blocks squash and settle.
    for (const { r, c } of e.landed) {
      const cube = this.grid.querySelector<HTMLElement>(`[data-cell="${r}-${c}"] .pj-cube`);
      cube?.animate(
        [
          { transform: "translateY(-14%) scale(0.9, 1.1)" },
          { transform: "translateY(3%) scale(1.08, 0.92)", offset: 0.55 },
          { transform: "translateY(-1%) scale(0.98, 1.02)", offset: 0.8 },
          { transform: "none" },
        ],
        { duration: reduce ? 120 : 260, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
      );
    }

    if (e.placedCells > 0) {
      audio.feelPlace(e.placedCells);
      if (!reduce) {
        this.landRing(e.landed, boxOf);
        for (const { r, c } of e.landed) {
          const bx = boxOf(r, c);
          this.fx.burst("dust", bx.left + bx.width / 2, bx.top + bx.height, { count: 1, color: "rgba(255,255,255,0.5)", speed: 60, size: bx.width * 0.2 });
        }
      }
    }

    // Clear: line flashes, then each block pops in a wave from the landing point.
    const delays: number[] = [];
    if (e.cleared.length) {
      for (const r of e.rows) this.sweep(gridBox, "row", r, cell, reduce);
      for (const c of e.cols) this.sweep(gridBox, "col", c, cell, reduce);
      const step = reduce ? 0 : 26;
      const batch = document.createDocumentFragment();
      for (const item of e.cleared) {
        const box = boxOf(item.r, item.c);
        const dist = Math.hypot(item.r - e.origin.r, item.c - e.origin.c);
        const delay = dist * step;
        delays.push(delay);
        const tile = document.createElement("div");
        tile.className = "pj-burst-tile";
        const url = cellTextureUrl(item.cell);
        if (url) tile.style.backgroundImage = `url(${url})`;
        tile.style.left = `${box.left}px`;
        tile.style.top = `${box.top}px`;
        tile.style.width = `${box.width}px`;
        tile.style.height = `${box.height}px`;
        batch.appendChild(tile);
        const spin = (Math.random() - 0.5) * 50;
        const anim = tile.animate(
          [
            { transform: "scale(1)", filter: "brightness(1)", opacity: 1 },
            { transform: "scale(1.16)", filter: "brightness(1.9)", opacity: 1, offset: 0.35 },
            { transform: `scale(0.2) rotate(${spin}deg)`, filter: "brightness(2.2)", opacity: 0 },
          ],
          { duration: reduce ? 160 : 340, delay, easing: "cubic-bezier(0.3, 0, 0.6, 1)", fill: "both" },
        );
        anim.finished.then(() => tile.remove(), () => tile.remove());
        const color = item.cell.t === "b" || item.cell.t === "s" ? BLOCK_HEX[item.cell.c] : BLOCK_HEX.stone;
        window.setTimeout(() => {
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          this.fx.burst("sparkle", x, y, { count: 4, color: ["#ffffff", color], speed: 200, size: 5 });
          this.fx.burst("debris", x, y, { count: 3, color, speed: 300, size: box.width * 0.15 });
        }, delay + 110);
      }
      this.layer.appendChild(batch);
    }

    // Big moments: a flash over the board, a shockwave per cleared line,
    // fireworks for multi-line clears, and a glow around the screen.
    const lines = e.rows.length + e.cols.length;
    if (e.cleared.length && !reduce) {
      const tint = e.landed[0] ? this.colorAt(e.cleared) : "#ffffff";
      this.flash(gridBox, lines >= 2 || e.special ? 0.75 : 0.45, e.special === "bomb" ? "#ffb04a" : e.special === "rocket" ? "#9af7ff" : "#ffffff");
      for (const r of e.rows) this.fx.ring(gridBox.left + gridBox.width / 2, gridBox.top + (r + 0.5) * cell, { color: tint, from: cell * 0.4, to: gridBox.width * 0.7, ms: 650, width: 9 });
      for (const c of e.cols) this.fx.ring(gridBox.left + (c + 0.5) * cell, gridBox.top + gridBox.height / 2, { color: tint, from: cell * 0.4, to: gridBox.width * 0.7, ms: 650, width: 9 });
      if (lines >= 2 || e.perfect) {
        const shots = Math.min(5, lines + (e.perfect ? 2 : 0));
        for (let i = 0; i < shots; i++) {
          window.setTimeout(() => this.firework(gridBox.left + gridBox.width * (0.15 + Math.random() * 0.7), gridBox.top + gridBox.height * (0.1 + Math.random() * 0.5)), 120 + i * 170);
        }
        this.screenGlow(lines >= 3 || e.perfect ? "#ffd257" : "#9af7ff");
      }
    }

    if (e.cleared.length) {
      // The match moment: one rising note per block, in step with the pops.
      if (e.special === "blast") audio.sfxBlast();
      else if (e.special === "bomb") audio.sfxBomb();
      else if (e.special === "rocket") audio.sfxRocket();
      audio.feelClear(delays, Math.max(1, e.rows.length + e.cols.length), e.combo);
    }
    // Special blocks: a bright beam along an arrow's line, a ring for a bomb.
    for (const f of e.fired ?? []) {
      const b = boxOf(f.r, f.c);
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      if (f.sp === "rocketV" || f.sp === "rocketH") {
        const vertical = f.sp === "rocketV";
        this.beam(gridBox, vertical ? "col" : "row", vertical ? f.c : f.r, cell, reduce);
        if (!reduce) {
          // Sparks shoot both ways along the zap.
          for (let i = 0; i < 8; i++) {
            const t = (i + 0.5) / 8;
            const x = vertical ? cx : gridBox.left + gridBox.width * t;
            const y = vertical ? gridBox.top + gridBox.height * t : cy;
            window.setTimeout(() => this.fx.burst("sparkle", x, y, { count: 5, color: ["#ffffff", "#9af7ff", "#4f8bff"], speed: 260, size: 5 }), Math.abs(t - (vertical ? (f.r + 0.5) / 8 : (f.c + 0.5) / 8)) * 260);
          }
          this.fx.ring(cx, cy, { color: "#9af7ff", from: cell * 0.3, to: cell * 2.4, ms: 500, width: 8 });
        }
      } else if (f.sp === "bomb") {
        this.fx.ring(cx, cy, { color: "#ffb04a", from: cell * 0.3, to: cell * 3.4, ms: 560, width: 12 });
        if (!reduce) {
          window.setTimeout(() => this.fx.ring(cx, cy, { color: "#ff5d3c", from: cell * 0.2, to: cell * 2.4, ms: 480, width: 8 }), 90);
          this.fx.burst("sparkle", cx, cy, { count: 30, color: ["#fff3c4", "#ffd27a", "#ff7a3c"], speed: 420, size: 6 });
          this.fx.burst("debris", cx, cy, { count: 14, color: ["#3a2448", "#ff9a3c"], speed: 380, size: cell * 0.16 });
          this.screenGlow("#ff8a3a");
        }
      } else if (f.sp === "blast") {
        if (!reduce) {
          ["#ff5f9e", "#ffc93c", "#6fe05a", "#5fd2ff", "#c26bff"].forEach((col, i) =>
            window.setTimeout(() => this.fx.ring(cx, cy, { color: col, from: cell * 0.3, to: gridBox.width * 1.1, ms: 700, width: 10 }), i * 90),
          );
          for (let i = 0; i < 5; i++) window.setTimeout(() => this.firework(gridBox.left + gridBox.width * Math.random(), gridBox.top + gridBox.height * Math.random() * 0.7), 150 + i * 140);
          this.flash(gridBox, 1, "#ffffff");
          this.screenGlow("#ffd257");
        }
      }
    }
    if (e.caption) this.caption(gridBox, e.caption, reduce);
    if (e.gained > 0 && e.cleared.length) this.scorePop(originX, originY, e.gained, reduce);
    const word = e.praise ?? (e.cleared.length && e.placedCells > 0 ? MINI_PRAISE[miniIdx++ % MINI_PRAISE.length]! : null);
    if (word) this.praise(gridBox, word, e.perfect, reduce, !e.praise);
    if (e.praise) {
      const tier = PRAISE_TIER[e.praise] ?? 1;
      if (e.perfect) audio.feelPerfect();
      else audio.feelPraise(tier);
      if (e.perfect || tier >= 2) cheer(e.praise, { delayMs: 250, priority: e.perfect });
    }
    if (e.combo >= 2) {
      this.comboBadge(gridBox, e.combo, reduce);
      if (!reduce) this.screenGlow(e.combo >= 4 ? "#ff6a3c" : "#ffb04a");
      audio.feelCombo(e.combo);
      if (e.combo >= 3 && !(e.praise && (PRAISE_TIER[e.praise] ?? 1) >= 2)) cheer(`Combo ${e.combo}!`, { delayMs: 350 });
    }
    if (e.comboWarning) audio.feelComboWarning();
    if (e.milestone) {
      const text = e.milestone === "almost" ? "Almost there!" : "Halfway there!";
      this.banner(gridBox, text, "is-milestone", reduce);
      audio.feelMilestone();
      if (e.milestone === "almost") cheer(text, { delayMs: 500 });
    }
    if (e.newBest) {
      this.banner(gridBox, "New best score!", "is-best", reduce);
      audio.feelNewBest();
      cheer("New best score!", { delayMs: 400, priority: true });
    }
    if (e.perfect) {
      for (let i = 0; i < 3; i++) {
        window.setTimeout(() => this.fx.burst("confetti", gridBox.left + gridBox.width * (0.2 + 0.3 * i), gridBox.top + gridBox.height * 0.4, { count: 22, speed: 380 }), i * 120);
      }
    }
    if (e.shake && !reduce) {
      const k = e.perfect || e.special === "blast" ? 12 : lines >= 3 || e.special === "bomb" ? 9 : 6;
      this.frame.animate(
        [
          { translate: "0 0" },
          { translate: `${-k}px ${k * 0.4}px` },
          { translate: `${k}px ${-k * 0.4}px` },
          { translate: `${-k * 0.6}px 0` },
          { translate: `${k * 0.4}px ${k * 0.2}px` },
          { translate: "0 0" },
        ],
        { duration: 320, easing: "ease-out" },
      );
    }
  }

  /** The most common color among cleared blocks, for the shockwave tint. */
  private colorAt(cleared: BoardFx["cleared"]): string {
    const n: Record<string, number> = {};
    for (const { cell } of cleared) if (cell.t === "b" || cell.t === "s") n[cell.c] = (n[cell.c] ?? 0) + 1;
    const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0]?.[0] as ColorId | undefined;
    return top ? BLOCK_HEX[top] : "#ffffff";
  }

  /** A bright flash over the whole board. */
  private flash(grid: DOMRect, strength: number, color: string): void {
    const el = document.createElement("div");
    el.className = "pj-board-flash";
    el.style.left = `${grid.left - grid.width * 0.1}px`;
    el.style.top = `${grid.top - grid.height * 0.1}px`;
    el.style.width = `${grid.width * 1.2}px`;
    el.style.height = `${grid.height * 1.2}px`;
    el.style.setProperty("--flash", color);
    this.layer.appendChild(el);
    el.animate([{ opacity: 0 }, { opacity: strength, offset: 0.15 }, { opacity: 0 }], { duration: 420, easing: "ease-out" }).finished.then(
      () => el.remove(),
      () => el.remove(),
    );
  }

  /** A colored glow around the edges of the whole screen. */
  private screenGlow(color: string): void {
    const el = document.createElement("div");
    el.className = "pj-screen-glow";
    el.style.setProperty("--glow", color);
    this.layer.appendChild(el);
    el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: 900, easing: "ease-out" }).finished.then(
      () => el.remove(),
      () => el.remove(),
    );
  }

  /** One firework: a ring plus a shower of colored sparks. */
  private firework(x: number, y: number): void {
    const palette = [["#ff5f9e", "#ffd1e6"], ["#ffc93c", "#fff3c4"], ["#5fd2ff", "#e0f9ff"], ["#6fe05a", "#dcffd4"], ["#c26bff", "#f0deff"]];
    const pair = palette[Math.floor(Math.random() * palette.length)]!;
    this.fx.ring(x, y, { color: pair[0], from: 4, to: 70, ms: 520, width: 4 });
    this.fx.burst("sparkle", x, y, { count: 26, color: [...pair, "#ffffff"], speed: 360, size: 5 });
    this.fx.burst("confetti", x, y, { count: 10, speed: 300 });
    audio.feelStar(Math.floor(Math.random() * 3));
  }

  /** A bright bar that sweeps along a cleared row or column. */
  private sweep(grid: DOMRect, kind: "row" | "col", i: number, cell: number, reduce: boolean): void {
    const bar = document.createElement("div");
    bar.className = "pj-sweep";
    if (kind === "row") {
      bar.style.left = `${grid.left}px`;
      bar.style.top = `${grid.top + i * cell}px`;
      bar.style.width = `${grid.width}px`;
      bar.style.height = `${cell}px`;
    } else {
      bar.style.left = `${grid.left + i * cell}px`;
      bar.style.top = `${grid.top}px`;
      bar.style.width = `${cell}px`;
      bar.style.height = `${grid.height}px`;
    }
    this.layer.appendChild(bar);
    const axis = kind === "row" ? "scaleX" : "scaleY";
    bar.animate(
      [
        { transform: `${axis}(0.1)`, opacity: 0 },
        { transform: `${axis}(1)`, opacity: 1, offset: 0.4 },
        { transform: `${axis}(1)`, opacity: 0 },
      ],
      { duration: reduce ? 160 : 380, easing: "ease-out" },
    ).finished.then(() => bar.remove(), () => bar.remove());
  }

  private scorePop(x: number, y: number, gained: number, reduce: boolean): void {
    const el = document.createElement("div");
    el.className = "pj-score-pop";
    el.textContent = `+${gained.toLocaleString("en-US")}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.layer.appendChild(el);
    el.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
        { transform: "translate(-50%, -90%) scale(1.15)", opacity: 1, offset: 0.25 },
        { transform: "translate(-50%, -180%) scale(1)", opacity: 0 },
      ],
      { duration: reduce ? 500 : 900, easing: "ease-out" },
    ).finished.then(() => el.remove(), () => el.remove());
  }

  private lastTrail = 0;

  /** A faint sparkle trail behind a dragged piece (throttled). */
  trail(x: number, y: number, color: keyof typeof BLOCK_HEX): void {
    const now = performance.now();
    if (now - this.lastTrail < 45 || reducedMotion()) return;
    this.lastTrail = now;
    this.fx.burst("sparkle", x + (Math.random() - 0.5) * 24, y + (Math.random() - 0.5) * 24, { count: 1, color: ["#ffffff", BLOCK_HEX[color]], speed: 30, size: 3 });
  }

  /** A glowing beam along an arrow block's row or column. */
  private beam(grid: DOMRect, kind: "row" | "col", i: number, cell: number, reduce: boolean): void {
    const bar = document.createElement("div");
    bar.className = `pj-beam is-${kind}`;
    if (kind === "row") {
      bar.style.left = `${grid.left}px`;
      bar.style.top = `${grid.top + i * cell + cell * 0.3}px`;
      bar.style.width = `${grid.width}px`;
      bar.style.height = `${cell * 0.4}px`;
    } else {
      bar.style.left = `${grid.left + i * cell + cell * 0.3}px`;
      bar.style.top = `${grid.top}px`;
      bar.style.width = `${cell * 0.4}px`;
      bar.style.height = `${grid.height}px`;
    }
    this.layer.appendChild(bar);
    const axis = kind === "row" ? "scaleX" : "scaleY";
    bar.animate(
      [
        { transform: `${axis}(0)`, opacity: 1 },
        { transform: `${axis}(1)`, opacity: 1, offset: 0.35 },
        { transform: `${axis}(1) scale(1.4)`, opacity: 0 },
      ],
      { duration: reduce ? 200 : 520, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" },
    ).finished.then(() => bar.remove(), () => bar.remove());
  }

  /** A soft glow ring under the blocks that just landed. */
  private landRing(cells: Array<{ r: number; c: number }>, boxOf: (r: number, c: number) => { left: number; top: number; width: number; height: number }): void {
    if (!cells.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const { r, c } of cells) {
      const b = boxOf(r, c);
      x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top);
      x1 = Math.max(x1, b.left + b.width); y1 = Math.max(y1, b.top + b.height);
    }
    const el = document.createElement("div");
    el.className = "pj-land-ring";
    el.style.left = `${x0}px`;
    el.style.top = `${y0}px`;
    el.style.width = `${x1 - x0}px`;
    el.style.height = `${y1 - y0}px`;
    this.layer.appendChild(el);
    el.animate(
      [
        { transform: "scale(0.92)", opacity: 0.9 },
        { transform: "scale(1.18)", opacity: 0 },
      ],
      { duration: 420, easing: "ease-out" },
    ).finished.then(() => el.remove(), () => el.remove());
  }

  /** A plain-words explanation under the board. */
  private caption(grid: DOMRect, text: string, reduce: boolean): void {
    this.layer.querySelectorAll(".pj-fx-caption").forEach((n) => n.remove());
    const el = document.createElement("div");
    el.className = "pj-fx-caption";
    el.textContent = text;
    el.style.left = `${grid.left + grid.width / 2}px`;
    el.style.top = `${grid.top + grid.height * 0.86}px`;
    this.layer.appendChild(el);
    el.animate(
      [
        { transform: "translate(-50%, -30%)", opacity: 0 },
        { transform: "translate(-50%, -50%)", opacity: 1, offset: 0.08 },
        { transform: "translate(-50%, -50%)", opacity: 1, offset: 0.88 },
        { transform: "translate(-50%, -50%)", opacity: 0 },
      ],
      { duration: reduce ? 2600 : 3200, delay: 250, easing: "ease-out", fill: "both" },
    ).finished.then(() => el.remove(), () => el.remove());
  }

  /** A ribbon across the top of the board (milestones, new best). */
  private banner(grid: DOMRect, text: string, kind: string, reduce: boolean): void {
    const el = document.createElement("div");
    el.className = `pj-banner ${kind}`;
    el.textContent = text;
    el.style.left = `${grid.left + grid.width / 2}px`;
    el.style.top = `${grid.top + grid.height * 0.16}px`;
    this.layer.appendChild(el);
    el.animate(
      [
        { transform: "translate(-50%, -50%) scaleX(0.2)", opacity: 0 },
        { transform: "translate(-50%, -50%) scaleX(1.06)", opacity: 1, offset: 0.15 },
        { transform: "translate(-50%, -50%) scaleX(1)", opacity: 1, offset: 0.25 },
        { transform: "translate(-50%, -50%) scaleX(1)", opacity: 1, offset: 0.85 },
        { transform: "translate(-50%, -80%) scaleX(1)", opacity: 0 },
      ],
      { duration: reduce ? 1000 : 1800, delay: 350, easing: "ease-out", fill: "both" },
    ).finished.then(() => el.remove(), () => el.remove());
  }

  private praise(grid: DOMRect, text: string, perfect: boolean, reduce: boolean, mini = false): void {
    if (!mini && !reduce) {
      const rays = document.createElement("div");
      rays.className = `pj-praise-rays${perfect ? " is-perfect" : ""}`;
      rays.style.left = `${grid.left + grid.width / 2}px`;
      rays.style.top = `${grid.top + grid.height * 0.42}px`;
      this.layer.appendChild(rays);
      rays.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.2) rotate(0deg)", opacity: 0 },
          { transform: "translate(-50%, -50%) scale(1) rotate(40deg)", opacity: 0.9, offset: 0.3 },
          { transform: "translate(-50%, -50%) scale(1.15) rotate(110deg)", opacity: 0 },
        ],
        { duration: perfect ? 1600 : 1200, easing: "ease-out" },
      ).finished.then(() => rays.remove(), () => rays.remove());
    }
    const el = document.createElement("div");
    el.className = `pj-praise ${perfect ? "is-perfect" : ""} ${mini ? "is-mini" : ""}`;
    el.textContent = text;
    el.style.left = `${grid.left + grid.width / 2}px`;
    el.style.top = `${grid.top + grid.height * 0.42}px`;
    this.layer.appendChild(el);
    el.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.3) rotate(-8deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.18) rotate(2deg)", opacity: 1, offset: 0.22 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1, offset: 0.4 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.78 },
        { transform: "translate(-50%, -70%) scale(0.92)", opacity: 0 },
      ],
      { duration: reduce ? 700 : perfect ? 1500 : 1100, easing: "ease-out" },
    ).finished.then(() => el.remove(), () => el.remove());
  }

  private comboBadge(grid: DOMRect, combo: number, reduce: boolean): void {
    const el = document.createElement("div");
    el.className = "pj-combo-badge";
    el.innerHTML = `<span>Combo</span><strong>${combo}</strong>`;
    el.style.left = `${grid.left + grid.width / 2}px`;
    el.style.top = `${grid.top + grid.height * 0.6}px`;
    this.layer.appendChild(el);
    el.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.4)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.12)", opacity: 1, offset: 0.25 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.75 },
        { transform: "translate(-50%, -40%) scale(0.95)", opacity: 0 },
      ],
      { duration: reduce ? 600 : 1000, delay: 120, easing: "ease-out", fill: "both" },
    ).finished.then(() => el.remove(), () => el.remove());
  }
}
