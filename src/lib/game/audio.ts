type Bus = { ctx: AudioContext; master: GainNode; sfx: GainNode; music: GainNode; room: GainNode };

let bus: Bus | null = null;
let musicTimer: number | null = null;
let track: HTMLAudioElement | null = null;
let unlocked = false;
let wantMusic = true;

/**
 * Audio graph: sfx → master → limiter → speakers, plus a soft reverb "room"
 * send so chimes and mallets ring out instead of sounding dry and cheap.
 */
function ensure(): Bus | null {
  if (typeof window === "undefined") return null;
  if (bus) return bus;
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx({ latencyHint: "interactive" });
  const master = ctx.createGain();
  const sfx = ctx.createGain();
  const music = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 8;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.18;
  sfx.gain.value = 0.78;
  music.gain.value = 0.22;
  master.gain.value = 0.9;
  // Reverb: a generated 1.4 s stereo tail.
  const room = ctx.createGain();
  room.gain.value = 0.28;
  const verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 1.4);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  verb.buffer = ir;
  room.connect(verb);
  verb.connect(master);
  sfx.connect(master);
  music.connect(master);
  master.connect(limiter);
  limiter.connect(ctx.destination);
  bus = { ctx, master, sfx, music, room };
  return bus;
}

/** Noise bursts are generated once per length and reused. */
const noiseCache = new Map<number, AudioBuffer>();
function noiseBuffer(ctx: AudioContext, dur: number): AudioBuffer {
  const key = Math.round(dur * 1000);
  let buf = noiseCache.get(key);
  if (!buf) {
    const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    noiseCache.set(key, buf);
  }
  return buf;
}

function noise(dur: number, gain: number, dest: GainNode, when = 0, hp = 400): void {
  const b = bus;
  if (!b || !unlocked) return;
  const buf = noiseBuffer(b.ctx, dur);
  const src = b.ctx.createBufferSource();
  const g = b.ctx.createGain();
  const f = b.ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = hp;
  src.buffer = buf;
  const t0 = b.ctx.currentTime + when;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
  src.onended = () => {
    src.disconnect();
    f.disconnect();
    g.disconnect();
  };
}

export function unlockAudio(): void {
  const b = ensure();
  if (!b) return;
  if (b.ctx.state === "suspended") void b.ctx.resume();
  unlocked = true;
  if (wantMusic) startMusic();
}

export function setMuted(sfxOn: boolean, musicOn: boolean): void {
  const b = ensure();
  if (!b) return;
  wantMusic = musicOn;
  b.sfx.gain.setTargetAtTime(sfxOn ? 0.78 : 0, b.ctx.currentTime, 0.04);
  b.music.gain.setTargetAtTime(musicOn ? 0.22 : 0, b.ctx.currentTime, 0.08);
  if (musicOn) startMusic();
  else stopMusic();
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  dest: GainNode,
  when = 0,
  slide?: number,
): void {
  const b = bus;
  if (!b || !unlocked) return;
  const t0 = b.ctx.currentTime + when;
  const osc = b.ctx.createOscillator();
  const g = b.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function chime(notes: number[], spacing = 0.045, gain = 0.085): void {
  const b = ensure();
  if (!b) return;
  notes.forEach((freq, i) => {
    const at = i * spacing;
    tone(freq, 0.18 + i * 0.018, "sine", gain, b.sfx, at);
    tone(freq * 2, 0.1, "triangle", gain * 0.28, b.sfx, at + 0.012);
  });
}

export function sfxClick(): void {
  const b = ensure();
  if (!b) return;
  tone(760 + Math.random() * 55, 0.055, "sine", 0.075, b.sfx);
  tone(1160 + Math.random() * 45, 0.04, "triangle", 0.025, b.sfx, 0.012);
}

export function sfxPlace(): void {
  const b = ensure();
  if (!b) return;
  noise(0.055, 0.08, b.sfx, 0, 1200);
  tone(250 + Math.random() * 24, 0.13, "sine", 0.13, b.sfx, 0, 165);
  tone(620, 0.095, "triangle", 0.075, b.sfx, 0.018, 740);
  tone(930, 0.12, "sine", 0.035, b.sfx, 0.05);
}

export function sfxClear(combo: number): void {
  const b = ensure();
  if (!b) return;
  const base = 523 + Math.min(combo, 8) * 32;
  tone(base, 0.14, "triangle", 0.18, b.sfx);
  tone(base * 1.26, 0.16, "sine", 0.12, b.sfx, 0.04);
  tone(base * 1.5, 0.2, "sine", 0.09, b.sfx, 0.08);
  chime([base * 2, base * 2.5, base * 3], 0.052, 0.042 + Math.min(combo, 6) * 0.005);
}

export function sfxBomb(): void {
  const b = ensure();
  if (!b) return;
  noise(0.28, 0.32, b.sfx, 0, 280);
  tone(90, 0.32, "sine", 0.28, b.sfx, 0, 46);
  tone(180, 0.18, "triangle", 0.1, b.sfx, 0.04, 70);
  chime([294, 440, 587], 0.06, 0.035);
}

export function sfxRocket(): void {
  const b = ensure();
  if (!b) return;
  tone(280, 0.22, "sawtooth", 0.1, b.sfx, 0, 720);
  tone(420, 0.18, "triangle", 0.08, b.sfx, 0.04, 980);
  noise(0.16, 0.12, b.sfx, 0.02, 1800);
  chime([659, 880, 1175], 0.045, 0.038);
}

export function sfxBlast(): void {
  const b = ensure();
  if (!b) return;
  sfxBomb();
  tone(392, 0.22, "triangle", 0.12, b.sfx, 0.08);
  tone(523, 0.24, "sine", 0.1, b.sfx, 0.14);
  tone(784, 0.28, "sine", 0.08, b.sfx, 0.2);
}

export function sfxBad(): void {
  const b = ensure();
  if (!b) return;
  tone(180, 0.12, "square", 0.07, b.sfx, 0, 110);
}

export function sfxWin(): void {
  const b = ensure();
  if (!b) return;
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, "triangle", 0.16, b.sfx, i * 0.08));
  chime([1046, 1318, 1568, 2093], 0.075, 0.055);
}

export function sfxOver(): void {
  const b = ensure();
  if (!b) return;
  tone(320, 0.28, "sawtooth", 0.1, b.sfx, 0, 140);
  tone(220, 0.4, "triangle", 0.12, b.sfx, 0.08, 90);
}

export function sfxCoin(): void {
  const b = ensure();
  if (!b) return;
  tone(880, 0.08, "square", 0.08, b.sfx);
  tone(1320, 0.12, "square", 0.07, b.sfx, 0.05);
  tone(1760, 0.16, "sine", 0.045, b.sfx, 0.09);
}

export function sfxUi(): void {
  const b = ensure();
  if (!b) return;
  tone(700 + Math.random() * 40, 0.07, "sine", 0.065, b.sfx);
  tone(1050, 0.065, "triangle", 0.022, b.sfx, 0.018);
}

function ensureTrack(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (track) return track;
  // Ogg where it plays (smaller); MP3 everywhere else (older iOS Safari has no Ogg).
  const probe = document.createElement("audio");
  const ogg = probe.canPlayType('audio/ogg; codecs="vorbis"') !== "";
  const el = new Audio(ogg ? "/music/island-small.ogg" : "/music/island.mp3");
  el.loop = true;
  el.preload = "auto";
  el.volume = 0.34;
  track = el;
  return el;
}

function startMusic(): void {
  if (!unlocked || !wantMusic) return;
  const el = ensureTrack();
  if (el) {
    el.volume = 0.34;
    const play = el.play();
    if (play && typeof play.catch === "function") play.catch(() => startFallbackMusic());
    stopFallbackMusic();
    return;
  }
  startFallbackMusic();
}

function stopMusic(): void {
  if (track) {
    track.pause();
    track.currentTime = 0;
  }
  stopFallbackMusic();
}

function startFallbackMusic(): void {
  const b = ensure();
  if (!b || musicTimer !== null) return;
  const notes = [196, 247, 294, 330, 392, 330, 294, 247];
  let i = 0;
  const tick = () => {
    if (!bus || !wantMusic) return;
    const n = notes[i % notes.length]!;
    tone(n, 0.55, "sine", 0.06, bus.music);
    tone(n * 2, 0.4, "triangle", 0.025, bus.music, 0.05);
    i++;
    musicTimer = window.setTimeout(tick, 900);
  };
  tick();
}

function stopFallbackMusic(): void {
  if (musicTimer !== null) {
    window.clearTimeout(musicTimer);
    musicTimer = null;
  }
}

export function sfxVisitorWarn(): void {
  const b = ensure();
  if (!b) return;
  chime([392, 494, 587], 0.07, 0.05);
  noise(0.12, 0.06, b.sfx, 0.02, 900);
}

export function sfxVisitor(id: "milo" | "luna" | "kai" | "nia" | "pip"): void {
  const b = ensure();
  if (!b) return;
  if (id === "milo") {
    tone(420, 0.09, "triangle", 0.09, b.sfx, 0, 520);
    tone(640, 0.1, "sine", 0.07, b.sfx, 0.08, 780);
    noise(0.08, 0.05, b.sfx, 0.04, 1400);
  } else if (id === "luna") {
    chime([523, 659, 784, 988], 0.08, 0.055);
    tone(1175, 0.22, "sine", 0.04, b.sfx, 0.12);
  } else if (id === "kai") {
    noise(0.1, 0.16, b.sfx, 0, 700);
    tone(160, 0.12, "triangle", 0.12, b.sfx, 0, 90);
    tone(240, 0.08, "sine", 0.06, b.sfx, 0.08);
  } else if (id === "nia") {
    chime([349, 440, 523], 0.09, 0.05);
    tone(294, 0.16, "triangle", 0.05, b.sfx, 0.04);
  } else {
    tone(880, 0.07, "sine", 0.07, b.sfx);
    tone(1320, 0.09, "triangle", 0.05, b.sfx, 0.06);
    tone(1760, 0.08, "sine", 0.035, b.sfx, 0.12);
  }
}

export function sfxVisitorAct(id: "milo" | "luna" | "kai" | "nia" | "pip"): void {
  const b = ensure();
  if (!b) return;
  if (id === "milo") {
    noise(0.06, 0.07, b.sfx, 0, 1100);
    tone(300, 0.1, "sine", 0.08, b.sfx, 0, 220);
  } else if (id === "luna") {
    chime([784, 988, 1175], 0.05, 0.05);
  } else if (id === "kai") {
    noise(0.16, 0.2, b.sfx, 0, 500);
    tone(110, 0.18, "sine", 0.14, b.sfx, 0, 55);
  } else if (id === "nia") {
    tone(520, 0.12, "triangle", 0.07, b.sfx);
    tone(640, 0.12, "sine", 0.05, b.sfx, 0.08);
  } else {
    chime([659, 784, 988], 0.045, 0.048);
  }
}

export function bindAudioLifecycle(): () => void {
  const onVis = () => {
    if (document.visibilityState === "visible") {
      const b = ensure();
      if (b && b.ctx.state === "suspended") void b.ctx.resume();
      if (wantMusic && unlocked) void track?.play().catch(() => undefined);
    } else {
      track?.pause();
    }
  };
  document.addEventListener("visibilitychange", onVis);
  return () => document.removeEventListener("visibilitychange", onVis);
}

/* ------------------------------------------------------------------------
   "Feel" sounds: the reward layer. Everything positive is tuned to one
   major-pentatonic scale, so any notes that overlap still sound good
   together, and climbing that scale is what makes streaks feel like they
   are building.
   ------------------------------------------------------------------------ */

/** C major pentatonic from C5 upward, three octaves. */
const SCALE = (() => {
  const steps = [0, 2, 4, 7, 9];
  const out: number[] = [];
  for (let o = 0; o < 3; o++) for (const s of steps) out.push(523.25 * Math.pow(2, (s + 12 * o) / 12));
  return out;
})();

function note(i: number): number {
  return SCALE[Math.max(0, Math.min(SCALE.length - 1, i))]!;
}

/** Marimba-like mallet: warm fundamental, bright 4th harmonic, soft knock. */
function mallet(freq: number, when: number, gain = 0.16, dur = 0.5): void {
  const b = bus;
  if (!b || !unlocked) return;
  const t0 = b.ctx.currentTime + when;
  const out = b.ctx.createGain();
  out.gain.value = 1;
  out.connect(b.sfx);
  const send = b.ctx.createGain();
  send.gain.value = 0.5;
  out.connect(send);
  send.connect(b.room);
  const partial = (mult: number, g: number, d: number) => {
    const o = b.ctx.createOscillator();
    const e = b.ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq * mult;
    e.gain.setValueAtTime(0.0001, t0);
    e.gain.exponentialRampToValueAtTime(g, t0 + 0.006);
    e.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(e);
    e.connect(out);
    o.start(t0);
    o.stop(t0 + d + 0.02);
    o.onended = () => {
      o.disconnect();
      e.disconnect();
    };
  };
  partial(1, gain, dur);
  partial(4, gain * 0.32, dur * 0.28);
  window.setTimeout(() => {
    out.disconnect();
    send.disconnect();
  }, (when + dur + 0.2) * 1000);
}

/** FM bell: a sparkly ring for rewards. */
function bell(freq: number, when: number, gain = 0.09, dur = 1.1): void {
  const b = bus;
  if (!b || !unlocked) return;
  const t0 = b.ctx.currentTime + when;
  const car = b.ctx.createOscillator();
  const mod = b.ctx.createOscillator();
  const modGain = b.ctx.createGain();
  const amp = b.ctx.createGain();
  const send = b.ctx.createGain();
  car.frequency.value = freq;
  mod.frequency.value = freq * 3.5;
  modGain.gain.setValueAtTime(freq * 2.2, t0);
  modGain.gain.exponentialRampToValueAtTime(freq * 0.05, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  send.gain.value = 0.8;
  mod.connect(modGain);
  modGain.connect(car.frequency);
  car.connect(amp);
  amp.connect(b.sfx);
  amp.connect(send);
  send.connect(b.room);
  car.start(t0);
  mod.start(t0);
  car.stop(t0 + dur + 0.05);
  mod.stop(t0 + dur + 0.05);
  car.onended = () => {
    car.disconnect();
    mod.disconnect();
    modGain.disconnect();
    amp.disconnect();
    send.disconnect();
  };
}

/** Wooden "thock": the tactile sound of a block landing. */
function thock(pitch: number, when: number, gain = 0.22): void {
  const b = bus;
  if (!b || !unlocked) return;
  const t0 = b.ctx.currentTime + when;
  const src = b.ctx.createBufferSource();
  src.buffer = noiseBuffer(b.ctx, 0.05);
  const bp = b.ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = pitch * 6;
  bp.Q.value = 3;
  const ng = b.ctx.createGain();
  ng.gain.setValueAtTime(gain * 0.9, t0);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
  src.connect(bp);
  bp.connect(ng);
  ng.connect(b.sfx);
  src.start(t0);
  src.stop(t0 + 0.06);
  const o = b.ctx.createOscillator();
  const og = b.ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(pitch * 1.6, t0);
  o.frequency.exponentialRampToValueAtTime(pitch, t0 + 0.05);
  og.gain.setValueAtTime(0.0001, t0);
  og.gain.exponentialRampToValueAtTime(gain, t0 + 0.004);
  og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13);
  o.connect(og);
  og.connect(b.sfx);
  o.start(t0);
  o.stop(t0 + 0.15);
  o.onended = () => {
    o.disconnect();
    og.disconnect();
    src.disconnect();
    bp.disconnect();
    ng.disconnect();
  };
}

function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* not supported */
  }
}

/** Picking up a piece: a soft pop. */
export function feelPickup(): void {
  if (!ensure()) return;
  mallet(note(4), 0, 0.09, 0.18);
  vibrate(6);
}

/** The dragged piece snapped to a new cell: a tiny tactile tick. */
export function feelSnap(row: number): void {
  if (!ensure()) return;
  mallet(note(10 + (7 - Math.max(0, Math.min(7, row))) % 5), 0, 0.022, 0.05);
}

/** The piece is over a spot that would clear lines: an inviting shimmer. */
export function feelWouldClear(lines: number): void {
  if (!ensure()) return;
  bell(note(7 + Math.min(lines, 4)), 0, 0.03, 0.5);
}

/** A piece lands. Bigger pieces land a little deeper. */
export function feelPlace(cells: number): void {
  if (!ensure()) return;
  thock(cells >= 5 ? 150 : cells >= 3 ? 175 : 205, 0, 0.2);
  mallet(note(0), 0.01, 0.06, 0.25);
  vibrate(10);
}

/** Drop that didn't fit: a gentle, muted bump (not a harsh buzzer). */
export function feelNope(): void {
  if (!ensure()) return;
  thock(120, 0, 0.12);
  mallet(note(0) / 2, 0.02, 0.05, 0.16);
}

/**
 * The match moment. One mallet note per cleared block, in the order the
 * blocks pop, climbing the scale; each combo level starts the run higher.
 * `delays` are the per-block pop delays in ms from the effects layer.
 */
export function feelClear(delays: number[], lines: number, combo: number): void {
  if (!ensure()) return;
  const sorted = [...delays].sort((a, b) => a - b);
  const start = Math.min(6, Math.max(0, combo - 1));
  const step = Math.max(1, Math.ceil(sorted.length / 9));
  let k = 0;
  for (let i = 0; i < sorted.length; i += step) {
    mallet(note(start + k), 0.06 + sorted[i]! / 1000, 0.1, 0.45);
    k++;
  }
  const end = 0.08 + (sorted.at(-1) ?? 0) / 1000;
  // Resolve on a chord; more lines = fuller chord.
  const top = start + k;
  bell(note(top), end, 0.08);
  if (lines >= 2) bell(note(top + 2), end + 0.03, 0.06);
  if (lines >= 3) bell(note(top + 4), end + 0.06, 0.05);
  vibrate(lines >= 2 ? [14, 30, 18] : 16);
}

/** Combo stinger: a quick rising run that gets longer with the streak. */
export function feelCombo(combo: number): void {
  if (!ensure()) return;
  const n = Math.min(2 + combo, 7);
  const base = Math.min(combo + 2, 8);
  for (let i = 0; i < n; i++) bell(note(base + i), 0.45 + i * 0.055, 0.05, 0.6);
}

/** Praise jingle, escalating with the size of the clear. */
export function feelPraise(tier: number): void {
  if (!ensure()) return;
  const runs = [
    [5, 7],
    [5, 7, 9],
    [5, 7, 9, 10],
    [5, 7, 9, 10, 12],
    [5, 7, 9, 10, 12, 14],
  ];
  const run = runs[Math.max(0, Math.min(runs.length - 1, tier - 1))]!;
  run.forEach((n, i) => bell(note(n), 0.32 + i * 0.07, 0.07, 0.9));
}

/** Perfect clear: a full fanfare with sparkle on top. */
export function feelPerfect(): void {
  if (!ensure()) return;
  [0, 2, 4, 5, 7, 9].forEach((n, i) => mallet(note(n), 0.3 + i * 0.07, 0.12, 0.6));
  [10, 12, 14].forEach((n, i) => bell(note(n), 0.75 + i * 0.09, 0.08, 1.4));
  vibrate([20, 40, 20, 40, 40]);
}

/** "Last move to keep your combo" — a quiet heartbeat tick. */
export function feelComboWarning(): void {
  if (!ensure()) return;
  mallet(note(2) / 2, 0, 0.05, 0.12);
  mallet(note(2) / 2, 0.16, 0.035, 0.12);
}

/** Goal milestone (halfway / almost there). */
export function feelMilestone(): void {
  if (!ensure()) return;
  [3, 5, 8].forEach((n, i) => bell(note(n), i * 0.08, 0.05, 0.8));
}

/** Beat your best score mid-run. */
export function feelNewBest(): void {
  if (!ensure()) return;
  [0, 4, 7, 12].forEach((n, i) => mallet(note(n + 2), i * 0.09, 0.12, 0.5));
  bell(note(14), 0.42, 0.08, 1.4);
}

/** One star landing on the results screen (i = 0, 1, 2). */
export function feelStar(i: number): void {
  if (!ensure()) return;
  bell(note(5 + i * 2), 0, 0.1, 1.2);
  mallet(note(5 + i * 2), 0, 0.08, 0.3);
  vibrate(12);
}

/** Score count-up tick, rising as the number climbs. */
export function feelTick(progress: number): void {
  if (!ensure()) return;
  mallet(note(5 + Math.round(progress * 8)), 0, 0.03, 0.06);
}

/** Level complete fanfare. */
export function feelLevelComplete(): void {
  if (!ensure()) return;
  const melody: Array<[number, number]> = [
    [0, 0],
    [2, 0.12],
    [4, 0.24],
    [7, 0.36],
    [5, 0.56],
    [7, 0.68],
    [10, 0.86],
  ];
  melody.forEach(([n, t]) => mallet(note(n), t, 0.13, 0.55));
  [10, 12, 14].forEach((n, i) => bell(note(n), 0.86 + i * 0.02, 0.06, 1.6));
  vibrate([20, 60, 20, 60, 50]);
}

/** Out of moves: warm and encouraging, not a failure buzzer. */
export function feelRoundOver(): void {
  if (!ensure()) return;
  [[7, 0], [5, 0.16], [4, 0.32], [5, 0.56]].forEach(([n, t]) => mallet(note(n!), t!, 0.1, 0.6));
  bell(note(7), 0.6, 0.05, 1.4);
}

/** Coins landing in the purse. */
export function feelCoins(n: number): void {
  if (!ensure()) return;
  for (let i = 0; i < Math.min(n, 6); i++) bell(note(10 + (i % 3)), i * 0.07, 0.035, 0.4);
}

/* ---------------------------------------------------- visitor themes */

const NOTE = (semis: number) => 392 * Math.pow(2, semis / 12); // G4 = 0

/** Bongo / drum hit: a pitched thump plus a short noise slap. */
function drum(pitch: number, when: number, gain = 0.2): void {
  const b = bus;
  if (!b || !unlocked) return;
  tone(pitch * 1.8, 0.16, "sine", gain, b.sfx, when, pitch);
  noise(0.05, gain * 0.35, b.sfx, when, 2200);
}

let duckTimer: number | null = null;
/** Lower the background music while a visitor's theme plays. */
function duckMusic(ms: number): void {
  const el = track;
  const b = bus;
  if (el && !el.paused) el.volume = 0.1;
  if (b) b.music.gain.setTargetAtTime(wantMusic ? 0.06 : 0, b.ctx.currentTime, 0.08);
  if (duckTimer !== null) window.clearTimeout(duckTimer);
  duckTimer = window.setTimeout(() => {
    duckTimer = null;
    if (track && wantMusic) track.volume = 0.34;
    if (bus) bus.music.gain.setTargetAtTime(wantMusic ? 0.22 : 0, bus.ctx.currentTime, 0.3);
  }, ms);
}

/**
 * Each Island Visitor has a short entrance theme (about 2–3 s) that plays
 * over the ducked background music, so you hear who's arriving.
 */
export function visitorTheme(id: "milo" | "luna" | "kai" | "nia" | "pip"): void {
  const b = ensure();
  if (!b || !unlocked) return;
  duckMusic(3200);
  if (id === "milo") {
    // Monkey: bongos and a bouncy marimba run, then an "ooh-ooh" slide.
    [0, 0.14, 0.28, 0.42].forEach((t, i) => drum(i % 2 ? 180 : 130, t, 0.18));
    [0, 2, 4, 7, 9, 12, 9, 12].forEach((s, i) => mallet(NOTE(s + 12), 0.5 + i * 0.1, 0.13, 0.35));
    tone(NOTE(12), 0.22, "sine", 0.08, b.sfx, 1.4, NOTE(19));
    tone(NOTE(12), 0.26, "sine", 0.08, b.sfx, 1.7, NOTE(21));
    drum(130, 1.75, 0.2);
  } else if (id === "luna") {
    // Magician: harp-like rising arpeggio, sparkles, then a "ta-da" chord.
    [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => bell(NOTE(s), i * 0.11, 0.06, 1.2));
    for (let i = 0; i < 10; i++) tone(NOTE(28 + (i % 3) * 3), 0.08, "sine", 0.025, b.sfx, 0.85 + i * 0.05);
    [12, 16, 19, 24].forEach((s) => bell(NOTE(s), 1.45, 0.07, 1.6));
  } else if (id === "kai") {
    // Builder: a march on low drums, an anvil clang, and a sturdy chord.
    [0, 0.3, 0.6, 0.75, 0.9].forEach((t) => drum(90, t, 0.24));
    [0.15, 0.45].forEach((t) => thock(320, t, 0.18));
    bell(NOTE(19), 1.15, 0.08, 0.9);
    noise(0.12, 0.12, b.sfx, 1.15, 3000);
    [-12, -5, 0, 4].forEach((s) => mallet(NOTE(s), 1.35, 0.12, 0.9));
  } else if (id === "nia") {
    // Explorer: an adventure horn call over a drum roll.
    for (let i = 0; i < 8; i++) drum(110, i * 0.06, 0.08 + i * 0.012);
    [
      [-5, 0.55, 0.22],
      [0, 0.8, 0.22],
      [7, 1.05, 0.5],
      [5, 1.6, 0.18],
      [7, 1.8, 0.6],
    ].forEach(([s, t, d]) => {
      tone(NOTE(s!), d!, "triangle", 0.09, b.sfx, t!);
      tone(NOTE(s! + 12), d!, "sine", 0.03, b.sfx, t!);
    });
    drum(140, 1.8, 0.2);
  } else {
    // Parrot: chirpy whistles and a quick high marimba flutter.
    [0, 0.12, 0.3].forEach((t, i) => tone(NOTE(24 + i * 2), 0.1, "sine", 0.07, b.sfx, t, NOTE(31 + i * 2)));
    [12, 16, 19, 16, 19, 24].forEach((s, i) => mallet(NOTE(s), 0.55 + i * 0.075, 0.11, 0.3));
    tone(NOTE(31), 0.16, "sine", 0.07, b.sfx, 1.15, NOTE(24));
    tone(NOTE(28), 0.12, "sine", 0.06, b.sfx, 1.35, NOTE(36));
  }
  vibrate([20, 40, 20]);
}
