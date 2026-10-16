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
      if (!reduce) this.landRing(e.landed, boxOf);
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
          this.fx.burst("sparkle", x, y, { count: 2, color: ["#ffffff", color], speed: 140, size: 4 });
          this.fx.burst("debris", x, y, { count: 2, color, speed: 220, size: box.width * 0.13 });
        }, delay + 110);
      }
      this.layer.appendChild(batch);
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
      if (f.sp === "rocketV") this.beam(gridBox, "col", f.c, cell, reduce);
      else if (f.sp === "rocketH") this.beam(gridBox, "row", f.r, cell, reduce);
      else if (f.sp === "bomb") {
        const b = boxOf(f.r, f.c);
        this.fx.ring(b.left + b.width / 2, b.top + b.height / 2, { color: "#ffb04a", from: cell * 0.3, to: cell * 1.8, ms: 450, width: 5 });
        this.fx.burst("sparkle", b.left + b.width / 2, b.top + b.height / 2, { count: 14, color: ["#ffd27a", "#ff7a3c"], speed: 260, size: 5 });
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
      const k = e.perfect ? 9 : 5;
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
