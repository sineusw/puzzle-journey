/**
 * Quick notifications ("Challenge complete!", "Luke finished Combo King").
 * One at a time at the top of the screen, gone in under two seconds, and
 * never covering the board for long. Duplicates arriving together collapse.
 */

import { create } from "zustand";

export type Notice = {
  id: number;
  icon: string;
  title: string;
  sub?: string;
  tone?: "win" | "friend" | "info";
};

type NoticeState = { queue: Notice[] };

export const useNotices = create<NoticeState>(() => ({ queue: [] }));

let seq = 1;
/** Show time for one notice; the next one follows right after. */
export const NOTICE_MS = 1800;

export function notify(n: Omit<Notice, "id">): void {
  const { queue } = useNotices.getState();
  if (queue.some((q) => q.title === n.title && q.sub === n.sub)) return;
  // Keep it short: at most 3 waiting, oldest info notices dropped first.
  const next = [...queue, { ...n, id: seq++ }];
  while (next.length > 3) {
    const i = next.findIndex((q, k) => k > 0 && q.tone === "info");
    next.splice(i > 0 ? i : 1, 1);
  }
  useNotices.setState({ queue: next });
}

export function dismissNotice(id: number): void {
  useNotices.setState((s) => ({ queue: s.queue.filter((q) => q.id !== id) }));
}
