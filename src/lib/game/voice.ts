/**
 * Spoken encouragement ("Great!", "Excellent!", "Island cleared!") using the
 * device's built-in speech voice. Off when the player turns "Voice cheers"
 * off in Settings or mutes sound effects. Rate-limited so cheers never stack.
 */

let enabled = true;
let lastAt = 0;
let chosen: SpeechSynthesisVoice | null | undefined;

const PREFERRED = ["Samantha", "Ava", "Allison", "Google US English", "Microsoft Aria", "Karen", "Moira", "Tessa"];

function available(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  if (chosen !== undefined) return chosen;
  const voices = synth.getVoices();
  if (!voices.length) return null;
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  chosen =
    PREFERRED.map((n) => english.find((v) => v.name.includes(n))).find(Boolean) ??
    english.find((v) => v.lang.toLowerCase() === "en-us") ??
    english[0] ??
    null;
  return chosen;
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  if (!on) available()?.cancel();
}

/**
 * Say a short cheer. `priority` cheers (level complete, perfect) interrupt a
 * cheer in progress; ordinary ones are skipped if one was said very recently.
 */
export function cheer(text: string, opts: { delayMs?: number; priority?: boolean } = {}): void {
  const synth = available();
  if (!synth || !enabled) return;
  const now = Date.now();
  if (!opts.priority && now - lastAt < 1800) return;
  lastAt = now;
  const speak = () => {
    try {
      if (opts.priority) synth.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/!+$/, "!"));
      const v = pickVoice(synth);
      if (v) u.voice = v;
      u.lang = v?.lang ?? "en-US";
      u.rate = 1.04;
      u.pitch = 1.2;
      u.volume = 0.9;
      synth.speak(u);
    } catch {
      /* speech not allowed here */
    }
  };
  if (opts.delayMs) window.setTimeout(speak, opts.delayMs);
  else speak();
}

/** Voices load asynchronously on some browsers; warm the list early. */
export function warmVoices(): void {
  const synth = available();
  if (!synth) return;
  synth.getVoices();
  synth.addEventListener?.("voiceschanged", () => {
    chosen = undefined;
    pickVoice(synth);
  });
}

let primed = false;

/**
 * iOS only lets speech start from inside a tap. Speak a silent, empty cue on
 * the player's first tap so later cheers (fired after animations) can play.
 */
export function primeVoice(): void {
  const synth = available();
  if (!synth || primed) return;
  primed = true;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    synth.speak(u);
  } catch {
    /* ignore */
  }
}
