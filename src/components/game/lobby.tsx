import { useEffect, useState } from "react";
import { Crown, Lock, Palette, Play, Star, Trophy } from "lucide-react";
import { ADVENTURE, FEATURE_AT, worldOf, type FeatureId } from "@/lib/game/content";
import { normalizeLive } from "@/lib/game/liveops";
import { useGame } from "@/lib/game/store";
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

  const play = () => (inProgress ? setTab("home") : startAdventure(playId));

  const tiles: Array<{ f: FeatureId | null; label: string; icon: React.ReactNode; dot?: boolean; go: () => void }> = [
    { f: "daily", label: "Daily", icon: <GameIcon name="daily" />, dot: dailyReady, go: () => setPanel("daily") },
    { f: "spin", label: "Spin", icon: <span className="pj-spin-ico" aria-hidden="true" />, dot: spinReady, go: () => setPanel("spin") },
    { f: "shop", label: "Shop", icon: <GameIcon name="shop" />, go: () => setPanel("shop") },
    { f: null, label: "Skins", icon: <Palette strokeWidth={2.4} />, go: () => setTab("skins") },
    { f: "challenges", label: "Challenges", icon: <GameIcon name="quests" />, go: () => setTab("challenges") },
  ];

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
        <div className="pj-lobby-chips">
          {profile.levelStreak >= 1 ? <span>🔥 {profile.levelStreak} win streak</span> : <span>🔥 Win 2 in a row for a free booster</span>}
          {profile.daily.streak >= 1 ? <span>📅 Day {profile.daily.streak}</span> : null}
        </div>
      </div>

      <div className="pj-lobby-tiles">
        {tiles.map((t) => {
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

      <button type="button" className="pj-lobby-ranks" onClick={() => setTab("ranks")}>
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
      </button>
    </div>
  );
}
