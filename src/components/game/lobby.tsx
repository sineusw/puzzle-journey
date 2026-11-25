import { useEffect, useState } from "react";
import { HooksRow } from "./hooks-ui";
import { openPlayMode, type PlayMode } from "./overlays";
import { Crown, Lock, Palette, Play, Star, Trophy } from "lucide-react";
import { dailyNumber } from "@/lib/game/engine";
import { ADVENTURE, FEATURE_AT, worldOf, type FeatureId } from "@/lib/game/content";
import { normalizeLive } from "@/lib/game/liveops";
import { CHEST_SIZE, useGame } from "@/lib/game/store";
import type { BoardRow } from "@/lib/game/ranked-service";
import { GameIcon } from "./icons";

const FLOATERS = ["#ff5d73", "#ffd23f", "#3ddc97", "#4cc9f0", "#b388ff", "#ff9f43"];

/** The title screen players land on: one big Play button, progress, quick links, top players. */
export function LobbyScreen() {
  const profile = useGame((s) => s.profile);
  const match = useGame((s) => s.match);
  const startAdventure = useGame((s) => s.startAdventure);
  const setTab = useGame((s) => s.setTab);
  const setPanel = useGame((s) => s.setPanel);
  const startDaily = useGame((s) => s.startDaily);
  const [now, setNow] = useState(() => Date.now());
  const [top, setTop] = useState<BoardRow[] | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    let live = true;
    import("@/lib/game/ranked-api")
      .then(({ rankedBoard }) => rankedBoard())
      .then((r) => live && setTop(r.available ? r.rows.slice(0, 3) : []))
      .catch(() => live && setTop([]));
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, []);

  const unlocked = profile.adventure.unlocked;
  const reached = Math.max(unlocked, profile.classic.unlocked);
  const island = ADVENTURE.find((l) => l.id === unlocked) ?? ADVENTURE[ADVENTURE.length - 1]!;
  const inProgress = match.mode === "adventure" && match.moves > 0 && match.levelId !== null;
  const playId = inProgress ? match.levelId! : island.id;
  const playLevel = ADVENTURE.find((l) => l.id === playId) ?? island;
  const starsWon = Object.values(profile.adventure.stars).reduce((a, b) => a + b, 0);
  const starsMax = Math.max(3, (unlocked - 1) * 3);
  const dailyReady = reached >= FEATURE_AT.daily && now >= profile.daily.nextAt;
  const spinReady = reached >= FEATURE_AT.spin && !normalizeLive(profile.live).spin.free;

  const today = dailyNumber(new Date(now));
  const puzzleReady = profile.puzzleDay !== today;
  const play = () => (inProgress ? setTab("home") : startAdventure(playId));

  const tiles: Array<{ f: FeatureId | null; label: string; icon: React.ReactNode; dot?: boolean; go: () => void }> = [
    { f: "daily", label: "Puzzle", icon: <span className="pj-emoji-ico">🧩</span>, dot: puzzleReady, go: () => startDaily() },
    { f: "daily", label: "Daily", icon: <GameIcon name="daily" />, dot: dailyReady, go: () => setPanel("daily") },
    { f: "spin", label: "Spin", icon: <span className="pj-spin-ico" aria-hidden="true" />, dot: spinReady, go: () => setPanel("spin") },
    { f: "shop", label: "Shop", icon: <GameIcon name="shop" />, go: () => setPanel("shop") },
    { f: null, label: "Skins", icon: <Palette strokeWidth={2.4} />, go: () => setTab("skins") },
    { f: "challenges", label: "Challenges", icon: <GameIcon name="quests" />, go: () => setTab("challenges") },
  ];

  // New players see only what they can use, plus one teaser for the next unlock.
  const open = tiles.filter((t) => t.f === null || reached >= FEATURE_AT[t.f]);
  const nextLocked = tiles
    .filter((t) => t.f !== null && reached < FEATURE_AT[t.f])
    .sort((a, b) => FEATURE_AT[a.f!] - FEATURE_AT[b.f!])[0];
  const shown = nextLocked ? [...open, nextLocked] : open;
  const showBoard = reached >= 4;

  return (
    <div className="pj-lobby" data-testid="lobby">
      <div className="pj-lobby-floaters" aria-hidden="true">
        {FLOATERS.map((c, i) => (
          <i key={c} style={{ ["--c" as string]: c, ["--i" as string]: i }} />
        ))}
      </div>

      <h1 className="pj-lobby-logo font-display">
        <span>Block</span>
        <span>Journey</span>
      </h1>

      <div className="pj-lobby-card">
        <div className="pj-lobby-world">World {worldOf(playId).index + 1} · {worldOf(playId).name}</div>
        <div className="pj-lobby-island font-display">Island {playId}: {playLevel.name}</div>
        <div className="pj-lobby-stars">
          <Star fill="currentColor" className="size-4" />
          <span className="tabular-nums">{starsWon} / {starsMax}</span>
          <div className="pj-lobby-bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (starsWon / starsMax) * 100)}%` }} />
          </div>
        </div>
        <button type="button" className="pj-lobby-play" data-testid="lobby-play" onClick={play}>
          <Play fill="currentColor" className="size-7" />
          {inProgress ? "Continue" : "Play"}
        </button>
        <ChestBar />
        <div className="pj-lobby-chips">
          {profile.levelStreak >= 1 ? <span>🔥 {profile.levelStreak} win streak</span> : <span>🔥 Win 2 in a row for a free booster</span>}
          {profile.daily.streak >= 1 ? <span>📅 Day {profile.daily.streak}</span> : null}
        </div>
      </div>

      <ModesRow reached={reached} />
      {reached >= 3 ? <HooksRow /> : null}

      <div className="pj-lobby-tiles" style={{ gridTemplateColumns: `repeat(${shown.length}, 1fr)`, ["--n" as string]: shown.length }}>
        {shown.map((t) => {
          const locked = t.f !== null && reached < FEATURE_AT[t.f];
          return (
            <button
              key={t.label}
              type="button"
              className={`pj-lobby-tile${locked ? " is-locked" : ""}`}
              onClick={locked ? () => useGame.setState({ toast: `Unlocks on island ${FEATURE_AT[t.f!]}` }) : t.go}
            >
              {t.dot && !locked ? <span className="pj-badge" /> : null}
              <span className="pj-lobby-tile-ico">{locked ? <Lock strokeWidth={2.6} /> : t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {showBoard ? <button type="button" className="pj-lobby-ranks" onClick={() => setTab("ranks")}>
        <div className="pj-lobby-ranks-head">
          <Trophy className="size-5" />
          <b>Leaderboard</b>
          <span>See all ›</span>
        </div>
        {top && top.length ? (
          <ol>
            {top.map((r) => (
              <li key={r.rank} className={r.me ? "is-me" : ""}>
                <span className={`pj-lobby-medal m${r.rank}`}>{r.rank === 1 ? <Crown className="size-4" /> : r.rank}</span>
                <span className="pj-lobby-name">{r.name}</span>
                <strong className="tabular-nums">{r.score.toLocaleString("en-US")}</strong>
              </li>
            ))}
          </ol>
        ) : (
          <p>Your best score: <b className="tabular-nums">{profile.highScore.toLocaleString("en-US")}</b> · Play a ranked run to get on the board</p>
        )}
      </button> : null}
    </div>
  );
}

/** Treasure chest progress: every win fills a slot; the last one opens it. */
export function ChestBar() {
  const chest = useGame((s) => s.profile.chest ?? 0);
  const opened = useGame((s) => s.chestOpened);
  const panel = useGame((s) => s.panel);
  if (opened && panel === "won") {
    return (
      <div className="pj-chest is-open" data-testid="chest-open">
        <span className="pj-chest-ico">🎁</span>
        <b>Chest opened!</b>
        <span>+{opened.coins} coins · +{opened.gems} gems · +1 hammer · +1 bomb</span>
      </div>
    );
  }
  return (
    <div className="pj-chest" aria-label={`Treasure chest ${chest} of ${CHEST_SIZE}`}>
      <span className="pj-chest-ico">🧰</span>
      <div className="pj-chest-slots">
        {Array.from({ length: CHEST_SIZE }, (_, i) => (
          <i key={i} className={i < chest ? "is-on" : ""} />
        ))}
      </div>
      <span>{CHEST_SIZE - chest === 1 ? "1 win to open!" : `${CHEST_SIZE - chest} wins to open`}</span>
    </div>
  );
}

/** Share a run: the phone's share sheet, or copy to the clipboard. */
export async function shareRun(score: number, combo: number, levelId: number | null): Promise<void> {
  const url = typeof location !== "undefined" ? location.origin : "";
  const brag = combo >= 3 ? ` with a x${combo} combo` : "";
  const where = levelId ? ` on island ${levelId}` : "";
  const text = `I scored ${score.toLocaleString("en-US")}${brag}${where} in Block Journey 🌴 Can you beat me?`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Block Journey", text, url });
      return;
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    useGame.setState({ toast: "Copied! Paste it anywhere to challenge a friend." });
    window.setTimeout(() => useGame.setState({ toast: null }), 2000);
  } catch {
    // Share sheet closed: nothing to do.
  }
}

/** Wordle-style daily puzzle result for group chats. */
export async function shareDaily(day: number, moves: number, stars: number, streak: number): Promise<void> {
  const url = typeof location !== "undefined" ? location.origin : "";
  const text = [
    `Block Journey Daily #${day} 🧩`,
    `${"⭐".repeat(stars)}${"▫️".repeat(3 - stars)} solved in ${moves} moves`,
    streak > 1 ? `🔥 ${streak}-day streak` : "",
    "Can you do it in fewer?",
  ].filter(Boolean).join("\n");
  try {
    if (navigator.share) {
      await navigator.share({ title: `Block Journey Daily #${day}`, text, url });
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    useGame.setState({ toast: "Copied! Paste it in your group chat." });
    window.setTimeout(() => useGame.setState({ toast: null }), 2000);
  } catch {
    // Share sheet closed.
  }
}

/** The three ways to play, always visible on the home screen (locked ones say when they open). */
function ModesRow({ reached }: { reached: number }) {
  const modes: Array<{ id: PlayMode; icon: string; name: string; sub: string; at: number }> = [
    { id: "adventure", icon: "🏝️", name: "Adventure", sub: "Island map", at: 0 },
    { id: "classic", icon: "🧩", name: "Classic", sub: "30 pure levels", at: FEATURE_AT.classic },
    { id: "sandbox", icon: "♾️", name: "Sandbox", sub: "Endless", at: FEATURE_AT.sandbox },
  ];
  return (
    <div className="pj-modes-row">
      <div className="pj-modes-title">3 ways to play</div>
      <div className="pj-modes-cards">
        {modes.map((m) => {
          const locked = reached < m.at;
          return (
            <button
              key={m.id}
              type="button"
              className={`pj-modecard is-${m.id}${locked ? " is-locked" : ""}`}
              onClick={() => (locked ? undefined : openPlayMode(m.id))}
              aria-disabled={locked}
            >
              <span className="pj-modecard-ico">{m.icon}</span>
              <b>{m.name}</b>
              <small>{locked ? `🔒 Island ${m.at}` : m.sub}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
