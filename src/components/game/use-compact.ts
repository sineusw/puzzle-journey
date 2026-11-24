import { useSyncExternalStore } from "react";

/**
 * Phone-portrait layout: the side buttons move up beside the logo so the
 * board can use the full width. Server render and first hydration use the
 * roomy layout; the client switches right after without a mismatch.
 */
const QUERY = "(max-width: 599px)";

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function snapshot(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.(QUERY).matches);
}

export function useCompactLayout(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
