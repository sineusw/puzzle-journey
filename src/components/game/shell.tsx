import { useEffect, useRef, useState } from "react";
import { JungleAmbience } from "./ambient";
import { Crown, Gamepad2, Home, MoreHorizontal, Music, Trophy, Volume2, VolumeX } from "lucide-react";
import { ADVENTURE, goalLabel, starMoves, xpForLevel, type StarMoves } from "@/lib/game/content";
import { bindAudioLifecycle } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import { formatInt } from "@/lib/utils";
import { NightIsle } from "./background";
import { GameIcon } from "./icons";
import { Overlays, PowerBar, TabScreens } from "./overlays";
import { PlayArea } from "./play-area";
import { NoticeHost } from "./notice-host";
import { TutorialCoach, TutorialScreens, TutorialSkipBar } from "./tutorial-coach";
import { VisitorDirector } from "./visitors/director";

export function GameShell() {
  const hydrate = useGame((s) => s.hydrate);
  const persist = useGame((s) => s.persist);
  const start = useGame((s) => s.start);
  const skin = useGame((s) => s.profile.skin);
  const tutorialOn = useGame((s) => s.tutorial !== null);
  const tab = useGame((s) => s.tab);
  const setTab = useGame((s) => s.setTab);
  const setPanel = useGame((s) => s.setPanel);
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
      if (e.key === "Escape") {
        cancelTarget();
        setPanel(null);
      } else if (e.key === "1" || e.key === "2" || e.key === "3") {
        const i = Number(e.key) - 1;
        if (useGame.getState().match.tray[i]) selectPiece(i);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelTarget, selectPiece, setPanel]);

  return (
    <div className="pj-root" data-skin={skin} data-tutorial={tutorialOn ? "" : undefined}>
      <div className="pj-stars" />
      <NightIsle />
      <JungleAmbience />
      <VisitorDirector />
      <div className="pj-stage">
        <Hud />
        <TitleBar />

        {tab === "home" ? (
          <>
            <PlayArea />
            {tutorialOn ? <TutorialSkipBar /> : <PowerBar />}
          </>
        ) : (
          <TabScreens />
        )}

        <nav className="pj-nav" aria-label="Main">
          {(
            [
              ["home", "Home", Home],
              ["adventure", "Play", Gamepad2],
              ["challenges", "Challenges", Trophy],
              ["ranks", "Ranks", Crown],
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
      <TutorialScreens />
      <NoticeHost />
    </div>
  );
}

function Hud() {
  const level = useGame((s) => s.profile.level);
  const xp = useGame((s) => s.profile.xp);
  const coins = useGame((s) => s.profile.coins);
  const gems = useGame((s) => s.profile.gems);
  const sfx = useGame((s) => s.profile.settings.sfx);
  const music = useGame((s) => s.profile.settings.music);
  const setPanel = useGame((s) => s.setPanel);
  const toggleSetting = useGame((s) => s.toggleSetting);
  const xpPct = Math.min(100, Math.round((xp / xpForLevel(level)) * 100));
  return (
    <header className="pj-hud">
      <div className="pj-chip pj-chip-wide">
        <PalmBadge />
        <span className="tabular-nums pj-lv">Lv. {level}</span>
        <div className="pj-xp" aria-hidden="true">
          <span style={{ width: `${xpPct}%` }} />
        </div>
      </div>
      <div className="pj-chip">
        <GameIcon name="coin" className="pj-chip-ico" />
        <Counter value={coins} />
        <button type="button" className="pj-plus" onClick={() => setPanel("shop")} aria-label="Get coins">
          +
        </button>
      </div>
      <div className="pj-chip">
        <GameIcon name="gem" className="pj-chip-ico" />
        <Counter value={gems} />
        <button type="button" className="pj-plus" onClick={() => setPanel("shop")} aria-label="Get gems">
          +
        </button>
      </div>
      <div className="pj-chip pj-audio">
        <button
          type="button"
          className={`pj-audio-btn ${sfx ? "" : "is-off"}`}
          onClick={() => toggleSetting("sfx")}
          aria-label={sfx ? "Mute sound effects" : "Sound effects on"}
          title={sfx ? "Sound on" : "Sound off"}
        >
          {sfx ? <Volume2 /> : <VolumeX />}
        </button>
        <button
          type="button"
          className={`pj-audio-btn ${music ? "" : "is-off"}`}
          onClick={() => toggleSetting("music")}
          aria-label={music ? "Mute music" : "Music on"}
          title={music ? "Music on" : "Music off"}
        >
          <Music />
        </button>
      </div>
      <button type="button" className="pj-icon-btn" onClick={() => setPanel("settings")} aria-label="Settings">
        <GameIcon name="settings" className="pj-gear" />
      </button>
    </header>
  );
}

/** A number that bumps and floats "+N" whenever it goes up. */
function Counter({ value }: { value: number }) {
  const prev = useRef(value);
  const [gain, setGain] = useState<{ n: number; k: number } | null>(null);
  useEffect(() => {
    const diff = value - prev.current;
    prev.current = value;
    if (diff > 0) setGain({ n: diff, k: Date.now() });
  }, [value]);
  return (
    <span className="pj-counter">
      <span key={gain?.k ?? 0} className={`tabular-nums${gain ? " is-bump" : ""}`}>
        {formatInt(value)}
      </span>
      {gain ? (
        <span key={`g${gain.k}`} className="pj-counter-gain" aria-hidden="true">
          +{formatInt(gain.n)}
        </span>
      ) : null}
    </span>
  );
}

/** Live star pace under the goal: how many stars you're on track for. */
function StarPace({ moves, limits }: { moves: number; limits: StarMoves }) {
  const { three: par, two } = limits;
  const stars = moves <= par ? 3 : moves <= two ? 2 : 1;
  const left = stars === 3 ? par - moves : stars === 2 ? two - moves : 0;
  return (
    <div className={`pj-pace is-${stars}`} data-testid="star-pace" aria-label={`On track for ${stars} stars. Move ${moves}. Three stars in ${par} moves or fewer, two stars in ${two}.`}>
      <span className="pj-pace-stars" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <i key={n} className={n <= stars ? "is-on" : ""}>★</i>
        ))}
      </span>
      <span>
        {moves === 0
          ? `3★ in ${par} moves · 2★ in ${two}`
          : stars > 1
            ? `${left} move${left === 1 ? "" : "s"} left for ${stars}★`
            : "Finish for 1★"}
      </span>
    </div>
  );
}

function TitleBar() {
  const mode = useGame((s) => s.match.mode);
  const levelId = useGame((s) => s.match.levelId);
  const goalType = useGame((s) => s.match.goal?.type);
  const goalValue = useGame((s) => s.match.goal?.value);
  const goal = goalType && goalValue !== undefined ? { type: goalType, value: goalValue } : null;
  const goalProgress = useGame((s) => s.match.goalProgress);
  const score = useGame((s) => s.match.score);
  const combo = useGame((s) => s.match.combo);
  const shield = useGame((s) => s.match.shield);
  const sandboxBest = useGame((s) => s.profile.sandboxBest);
  const tutorial = useGame((s) => s.tutorial !== null);
  const moves = useGame((s) => s.match.moves);
  const limits = goal && levelId ? starMoves(goal, mode, levelId) : null;
  const goalPct = goal ? Math.min(100, Math.round((goalProgress / goal.value) * 100)) : 0;
  return (
    <div className="pj-title">
      <Logo />
      {tutorial ? (
        <TutorialCoach />
      ) : (
        <>
      <div className="pj-mode-label" data-testid="mode-label">{modeLabel({ mode, levelId })}</div>
      {goal ? (
        <div className="pj-objective" aria-label={`${goalLabel(goal)}. ${goalPct}% complete.`}>
          <div className="pj-objective-copy">
            <span>{goalLabel(goal)}</span>
            <strong className="tabular-nums">
              {Math.min(goalProgress, goal.value)}/{goal.value}
            </strong>
          </div>
          {limits ? <StarPace moves={moves} limits={limits} /> : null}
          <div className="pj-objective-track" aria-hidden="true">
            <span style={{ width: `${goalPct}%` }} />
            {goalProgress > 0 ? <i key={`g${goalProgress}`} className="pj-objective-shine" style={{ width: `${goalPct}%` }} /> : null}
          </div>
        </div>
      ) : (
        <div className="pj-score tabular-nums">
          {formatInt(score)}
          {mode === "sandbox" ? `  ·  best ${formatInt(Math.max(sandboxBest, score))}` : ""}
          {combo > 1 ? `  ·  combo ${combo}` : ""}
          {shield > 0 ? `  ·  frost ${shield}` : ""}
        </div>
      )}
        </>
      )}
    </div>
  );
}

function modeLabel(match: { mode: string; levelId: number | null }): string {
  if (match.mode === "adventure") {
    const lvl = ADVENTURE.find((l) => l.id === match.levelId);
    return lvl ? `Adventure · Island ${lvl.id} · ${lvl.name}` : "Adventure";
  }
  if (match.mode === "classic") return `Classic · Level ${match.levelId ?? 1}`;
  if (match.mode === "sandbox") return "Sandbox";
  return "Challenge";
}

function Logo() {
  // Approved stone-sign logo, cut from the Block Journey mockup. Static:
  // the title never moves behind active play.
  return (
    <div className="pj-logo">
      <img src="/art/logo.webp" alt="Block Journey — Clear · Relax · Level up" width={701} height={429} decoding="async" />
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
