/**
 * Challenges and Leaderboard screens: built to feel like a competition.
 * Challenges fill up while you play; the board shows a podium, medals,
 * your nearest rival and reset countdowns.
 */

import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/lib/game/store";
import { nameFor, useBoard, type BoardState } from "@/lib/game/leaderboard";
import { categories, dayKey, rank, weekKey, type Category } from "@/lib/game/stats";
import { dailySet, rollover, weeklySet, type ChallengeDef } from "@/lib/game/challenges";
import { GameIcon } from "./icons";

/* ---------------------------------------------------------------- helpers */

function useNow(ms = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

function untilMidnight(now: number): number {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime() - now;
}

function untilMonday(now: number): number {
  const d = new Date(now);
  const add = ((8 - d.getDay()) % 7) || 7;
  d.setDate(d.getDate() + add);
  d.setHours(0, 0, 0, 0);
  return d.getTime() - now;
}

function span(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function ago(at: number, now: number): string {
  const m = Math.max(0, Math.round((now - at) / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

/** Round avatar: the player's picture, or their initial on their color. */
function Avatar({ id, board, size = 34 }: { id: string; board: BoardState; size?: number }) {
  const info = board.names[id];
  const name = nameFor(id, board);
  const style = { width: size, height: size, background: info?.color || (id === board.myId ? "#f0a92a" : "#4f8bff") };
  return (
    <span className={`pj-avatar${id === board.myId ? " is-me" : ""}`} style={style} aria-hidden="true">
      {info?.avatarUrl ? <img src={info.avatarUrl} alt="" /> : (name === "You" ? "★" : name.slice(0, 1).toUpperCase())}
    </span>
  );
}

const MEDAL = ["🥇", "🥈", "🥉"];

/* -------------------------------------------------------------- challenges */

/** Coins fly from the Claim button up to the coin counter. */
function flyCoins(from: HTMLElement, n = 8): void {
  const to = document.querySelector<HTMLElement>(".pj-hud .pj-chip-ico")?.getBoundingClientRect();
  const a = from.getBoundingClientRect();
  if (!to) return;
  for (let i = 0; i < n; i++) {
    const coin = document.createElement("img");
    coin.src = "/icons/coin.png";
    coin.alt = "";
    coin.className = "pj-fly-coin";
    coin.style.left = `${a.left + a.width / 2}px`;
    coin.style.top = `${a.top + a.height / 2}px`;
    document.body.appendChild(coin);
    const dx = to.left + to.width / 2 - (a.left + a.width / 2);
    const dy = to.top + to.height / 2 - (a.top + a.height / 2);
    const spread = (Math.random() - 0.5) * 120;
    coin
      .animate(
        [
          { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
          { transform: `translate(calc(-50% + ${spread}px), calc(-50% - 60px)) scale(1.1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.7)`, opacity: 1 },
        ],
        { duration: 700 + i * 60, easing: "cubic-bezier(.5,0,.3,1)", delay: i * 40, fill: "both" },
      )
      .finished.then(
        () => coin.remove(),
        () => coin.remove(),
      );
  }
}

function ChallengeCard({ c, value, done, claimed }: { c: ChallengeDef; value: number; done: boolean; claimed: boolean }) {
  const claim = useGame((s) => s.claimChallenge);
  const pct = Math.min(100, Math.round((value / c.target) * 100));
  return (
    <div className={`pj-ch-card${done ? " is-done" : ""}${c.period === "week" ? " is-week" : ""}`} data-testid={`ch-${c.id}`}>
      <span className="pj-ch-icon" aria-hidden="true">
        {c.icon}
      </span>
      <div className="pj-ch-body">
        <div className="pj-ch-title">
          <strong>{c.title}</strong>
          <span className="pj-ch-reward">
            <GameIcon name="coin" className="pj-ch-ico" />
            {c.reward.coins}
            <GameIcon name="gem" className="pj-ch-ico" />
            {c.reward.gems}
          </span>
        </div>
        <div className="pj-ch-blurb">{c.blurb}</div>
        <div className="pj-ch-bar" aria-label={`${Math.min(value, c.target)} of ${c.target}`}>
          <span style={{ width: `${pct}%` }} />
          <em>
            {Math.min(value, c.target).toLocaleString("en-US")} / {c.target.toLocaleString("en-US")}
          </em>
        </div>
      </div>
      {done && claimed ? (
        <span className="pj-ch-stamp" aria-label="Collected">
          ✓
        </span>
      ) : null}
      {done && !claimed ? (
        <button
          type="button"
          className="pj-ch-claim"
          data-testid={`claim-${c.id}`}
          onClick={(e) => {
            flyCoins(e.currentTarget);
            claim(c.id);
          }}
        >
          Claim
          <span>
            +{c.reward.coins} <GameIcon name="coin" className="pj-ch-ico" />
          </span>
        </button>
      ) : null}
    </div>
  );
}

export function ChallengeScreen() {
  const raw = useGame((s) => s.profile.challenges);
  const board = useBoard();
  const now = useNow();
  const state = useMemo(() => rollover(raw, new Date(now)), [raw, now]);
  const settle = useGame((s) => s.settleChallenges);
  // A new day started while the game was open: pay out anything left unclaimed.
  useEffect(() => {
    if (state !== raw) settle();
  }, [state, raw, settle]);
  const daily = dailySet(state.day);
  const weekly = weeklySet(state.week);
  const doneDay = daily.filter((c) => state.done.includes(c.id)).length;
  const ring = Math.round((doneDay / daily.length) * 100);
  const today = dayKey(new Date(now));
  const race = Object.entries(board.cards)
    .map(([id, card]) => ({ id, n: card.ch?.day === today ? card.ch.n : 0 }))
    .sort((a, b) => b.n - a.n || a.id.localeCompare(b.id));
  const feed = Object.entries(board.cards)
    .flatMap(([id, card]) => (card.recent ?? []).map((r) => ({ id, ...r })))
    .sort((a, b) => b.at - a.at)
    .slice(0, 6);
  return (
    <div data-testid="challenges">
      <div className="pj-comp-hero">
        <div>
          <h2 className="font-display text-2xl">Challenges</h2>
          <p className="text-sm text-muted">They fill up as you play any mode. Everyone gets the same ones today.</p>
        </div>
        <div className="pj-ring" style={{ ["--p" as string]: `${ring}%` }} aria-label={`${doneDay} of ${daily.length} done today`}>
          <strong>
            {doneDay}/{daily.length}
          </strong>
          <span>today</span>
        </div>
      </div>

      <div className="pj-comp-head">
        <h3>Daily</h3>
        <span className="pj-timer">⏳ New in {span(untilMidnight(now))}</span>
      </div>
      <div className="space-y-2">
        {daily.map((c) => (
          <ChallengeCard key={c.id} c={c} value={state.progress[c.id] ?? 0} done={state.done.includes(c.id)} claimed={(state.claimed ?? []).includes(c.id)} />
        ))}
      </div>

      <div className="pj-comp-head">
        <h3>This week</h3>
        <span className="pj-timer">⏳ Ends in {span(untilMonday(now))}</span>
      </div>
      <div className="space-y-2">
        {weekly.map((c) => (
          <ChallengeCard key={c.id} c={c} value={state.progress[c.id] ?? 0} done={state.done.includes(c.id)} claimed={(state.claimed ?? []).includes(c.id)} />
        ))}
      </div>

      <div className="pj-comp-head">
        <h3>Today’s race</h3>
        <span className="pj-timer">Most challenges done</span>
      </div>
      <ol className="pj-race">
        {race.map((r, i) => (
          <li key={r.id} className={r.id === board.myId ? "is-me" : ""}>
            <span className="pj-race-pos">{i < 3 && r.n > 0 ? MEDAL[i] : i + 1}</span>
            <Avatar id={r.id} board={board} size={28} />
            <span className="pj-race-name">{nameFor(r.id, board)}</span>
            <span className="pj-race-n">
              {r.n}/{daily.length}
            </span>
          </li>
        ))}
      </ol>
      {race.length < 2 ? <p className="pj-comp-note">Share the game with a friend to race them here.</p> : null}

      {feed.length ? (
        <>
          <div className="pj-comp-head">
            <h3>Recent wins</h3>
          </div>
          <ul className="pj-feed">
            {feed.map((f) => (
              <li key={`${f.id}-${f.at}`}>
                <span className="pj-feed-icon">{f.icon}</span>
                <span>
                  <b>{nameFor(f.id, board)}</b> finished {f.t}
                </span>
                <em>{ago(f.at, now)}</em>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- leaderboard */

const CAT_ICON: Record<string, string> = {
  sandbox: "🏝️",
  iq: "🧠",
  combo: "🔥",
  streak: "🔗",
  fastest: "⚡",
  tidiest: "🧽",
  perfects: "✨",
  pieces: "🧱",
  "lines-today": "📅",
  "score-today": "🎯",
  "burst-today": "⏱️",
  "games-today": "🎮",
  "ch-today": "🏅",
  "ch-week": "🗓️",
};
const iconFor = (cat: Category) => CAT_ICON[cat.id] ?? (cat.id.startsWith("color-") ? "🎨" : "🏆");

/** The closest category where someone else leads: your next target. */
function rivalLine(board: BoardState, cats: Category[], today: string): string | null {
  let best: { gap: number; text: string } | null = null;
  for (const cat of cats) {
    const r = rank(cat, board.cards, today);
    const mine = r.findIndex((x) => x.id === board.myId);
    if (mine <= 0 || !r[0]) continue;
    const lead = r[0];
    const myV = r[mine]!.value;
    const gap = Math.abs(lead.value - myV) / Math.max(1, lead.value);
    if (!best || gap < best.gap) best = { gap, text: `Beat ${nameFor(lead.id, board)}’s ${cat.format(lead.value)} in “${cat.title}” to take the crown.` };
  }
  return best?.text ?? null;
}

function Podium({ cat, board, today }: { cat: Category; board: BoardState; today: string }) {
  const r = rank(cat, board.cards, today).slice(0, 3);
  const order = [r[1], r[0], r[2]];
  return (
    <div className="pj-podium-card">
      <div className="pj-podium-title">
        <span>{iconFor(cat)}</span> Featured: {cat.title}
      </div>
      <div className="pj-podium">
        {order.map((p, i) => {
          const place = i === 1 ? 1 : i === 0 ? 2 : 3;
          return (
            <div key={place} className={`pj-step is-${place}`}>
              {p ? (
                <>
                  <Avatar id={p.id} board={board} size={place === 1 ? 46 : 36} />
                  <span className="pj-step-name">{nameFor(p.id, board)}</span>
                  <span className="pj-step-val">{cat.format(p.value)}</span>
                </>
              ) : (
                <span className="pj-step-empty">Open spot</span>
              )}
              <div className="pj-step-block">{MEDAL[place - 1]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RanksScreen() {
  const board = useBoard();
  const [scope, setScope] = useState<"today" | "all">("today");
  const now = useNow();
  const today = dayKey(new Date(now));
  const all = categories(new Date(now));
  const cats = all.filter((c) => c.scope === scope);
  const players = Object.keys(board.cards).length;
  const crowns = all.filter((c) => rank(c, board.cards, today)[0]?.id === board.myId).length;
  const rival = players > 1 ? rivalLine(board, all, today) : null;
  // Featured category rotates daily, among ones with entries.
  const withEntries = cats.filter((c) => rank(c, board.cards, today).length > 0);
  const featured = withEntries.length ? withEntries[Number(today.replace(/-/g, "")) % withEntries.length]! : null;
  return (
    <div data-testid="ranks">
      <div className="pj-comp-hero">
        <div>
          <h2 className="font-display text-2xl">Leaderboard</h2>
          <p className="text-sm text-muted">
            {board.mode === "shared"
              ? `${players} ${players === 1 ? "player" : "players"} competing${board.canPost ? "" : " · ask the owner for edit access to post"}`
              : "Your records. Play on the shared game page to compete with friends."}
          </p>
        </div>
        <div className="pj-crowns" aria-label={`You lead ${crowns} categories`}>
          <strong>👑 {crowns}</strong>
          <span>crowns</span>
        </div>
      </div>

      <div className="pj-standing">
        {rival ? <p>⚔️ {rival}</p> : players > 1 ? <p>👑 You lead every category you’ve played. Defend your crowns!</p> : <p>🏝️ You’re the only one here so far. Invite a friend and race for the crowns.</p>}
      </div>

      <div className="pj-modes mt-3" role="tablist" aria-label="Leaderboard period">
        {(
          [
            ["today", "Today"],
            ["all", "All-time"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={scope === id} className={`pj-mode-tab ${scope === id ? "is-on" : ""}`} onClick={() => setScope(id)}>
            {label}
          </button>
        ))}
      </div>
      {scope === "today" ? <p className="pj-timer mt-2">⏳ Today’s boards reset in {span(untilMidnight(now))}</p> : null}

      {featured ? <Podium cat={featured} board={board} today={today} /> : null}

      <div className="mt-3 space-y-2">
        {cats.map((cat) => {
          const ranked = rank(cat, board.cards, today);
          const myIdx = ranked.findIndex((r) => r.id === board.myId);
          const top = ranked.slice(0, 3);
          const lead = ranked[0];
          return (
            <div key={cat.id} className={`pj-rank-card${lead?.id === board.myId ? " is-mine" : ""}`}>
              <div className="pj-rank-title">
                <span className="pj-rank-ico">{iconFor(cat)}</span>
                {cat.title}
                {lead?.id === board.myId ? <span className="pj-rank-crown">👑 Yours</span> : null}
              </div>
              {ranked.length === 0 ? (
                <div className="pj-rank-empty">No one yet. Be the first to claim it!</div>
              ) : (
                <ol className="pj-rank-list">
                  {top.map((r, i) => (
                    <li key={r.id} className={r.id === board.myId ? "is-me" : ""}>
                      <span className={`pj-rank-pos is-${i + 1}`}>{MEDAL[i]}</span>
                      <Avatar id={r.id} board={board} size={24} />
                      <span className="pj-rank-name">{nameFor(r.id, board)}</span>
                      <span className="pj-rank-val tabular-nums">{cat.format(r.value)}</span>
                    </li>
                  ))}
                  {myIdx >= 3 ? (
                    <li className="is-me">
                      <span className="pj-rank-pos">{myIdx + 1}</span>
                      <Avatar id={board.myId} board={board} size={24} />
                      <span className="pj-rank-name">You</span>
                      <span className="pj-rank-val tabular-nums">{cat.format(ranked[myIdx]!.value)}</span>
                    </li>
                  ) : null}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { weekKey };
