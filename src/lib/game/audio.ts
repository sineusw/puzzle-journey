type Bus = { ctx: AudioContext; master: GainNode; sfx: GainNode; music: GainNode };

let bus: Bus | null = null;
let musicTimer: number | null = null;
let track: HTMLAudioElement | null = null;
let unlocked = false;
let wantMusic = true;

function ensure(): Bus | null {
  if (typeof window === "undefined") return null;
  if (bus) return bus;
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioContext({ latencyHint: "interactive" });
  const master = ctx.createGain();
  const sfx = ctx.createGain();
  const music = ctx.createGain();
  sfx.gain.value = 0.78;
  music.gain.value = 0.22;
  master.gain.value = 0.9;
  sfx.connect(master);
  music.connect(master);
  master.connect(ctx.destination);
  bus = { ctx, master, sfx, music };
  return bus;
}

function noise(dur: number, gain: number, dest: GainNode, when = 0, hp = 400): void {
  const b = bus;
  if (!b || !unlocked) return;
  const n = Math.max(1, Math.floor(b.ctx.sampleRate * dur));
  const buf = b.ctx.createBuffer(1, n, b.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
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

export function sfxClick(): void {
  const b = ensure();
  if (!b) return;
  tone(880 + Math.random() * 60, 0.045, "triangle", 0.09, b.sfx);
}

export function sfxPlace(): void {
  const b = ensure();
  if (!b) return;
  noise(0.08, 0.16, b.sfx, 0, 900);
  tone(210 + Math.random() * 30, 0.11, "sine", 0.16, b.sfx, 0, 140);
  tone(540, 0.06, "triangle", 0.07, b.sfx, 0.02);
}

export function sfxClear(combo: number): void {
  const b = ensure();
  if (!b) return;
  const base = 523 + Math.min(combo, 8) * 32;
  tone(base, 0.14, "triangle", 0.18, b.sfx);
  tone(base * 1.26, 0.16, "sine", 0.12, b.sfx, 0.04);
  tone(base * 1.5, 0.2, "sine", 0.09, b.sfx, 0.08);
}

export function sfxBomb(): void {
  const b = ensure();
  if (!b) return;
  noise(0.28, 0.32, b.sfx, 0, 280);
  tone(90, 0.32, "sine", 0.28, b.sfx, 0, 46);
  tone(180, 0.18, "triangle", 0.1, b.sfx, 0.04, 70);
}

export function sfxRocket(): void {
  const b = ensure();
  if (!b) return;
  tone(280, 0.22, "sawtooth", 0.1, b.sfx, 0, 720);
  tone(420, 0.18, "triangle", 0.08, b.sfx, 0.04, 980);
  noise(0.16, 0.12, b.sfx, 0.02, 1800);
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
}

export function sfxUi(): void {
  const b = ensure();
  if (!b) return;
  tone(720 + Math.random() * 40, 0.05, "sine", 0.09, b.sfx);
}

function ensureTrack(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (track) return track;
  const el = new Audio("/music/island.ogg");
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
