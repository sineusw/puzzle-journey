import { useEffect } from "react";
import { Home, MapPin, MoreHorizontal, Music, Paintbrush, Trophy, Volume2, VolumeX } from "lucide-react";
import { goalLabel, xpForLevel } from "@/lib/game/content";
import { bindAudioLifecycle } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import { formatInt } from "@/lib/utils";
import { NightIsle } from "./background";
import { GameIcon } from "./icons";
import { Overlays, PowerBar, TabScreens } from "./overlays";
import { PlayArea } from "./play-area";

export function GameShell() {
  const hydrate = useGame((s) => s.hydrate);
  const persist = useGame((s) => s.persist);
  const start = useGame((s) => s.start);
  const profile = useGame((s) => s.profile);
  const match = useGame((s) => s.match);
  const tab = useGame((s) => s.tab);
  const setTab = useGame((s) => s.setTab);
  const setPanel = useGame((s) => s.setPanel);
  const toggleSetting = useGame((s) => s.toggleSetting);
  const rotateSelected = useGame((s) => s.rotateSelected);
  const cancelTarget = useGame((s) => s.cancelTarget);
  const selectPiece = useGame((s) => s.selectPiece);

  useEffect(() => {
    hydrate();
    const unbind = bindAudioLifecycle();
    const onHide = () => {
      if (document.visibilityState === "hidden") persist();
    };
    const onFirst = () => start();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", persist);
    window.addEventListener("pointerdown", onFirst, { once: true });
    return () => {
      unbind();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", persist);
      window.removeEventListener("pointerdown", onFirst);
    };
  }, [hydrate, persist, start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        rotateSelected();
      } else if (e.key === "Escape") {
        cancelTarget();
        setPanel(null);
      } else if (e.key === "1" || e.key === "2" || e.key === "3") {
        const i = Number(e.key) - 1;
        if (useGame.getState().match.tray[i]) selectPiece(i);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelTarget, rotateSelected, selectPiece, setPanel]);

  const xpNeed = xpForLevel(profile.level);
  const xpPct = Math.min(100, Math.round((profile.xp / xpNeed) * 100));
  const goalPct = match.goal
    ? Math.min(100, Math.round((match.goalProgress / match.goal.value) * 100))
    : 0;

  return (
    <div className="pj-root" data-skin={profile.skin}>
      <div className="pj-stars" />
      <NightIsle />
      <div className="pj-stage">
        <header className="pj-hud">
          <div className="pj-chip pj-chip-wide">
            <PalmBadge />
            <span className="tabular-nums pj-lv">Lv. {profile.level}</span>
            <div className="pj-xp" aria-hidden="true">
              <span style={{ width: `${xpPct}%` }} />
            </div>
          </div>
          <div className="pj-chip">
            <GameIcon name="coin" className="pj-chip-ico" />
            <span className="tabular-nums">{formatInt(profile.coins)}</span>
            <button type="button" className="pj-plus" onClick={() => setPanel("shop")} aria-label="Get coins">
              +
            </button>
          </div>
          <div className="pj-chip">
            <GameIcon name="gem" className="pj-chip-ico" />
            <span className="tabular-nums">{formatInt(profile.gems)}</span>
            <button type="button" className="pj-plus" onClick={() => setPanel("shop")} aria-label="Get gems">
              +
            </button>
          </div>
          <div className="pj-chip pj-audio">
            <button
              type="button"
              className={`pj-audio-btn ${profile.settings.sfx ? "" : "is-off"}`}
              onClick={() => toggleSetting("sfx")}
              aria-label={profile.settings.sfx ? "Mute sound effects" : "Sound effects on"}
              title={profile.settings.sfx ? "Sound on" : "Sound off"}
            >
              {profile.settings.sfx ? <Volume2 /> : <VolumeX />}
            </button>
            <button
              type="button"
              className={`pj-audio-btn ${profile.settings.music ? "" : "is-off"}`}
              onClick={() => toggleSetting("music")}
              aria-label={profile.settings.music ? "Mute music" : "Music on"}
              title={profile.settings.music ? "Music on" : "Music off"}
            >
              <Music />
            </button>
          </div>
          <button
            type="button"
            className="pj-icon-btn"
            onClick={() => setPanel("settings")}
            aria-label="Settings"
          >
            <GameIcon name="settings" className="pj-gear" />
          </button>
        </header>

        <div className="pj-title">
          <Logo />
          {match.goal ? (
            <div className="pj-objective" aria-label={`${goalLabel(match.goal)}. ${goalPct}% complete.`}>
              <div className="pj-objective-copy">
                <span>{goalLabel(match.goal)}</span>
                <strong className="tabular-nums">
                  {Math.min(match.goalProgress, match.goal.value)}/{match.goal.value}
                </strong>
              </div>
              <div className="pj-objective-track" aria-hidden="true">
                <span style={{ width: `${goalPct}%` }} />
              </div>
            </div>
          ) : (
            <div className="pj-score tabular-nums">
              {formatInt(match.score)}
              {match.combo > 1 ? `  ·  x${match.combo}` : ""}
              {match.shield > 0 ? `  ·  frost ${match.shield}` : ""}
            </div>
          )}
        </div>

        {tab === "home" ? (
          <>
            <PlayArea />
            <PowerBar />
          </>
        ) : (
          <TabScreens />
        )}

        <nav className="pj-nav" aria-label="Main">
          {(
            [
              ["home", "Home", Home],
              ["adventure", "Adventure", MapPin],
              ["challenges", "Challenges", Trophy],
              ["skins", "Skins", Paintbrush],
              ["more", "More", MoreHorizontal],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              data-nav={id}
              className={`pj-nav-btn ${tab === id ? "is-on" : ""}`}
              onClick={() => setTab(id)}
            >
              <Icon className="pj-nav-svg" strokeWidth={2.4} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <Overlays />
    </div>
  );
}

function Logo() {
  return (
    <div className="pj-bob">
      <span className="pj-crown" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-6">
          <path
            fill="#f0c14a"
            stroke="#8a4a08"
            strokeWidth="1.4"
            d="M3 18h18l-1.2-9-5.3 4.2L12 6l-2.5 7.2L4.2 9z"
          />
        </svg>
      </span>
      <span className="pj-word pj-word-a">PUZZLE</span>
      <span className="pj-word pj-word-b">JOURNEY</span>
      <div className="pj-tag">Clear · Relax · Level up</div>
    </div>
  );
}

function PalmBadge() {
  return (
    <span className="pj-avatar" aria-hidden="true">
      <svg viewBox="0 0 32 32" className="size-full">
        <defs>
          <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff9a62" />
            <stop offset="55%" stopColor="#7a3a88" />
            <stop offset="100%" stopColor="#1a2850" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="16" fill="url(#dusk)" />
        <circle cx="22" cy="10" r="4" fill="#ffe7a8" />
        <path d="M8 24c4-1 8-1 16 0v2H8z" fill="#16301c" />
        <path d="M16 22V12" stroke="#4a2a12" strokeWidth="1.6" />
        <path d="M16 13c-6-1-8-5-8-5 3 1 7 2 8 5z" fill="#1d6a32" />
        <path d="M16 13c6-1 8-5 8-5-3 1-7 2-8 5z" fill="#24823c" />
        <path d="M16 14c-4 3-8 3-8 3 3-1 6-2 8-3z" fill="#185828" />
      </svg>
    </span>
  );
}
