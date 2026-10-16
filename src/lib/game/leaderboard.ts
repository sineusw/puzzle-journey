/**
 * Shared leaderboard.
 *
 * Inside the claude.ai artifact viewer the page can use the `db` and `user`
 * capabilities: every player keeps one score card at `players/<their id>`
 * (only they can write it, everyone reads all of them), and names come from
 * their claude.ai profiles. Anywhere else (the Vercel site, a saved copy)
 * those capabilities are absent and the board shows only this device's card.
 */

import { create } from "zustand";
import type { PlayerCard } from "./stats.ts";
import { notify } from "./notices.ts";

type Profile = { id: string; name: string; avatarUrl: string; color: string; isMe: boolean };

type DbDoc = { id: string; exists: boolean; data(): Record<string, unknown> | undefined };
type DbApi = {
  collection(path: string): {
    onSnapshot(next: (s: { docs: DbDoc[] }) => void, error?: (e: { code: string }) => void): () => void;
  };
  doc(path: string): { set(data: Record<string, unknown>): Promise<void> };
};
type UserApi = {
  id(): Promise<string | null>;
  profiles(ids: readonly string[]): Promise<Record<string, Profile>>;
  can(name: string): Promise<boolean | null>;
};
type ClaudeWindow = Window & { claude?: { use(name: string): Promise<unknown> } };

export type BoardState = {
  /** "local": this device only; "shared": live board with other players. */
  mode: "connecting" | "local" | "shared";
  /** Can this viewer post to the shared board? */
  canPost: boolean;
  myId: string;
  cards: Record<string, PlayerCard>;
  names: Record<string, { name: string; avatarUrl: string; color: string }>;
};

export const LOCAL_ID = "me";

export const useBoard = create<BoardState>(() => ({
  mode: "connecting",
  canPost: false,
  myId: LOCAL_ID,
  cards: {},
  names: {},
}));

let db: DbApi | null = null;
let user: UserApi | null = null;
let started = false;

function isCard(x: unknown): x is PlayerCard {
  const c = x as PlayerCard;
  return Boolean(c && typeof c === "object" && c.best && typeof c.best === "object" && c.days && typeof c.days === "object");
}

async function refreshNames(ids: string[]): Promise<void> {
  if (!user || !ids.length) return;
  const ps = await user.profiles(ids);
  const names: BoardState["names"] = {};
  for (const id of ids) {
    const p = ps[id];
    if (p) names[id] = { name: p.name, avatarUrl: p.avatarUrl, color: p.color };
  }
  useBoard.setState({ names });
}

/**
 * Connect once. `local` is this device's own card, shown immediately and
 * kept as the fallback when the shared board isn't available.
 */
export async function connectBoard(local: PlayerCard): Promise<void> {
  useBoard.setState((s) => ({ cards: { ...s.cards, [s.myId]: local } }));
  if (started) return;
  started = true;
  const w = window as ClaudeWindow;
  const capability = w.claude?.use?.bind(w.claude);
  if (!capability) {
    useBoard.setState({ mode: "local" });
    return;
  }
  const [dbNs, userNs] = await Promise.all([capability("db").catch(() => null), capability("user").catch(() => null)]);
  db = dbNs as DbApi | null;
  user = userNs as UserApi | null;
  const id = user ? await user.id() : null;
  if (!db || !id) {
    useBoard.setState({ mode: "local" });
    return;
  }
  const canWrite = user ? await user.can("data.write") : null;
  useBoard.setState((s) => {
    const cards = { ...s.cards };
    delete cards[LOCAL_ID];
    cards[id] = local;
    return { mode: "shared", myId: id, canPost: canWrite !== false, cards };
  });
  db.collection("players").onSnapshot(
    (snap) => {
      const cards: Record<string, PlayerCard> = {};
      for (const d of snap.docs) {
        const data = d.exists ? d.data() : undefined;
        if (isCard(data)) cards[d.id] = data;
      }
      // Keep this device's latest card even before its write round-trips.
      const mine = useBoard.getState().cards[id];
      if (mine && (!cards[id] || (cards[id]!.updatedAt ?? 0) < mine.updatedAt)) cards[id] = mine;
      useBoard.setState({ cards });
      void refreshNames(Object.keys(cards)).then(() => announceFriends(cards, id));
    },
    () => useBoard.setState({ mode: "local" }),
  );
}

/** Only news from after this session started is announced. */
const sessionStart = Date.now();
const announced = new Set<string>();

/** "Luke finished Combo King": other players' fresh challenge wins. */
function announceFriends(cards: Record<string, PlayerCard>, me: string): void {
  const s = useBoard.getState();
  for (const [pid, card] of Object.entries(cards)) {
    if (pid === me) continue;
    for (const r of card.recent ?? []) {
      const key = `${pid}:${r.t}:${r.at}`;
      if (r.at <= sessionStart || announced.has(key)) continue;
      announced.add(key);
      notify({ icon: r.icon, title: `${nameFor(pid, s)} finished ${r.t}`, sub: "Can you match it?", tone: "friend" });
    }
  }
}

/** Save this player's card locally and, when possible, to the shared board. */
export async function postCard(card: PlayerCard): Promise<void> {
  const { myId, mode, canPost } = useBoard.getState();
  useBoard.setState((s) => ({ cards: { ...s.cards, [myId]: card } }));
  if (mode !== "shared" || !db || !canPost) return;
  try {
    await db.doc(`players/${myId}`).set(card as unknown as Record<string, unknown>);
  } catch (e) {
    // View-only viewers can read the board but not post: stop trying.
    if ((e as { code?: string })?.code === "invalid_argument") useBoard.setState({ canPost: false });
  }
}

/** Display name for a player id. */
export function nameFor(id: string, s: BoardState): string {
  if (id === s.myId) return "You";
  return s.names[id]?.name || s.cards[id]?.nick || "Island player";
}
