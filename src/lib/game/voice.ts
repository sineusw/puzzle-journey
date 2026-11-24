/**
 * Spoken encouragement ("Great!", "Excellent!", "Island cleared!") using the
 * device's built-in speech voice. Off when the player turns "Voice cheers"
 * off in Settings or mutes sound effects. Rate-limited so cheers never stack.
 */

import { playClip, preloadClips } from "./audio";

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
}

/**
 * Recorded announcer lines (deep, punchy, a little echo). Only big moments get
 * one; anything else stays silent. No robotic text-to-speech anymore.
 */
const CLIPS: Record<string, string> = {
  "perfect!": "perfect",
  "unbelievable!": "unbelievable",
  "amazing!": "amazing",
  "excellent!": "excellent",
  "great!": "great",
  "level complete!": "level-complete",
  "new best score!": "new-best",
  "new personal record!": "new-best",
  "level up!": "level-up",
};
const clipUrl = (key: string) => `/voice/${key}.mp3`;

export function cheer(text: string | null, opts: { delayMs?: number; priority?: boolean } = {}): void {
  if (!enabled || !text) return;
  const key = CLIPS[text.trim().toLowerCase()];
  if (!key) return;
  const now = Date.now();
  if (!opts.priority && now - lastAt < 1800) return;
  lastAt = now;
  const say = () => playClip(clipUrl(key));
  if (opts.delayMs) window.setTimeout(say, opts.delayMs);
  else say();
}

/** Load the announcer clips early. */
export function warmVoices(): void {
  if (typeof window === "undefined") return;
  preloadClips([...new Set(Object.values(CLIPS))].map(clipUrl));
}

/** Kept for callers; clips need no priming. */
export function primeVoice(): void {}
