import { isNative } from "@/lib/game/native";
import { LobbyScreen, ChestBar, shareRun, shareDaily } from "./lobby";
import { useEffect, useState, type ReactNode } from "react";
import {
  Crown,
  Info,
  Lock,
  Paintbrush,
  Sparkles,
  Music,
  RotateCcw,
  Settings,
  Star,
  Volume2,
  VolumeX,
  Vibrate,
  X,
} from "lucide-react";
import {
  ADVENTURE,
  CHALLENGES,
  CLASSIC,
  UNLOCKS,
  goalLabel,
  xpForLevel,
  starPar,
  starsFor,
  unlockedPowers,
  unlockLevel,
  FEATURE_AT,
  type FeatureId,
} from "@/lib/game/content";
import { useGame } from "@/lib/game/store";
import { VISITOR_IDS, VISITOR_META } from "@/lib/game/visitors";
import { formatInt } from "@/lib/utils";
import { GameIcon, type IconName } from "./icons";
import * as audio from "@/lib/game/audio";
import { cheer } from "@/lib/game/voice";
import { nameFor, useBoard } from "@/lib/game/leaderboard";
import { categories, dayKey, iqLabel, rank } from "@/lib/game/stats";
import { OverlayFace, SpecialFace } from "./tile-art";
import { ShapeGallery, SPECIAL_WORDS, SpecialDemo } from "./explainers";
import { ChallengeScreen, RanksScreen } from "./competition";
import { Fireworks } from "./fireworks";
import { lessonForUnlock } from "@/lib/game/tutorial";
import { dailySet, rollover } from "@/lib/game/challenges";
import { AdventureMap } from "./adventure-map";
import {
  ContinueOptions,
  DailySheet,
  EventsSheet,
  HouseAd,
  QuestSheet,
  ShopSheet,
  SkinsScreen,
  SpinSheet,
} from "./store-ui";
import { normalizeLive } from "@/lib/game/liveops";
import { useHouseAd } from "@/lib/game/ads";

export function SideRails({ side }: { side: "l" | "r" }) {
  const setPanel = useGame((s) => s.setPanel);
  const dailyNextAt = useGame((s) => s.profile.daily.nextAt);
  const firstIsland = useGame((s) => s.profile.adventure.unlocked === 1);
  const setTab = useGame((s) => s.setTab);
  const spinReady = useGame((s) => !normalizeLive(s.profile.live).spin.free);
  const reached = useGame((s) =>
    Math.max(s.profile.adventure.unlocked, s.profile.classic.unlocked),
  );
  // Red dot while today's challenges aren't all done.
  // Red dot while there's a reward to claim or today's set isn't done.
  const challengesLeft = useGame((s) => {
    const st = rollover(s.profile.challenges);
    return (
      st.done.some((id) => !(st.claimed ?? []).includes(id)) ||
      dailySet(st.day).some((c) => !st.done.includes(c.id))
    );
  });

  const has = (f: FeatureId) => reached >= FEATURE_AT[f];
  const fresh = (f: FeatureId) => reached >= FEATURE_AT[f] && reached <= FEATURE_AT[f] + 1;
  const NewTag = ({ f }: { f: FeatureId }) =>
    fresh(f) ? <span className="pj-rail-new">NEW</span> : null;

  if (side === "l") {
    return (
      <div className="pj-rails pj-rails-l">
        {has("daily") ? <DailyRail nextAt={dailyNextAt} onOpen={() => setPanel("daily")} /> : null}
        {has("spin") ? (
          <button type="button" className="pj-rail relative" onClick={() => setPanel("spin")}>
            {spinReady ? <span className="pj-badge" /> : null}
            <NewTag f="spin" />
            <span className="pj-spin-ico" aria-hidden="true" />
            <span className="pj-rail-label">Spin</span>
          </button>
        ) : null}
        {has("events") ? (
          <button type="button" className="pj-rail relative" onClick={() => setPanel("events")}>
            <NewTag f="events" />
            <GameIcon name="events" />
            <span className="pj-rail-label">Events</span>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pj-rails pj-rails-r">
      {has("map") ? (
        <button type="button" className="pj-rail relative" onClick={() => setPanel("map")}>
          {firstIsland ? <span className="pj-badge" /> : null}
          <NewTag f="map" />
          <GameIcon name="map" />
          <span className="pj-rail-label">Map</span>
        </button>
      ) : null}
      {has("challenges") ? (
        <button
          type="button"
          className="pj-rail relative"
          data-testid="rail-challenges"
          onClick={() => setTab("challenges")}
        >
          {challengesLeft ? <span className="pj-badge" /> : null}
          <NewTag f="challenges" />
          <GameIcon name="quests" />
          <span className="pj-rail-label">Challenges</span>
        </button>
      ) : null}
      {has("shop") ? (
        <button type="button" className="pj-rail relative" onClick={() => setPanel("shop")}>
          <NewTag f="shop" />
          <GameIcon name="shop" />
          <span className="pj-rail-label">Shop</span>
        </button>
      ) : null}
    </div>
  );
}

/** Re-renders itself once a second; nothing else on screen does. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function DailyRail({ nextAt, onOpen }: { nextAt: number; onOpen: () => void }) {
  const ready = useNow() >= nextAt;
  return (
    <button type="button" className="pj-rail relative" onClick={onOpen}>
      {ready ? <span className="pj-badge" /> : null}
      <GameIcon name="daily" />
      <span className="pj-rail-label">Daily</span>
    </button>
  );
}

export function PowerBar() {
  const powerups = useGame((s) => s.profile.powerups);
  const targeting = useGame((s) => s.targeting);
  const armPower = useGame((s) => s.armPower);
  const setPanel = useGame((s) => s.setPanel);
  const reached = useGame((s) =>
    Math.max(s.profile.adventure.unlocked, s.profile.classic.unlocked),
  );
  const open = unlockedPowers(reached);
  const all: Array<{
    id: "hammer" | "refresh" | "bomb" | "freeze";
    label: string;
    icon: IconName;
  }> = [
    { id: "hammer", label: "Hammer", icon: "hammer" },
    { id: "refresh", label: "Reroll", icon: "refresh" },
    { id: "bomb", label: "Bomb", icon: "bomb" },
    { id: "freeze", label: "Frost", icon: "frost" },
  ];
  // All four always show; locked ones say which island opens them.
  const items = all;
  const lockAt = (id: string) => unlockLevel(({ hammer: "hammer", refresh: "reroll", bomb: "boom", freeze: "frost" } as const)[id as "hammer"]);
  return (
    <div className="pj-powers">
      {items.map((item) => (
        <div key={item.id} className="pj-power-wrap">
          {open.includes(item.id) ? (
            <>
              <button
                type="button"
                data-testid={`power-${item.id}`}
                data-id={item.id}
                className={`pj-power ${targeting === item.id ? "is-armed" : ""} ${powerups[item.id] <= 0 ? "is-empty" : ""}`}
                onClick={() => armPower(item.id)}
                aria-label={item.label}
              >
                <GameIcon name={item.icon} />
                <span className="pj-count">{powerups[item.id]}</span>
              </button>
              <button type="button" className="pj-add" onClick={() => setPanel("shop")} aria-label={`Buy ${item.label}`}>
                +
              </button>
            </>
          ) : (
            <button
              type="button"
              data-testid={`power-${item.id}`}
              className="pj-power is-locked"
              onClick={() => {
                useGame.getState().setToast(`${item.label} unlocks on island ${lockAt(item.id)}!`);
                window.setTimeout(() => useGame.getState().setToast(null), 1600);
              }}
              aria-label={`${item.label}, unlocks on island ${lockAt(item.id)}`}
            >
              <GameIcon name={item.icon} />
              <span className="pj-power-lock">
                <Lock className="size-3" /> {lockAt(item.id)}
              </span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function TabScreens() {
  const tab = useGame((s) => s.tab);
  if (tab === "home") return null;
  return (
    <div className={`pj-screen pj-tabscreen-in${tab === "lobby" ? " is-lobby" : ""}`} key={tab}>
      {tab === "lobby" ? <LobbyScreen /> : null}
      {tab === "adventure" ? <AdventureScreen /> : null}
      {tab === "challenges" ? <ChallengeScreen /> : null}
      {tab === "skins" ? <SkinsScreen /> : null}
      {tab === "ranks" ? <RanksScreen /> : null}
      {tab === "more" ? <MoreScreen /> : null}
    </div>
  );
}

export function Overlays() {
  const panel = useGame((s) => s.panel);
  const toast = useGame((s) => s.toast);
  const levelUpTo = useGame((s) => s.levelUpTo);
  const dismissLevelUp = useGame((s) => s.dismissLevelUp);

  return (
    <>
      {toast ? <div className="pj-toast">{toast}</div> : null}
      <HouseAd />
      {levelUpTo && panel !== "over" && panel !== "won" ? (
        <LevelUpSheet level={levelUpTo} onClose={dismissLevelUp} />
      ) : null}
      {panel ? (
        <div
          className="pj-modal center"
          role="dialog"
          aria-modal="true"
          onPointerDown={(e) => {
            // Tap outside a menu or card to close it (results need a choice).
            if (
              e.target === e.currentTarget &&
              panel !== "over" &&
              panel !== "won" &&
              !useHouseAd.getState().open
            ) {
              if (panel === "how") useGame.getState().start();
              useGame.getState().setPanel(null);
            }
          }}
        >
          {panel === "shop" ? <ShopSheet /> : null}
          {panel === "quests" ? <QuestSheet /> : null}
          {panel === "daily" ? <DailySheet /> : null}
          {panel === "events" ? <EventsSheet /> : null}
          {panel === "map" ? <MapSheet /> : null}
          {panel === "settings" ? <SettingsSheet /> : null}
          {panel === "how" ? <HowSheet /> : null}
          {panel === "over" ? <OverSheet /> : null}
          {panel === "won" ? <WonSheet /> : null}
          {panel === "intro" ? <IntroSheet /> : null}
          {panel === "spin" ? <SpinSheet /> : null}
        </div>
      ) : null}
    </>
  );
}

function LevelUpSheet({ level, onClose }: { level: number; onClose: () => void }) {
  useEffect(() => {
    audio.feelLevelComplete();
    cheer("Level up!", { delayMs: 200, priority: true });
  }, [level]);
  return (
    <div
      className="pj-modal center"
      role="dialog"
      aria-label="Level up"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="pj-sheet pj-result text-center">
        <p className="text-sm font-extrabold tracking-widest text-gold uppercase">Level up</p>
        <h2 className="pj-result-title mt-1 font-display text-cream">Lv. {level}</h2>
        <p className="mt-2 text-sm text-cream/85">
          You're getting better every round. Here's a little coin to celebrate.
        </p>
        <button type="button" className="pj-btn pj-btn-primary mt-5 w-full" onClick={onClose}>
          Keep going
        </button>
      </div>
    </div>
  );
}

function Sheet({ title, children }: { title: string; children: ReactNode }) {
  const setPanel = useGame((s) => s.setPanel);
  return (
    <div className="pj-sheet">
      <button type="button" className="pj-close" onClick={() => setPanel(null)} aria-label="Close">
        <X className="size-4" />
      </button>
      <h2 className="font-display text-2xl text-cream pr-8">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function MapSheet() {
  return (
    <Sheet title="Island map">
      <AdventureMap />
    </Sheet>
  );
}

function SettingsSheet() {
  const profile = useGame((s) => s.profile);
  const toggleSetting = useGame((s) => s.toggleSetting);
  const setPanel = useGame((s) => s.setPanel);
  const startSandbox = useGame((s) => s.startSandbox);
  const resetProgress = useGame((s) => s.resetProgress);
  return (
    <Sheet title="Settings">
      <ToggleRow
        label="Sound effects"
        icon={profile.settings.sfx ? Volume2 : VolumeX}
        on={profile.settings.sfx}
        onClick={() => toggleSetting("sfx")}
      />
      <ToggleRow
        label="Music"
        icon={profile.settings.music ? Music : VolumeX}
        on={profile.settings.music}
        onClick={() => toggleSetting("music")}
      />
      <ToggleRow
        label="Voice cheers"
        icon={profile.settings.voice !== false ? Volume2 : VolumeX}
        on={profile.settings.voice !== false}
        onClick={() => toggleSetting("voice")}
      />
      <ToggleRow
        label="Screen shake"
        icon={Vibrate}
        on={profile.settings.shake}
        onClick={() => toggleSetting("shake")}
      />
      <p className="text-xs text-muted">Music: Cozy Puzzle In-Game 1 by MintoDog (CC0).</p>
      <button type="button" className="pj-btn pj-btn-ghost w-full" onClick={() => setPanel("how")}>
        How to play
      </button>
      <button type="button" className="pj-btn pj-btn-ghost w-full" onClick={startSandbox}>
        New Sandbox run
      </button>
      {isNative() ? (
        <button type="button" className="pj-btn pj-btn-ghost w-full" onClick={() => void useGame.getState().restorePurchases()}>
          Restore purchases
        </button>
      ) : null}
      <a className="pj-btn pj-btn-ghost w-full text-center" href="https://puzzle-journey-ruby.vercel.app/privacy" target="_blank" rel="noreferrer">
        Privacy policy
      </a>
      <button
        type="button"
        className="pj-btn pj-btn-ghost w-full text-danger"
        onClick={resetProgress}
      >
        Reset progress
      </button>
      <VisitorDebug />
    </Sheet>
  );
}

function VisitorDebug() {
  const summonVisitor = useGame((s) => s.summonVisitor);
  const setPanel = useGame((s) => s.setPanel);
  return (
    <div className="pj-vis-debug" data-testid="visitor-debug">
      <p className="text-xs text-muted">Island Visitors — test summon</p>
      <div className="pj-vis-debug-row">
        {VISITOR_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className="pj-btn pj-btn-ghost"
            data-testid={`summon-${id}`}
            onClick={() => {
              setPanel(null);
              window.setTimeout(() => summonVisitor(id), 40);
            }}
          >
            {VISITOR_META[id].name}
          </button>
        ))}
      </div>
    </div>
  );
}

function HowSheet() {
  const setPanel = useGame((s) => s.setPanel);
  const startTutorial = useGame((s) => s.startTutorial);
  const start = useGame((s) => s.start);
  return (
    <div className="pj-sheet text-left">
      <h2 className="font-display text-2xl text-cream">How to play</h2>
      <ol className="mt-3 space-y-2 text-[15px] leading-snug text-cream/90">
        <li>1. Drag a block from the tray under the board onto the grid.</li>
        <li>2. Fill a whole row or column to clear it. Fill several and they all pop at once.</li>
        <li>3. Clear again within 3 drops to keep your combo going.</li>
      </ol>
      <h3 className="pj-how-h">Not your usual blocks</h3>
      <ShapeGallery />
      <p className="pj-how-p">
        These aren’t Tetris pieces. Some have <b>gaps</b> between their blocks, the gaps stay empty,
        and pieces <b>never rotate</b>. Look at all three before you drop one.
      </p>
      <h3 className="pj-how-h">Special blocks (Adventure)</h3>
      <SpecialDemo kind="rocketV" />
      <p className="pj-how-p">
        Special blocks go off <b>the moment you put them down</b>.
      </p>
      <ul className="pj-how-legend is-wide">
        {(["rocketV", "rocketH", "bomb", "blast"] as const).map((k) => (
          <li key={k}>
            <span className="pj-how-ico">
              <SpecialFace kind={k} />
            </span>
            <span>
              <b>{SPECIAL_WORDS[k].name}:</b> {SPECIAL_WORDS[k].does}
            </span>
          </li>
        ))}
      </ul>
      <h3 className="pj-how-h">Ways to play</h3>
      <p className="pj-how-p">
        <b>Adventure</b> adds one new special block or Island Visitor at a time. <b>Classic</b> is
        plain-block levels. <b>Sandbox</b> is endless, for your high score. After each run you get a
        Puzzle IQ and can win awards on the Ranks tab.
      </p>
      <button
        type="button"
        className="pj-btn pj-btn-ghost mt-5 w-full"
        data-testid="replay-tutorial"
        onClick={() => startTutorial("basics", true)}
      >
        Play the tutorial
      </button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="pj-btn pj-btn-ghost w-full"
          data-testid="practice-arrows"
          onClick={() => startTutorial("arrows")}
        >
          Try arrows
        </button>
        <button
          type="button"
          className="pj-btn pj-btn-ghost w-full"
          data-testid="practice-bombs"
          onClick={() => startTutorial("bombs")}
        >
          Try bombs
        </button>
      </div>
      <button
        type="button"
        className="pj-btn pj-btn-primary mt-2 w-full"
        data-testid="play-start"
        onClick={() => {
          start();
          setPanel(null);
        }}
      >
        Got it
      </button>
    </div>
  );
}

function modeName(mode: string): string {
  return mode === "adventure"
    ? "Adventure"
    : mode === "classic"
      ? "Classic"
      : mode === "sandbox"
        ? "Sandbox"
        : "Challenge";
}

/** Counts a number up from 0 over `ms`, ticking a rising note as it goes. */
function useCountUp(target: number, ms: number, startDelay: number): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    let lastTick = 0;
    const t0 = performance.now() + startDelay;
    const step = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - t0) / ms));
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t > 0 && now - lastTick > 70 && t < 1) {
        lastTick = now;
        audio.feelTick(t);
      }
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, startDelay]);
  return value;
}

/** Puzzle IQ reveal plus the "paper plate" awards this run earned. */
function IqAndAwards({ delay }: { delay: number }) {
  const result = useGame((s) => s.lastResult);
  const [shownAwards, setShownAwards] = useState(0);
  const iq = result?.iq ?? 100;
  const shownIq = useCountUp(iq - 70, 900, delay);
  const label = iqLabel(iq, result?.pct ?? null, result?.versus ?? "your games");
  const awards = result?.awards ?? [];
  useEffect(() => {
    if (!result) return;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => audio.feelMilestone(), delay + 950));
    awards.forEach((a, i) =>
      timers.push(
        window.setTimeout(
          () => {
            setShownAwards(i + 1);
            audio.feelStar(Math.min(i, 2));
            if (i === 0)
              cheer(a.kind === "first" ? `You won ${a.title}!` : "New personal record!", {
                delayMs: 150,
              });
          },
          delay + 1300 + i * 550,
        ),
      ),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
    // Play once when the results open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!result) return null;
  return (
    <div className="pj-iq-block">
      <div className="pj-iq" data-testid="puzzle-iq">
        <div className="pj-iq-label">Puzzle IQ</div>
        <div className="pj-iq-value tabular-nums">{70 + shownIq}</div>
        <div className="pj-iq-headline">{label.headline}</div>
        <div className="pj-iq-note">{label.note}</div>
      </div>
      {awards.length ? (
        <ul className="pj-awards" data-testid="awards">
          {awards.slice(0, shownAwards).map((a) => (
            <li key={a.title} className={`pj-award is-${a.kind}`}>
              <span className="pj-award-plate" aria-hidden="true">
                <Crown className="size-4" />
              </span>
              <span className="pj-award-text">
                <strong>{a.kind === "first" ? `#1 · ${a.title}` : a.title}</strong>
                <span>{a.value}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="pj-iq-fine">Puzzle IQ rates this run's play, not a real IQ test.</p>
    </div>
  );
}

function RunStats() {
  const lines = useGame((s) => s.match.lines);
  const bestCombo = useGame((s) => s.match.bestCombo);
  const perfects = useGame((s) => s.match.perfects);
  return (
    <div className="pj-run-stats">
      <div>
        <strong className="tabular-nums">{lines}</strong>
        <span>Lines</span>
      </div>
      <div>
        <strong className="tabular-nums">×{bestCombo}</strong>
        <span>Best combo</span>
      </div>
      <div>
        <strong className="tabular-nums">{perfects}</strong>
        <span>Perfects</span>
      </div>
    </div>
  );
}

function OverSheet() {
  const profile = useGame((s) => s.profile);
  const match = useGame((s) => s.match);
  const bestAtStart = useGame((s) => s.run.bestAtStart);
  const newGame = useGame((s) => s.newGame);
  const setTab = useGame((s) => s.setTab);
  const sandbox = match.mode === "sandbox";
  const best = sandbox ? profile.sandboxBest : profile.highScore;
  const beatBest =
    match.score > 0 && match.score > bestAtStart && bestAtStart > 0 && (sandbox || !match.goal);
  const pct = match.goal ? Math.min(1, match.goalProgress / match.goal.value) : 0;
  const left = match.goal ? Math.max(0, match.goal.value - match.goalProgress) : 0;
  const unit =
    match.goal?.type === "lines"
      ? left === 1
        ? "line"
        : "lines"
      : match.goal?.type === "combo"
        ? "combo steps"
        : "points";
  const [title, sub] = beatBest
    ? [
        "New best!",
        `You beat your best by ${formatInt(match.score - bestAtStart)} points. Amazing run!`,
      ]
    : match.goal && pct >= 0.85
      ? ["So close!", `Only ${formatInt(left)} ${unit} to go. You've got this!`]
      : match.goal && pct >= 0.5
        ? ["Nice run!", "You made it more than halfway. One more try?"]
        : match.goal
          ? ["Good try!", "Every run makes you sharper. Go again!"]
          : [
              "Nice run!",
              `You cleared ${match.lines} ${match.lines === 1 ? "line" : "lines"}. Can you beat ${formatInt(best)}?`,
            ];
  const shown = useCountUp(match.score, 900, 350);
  useEffect(() => {
    if (beatBest) audio.feelNewBest();
    else audio.feelRoundOver();
    cheer(title, { delayMs: 300, priority: true });
    // Play once when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="pj-sheet pj-result is-won text-center" data-testid="over-sheet">
      <p className="text-xs font-extrabold tracking-widest text-gold uppercase">
        {modeName(match.mode)}
      </p>
      <h2 className="pj-result-title mt-1 font-display text-cream">{title}</h2>
      <p className="mx-auto mt-1 max-w-[30ch] text-sm text-cream/85">{sub}</p>
      <div className="pj-result-score tabular-nums">{formatInt(shown)}</div>
      {match.goal ? (
        <div className="pj-result-progress" aria-label={`${Math.round(pct * 100)}% of the goal`}>
          <span style={{ width: `${Math.round(pct * 100)}%` }} />
        </div>
      ) : (
        <p className="text-xs text-muted">Best {formatInt(Math.max(best, match.score))}</p>
      )}
      <RunStats />
      <IqAndAwards delay={700} />
      <ContinueOptions />
      <div className="pj-won-actions">
        {beatBest ? (
          <button type="button" className="pj-btn pj-btn-ghost" onClick={() => shareRun(match.score, match.bestCombo, match.levelId)}>
            Share
          </button>
        ) : (
          <button type="button" className="pj-btn pj-btn-ghost" onClick={() => setTab("adventure")}>
            Map
          </button>
        )}
        <button type="button" className="pj-btn pj-btn-primary pj-won-next" onClick={newGame}>
          {match.levelId ? "Try again ↻" : "Play again ↻"}
        </button>
      </div>
    </div>
  );
}

const WIN_LINES: Record<number, [string, string]> = {
  3: ["Flawless!", "Three stars. You're a natural!"],
  2: ["Great job!", "Smooth moves. One more star is within reach!"],
  1: ["You did it!", "Island cleared. On to the next adventure!"],
};

function WonSheet() {
  const match = useGame((s) => s.match);
  const profile = useGame((s) => s.profile);
  const startAdventure = useGame((s) => s.startAdventure);
  const startClassic = useGame((s) => s.startClassic);
  const newGame = useGame((s) => s.newGame);
  const setTab = useGame((s) => s.setTab);
  const id = match.levelId;
  const nextId = id ? id + 1 : null;
  const list = match.mode === "classic" ? CLASSIC : ADVENTURE;
  const unlocked = match.mode === "classic" ? profile.classic.unlocked : profile.adventure.unlocked;
  const nextOpen = nextId !== null && nextId <= unlocked && list.some((l) => l.id === nextId);
  const nextNew =
    match.mode === "adventure" && nextId
      ? ADVENTURE.find((l) => l.id === nextId)?.introduces
      : undefined;
  // Stars earned this run (not the saved best), so the reveal matches the play.
  const stars = starsFor(match.goal, match.moves, match.mode, match.levelId);
  const par = match.goal ? starPar(match.goal, match.mode, match.levelId) : 0;
  const reward = id
    ? list.find((l) => l.id === id)?.reward
    : CHALLENGES.find((c) => c.goal.type === match.goal?.type && c.goal.value === match.goal?.value)
        ?.reward;
  const [lit, setLit] = useState(0);
  const shown = useCountUp(match.score, 1000, 400 + stars * 450);
  const [title, sub] = WIN_LINES[stars]!;
  useEffect(() => {
    audio.feelLevelComplete();
    cheer(
      stars === 3
        ? "Amazing! Three stars!"
        : match.mode === "classic"
          ? "Level cleared! Great job!"
          : "Island cleared! Great job!",
      {
        delayMs: 200,
        priority: true,
      },
    );
    const timers = Array.from({ length: stars }, (_, i) =>
      window.setTimeout(
        () => {
          setLit(i + 1);
          audio.feelStar(i);
        },
        650 + i * 450,
      ),
    );
    const coinTimer = window.setTimeout(() => audio.feelCoins(5), 1500 + stars * 450);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(coinTimer);
    };
    // Play once when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <Fireworks />
      <div className="pj-sheet pj-result is-won text-center" data-testid="won-sheet">
        <div className="pj-result-stars" aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`pj-result-star ${n <= lit ? "is-lit" : ""} ${n === 2 ? "is-mid" : ""}`}
            >
              <Star fill="currentColor" />
            </span>
          ))}
        </div>
        <h2 className="pj-result-title mt-1 font-display text-cream">{title}</h2>
        <p className="mx-auto mt-1 max-w-[30ch] text-sm text-cream/85">{sub}</p>
        {par ? (
          <p className="pj-star-hint" data-testid="star-hint">
            Done in <b>{match.moves}</b> moves
            {stars < 3 ? <> · ★★★ takes {par} or fewer</> : <> · par was {par}</>}
          </p>
        ) : null}
        <div className="pj-result-score tabular-nums">{formatInt(shown)}</div>
        <p className="text-xs text-muted">
          {match.goal ? goalLabel(match.goal) : "Challenge complete"}
        </p>
        <RunStats />
        <IqAndAwards delay={900 + stars * 450} />
        <ChestBar />
        {reward ? (
          <p className="pj-result-reward">
            <GameIcon name="coin" className="inline size-5" /> +{reward.coins}
            <GameIcon name="gem" className="ml-3 inline size-5" /> +{reward.gems}
          </p>
        ) : null}
        {nextNew ? (
          <p className="mt-2 text-sm font-extrabold text-gold">
            <Sparkles className="mr-1 inline size-4" />
            Next: {UNLOCKS[nextNew].name}
          </p>
        ) : null}
        {profile.levelStreak >= 2 ? (
          <div className="pj-streak-warn mt-2">
            🔥 {profile.levelStreak} wins in a row! Next level gives you a free{" "}
            {profile.levelStreak >= 6
              ? "arrow, bomb and golden block"
              : profile.levelStreak >= 4
                ? "arrow and bomb"
                : "arrow block"}
            .
          </div>
        ) : profile.levelStreak === 1 ? (
          <div className="pj-streak-warn mt-2">🔥 Win the next level for a free arrow block!</div>
        ) : null}
        <div className="pj-won-actions">
          <button
            type="button"
            className="pj-btn pj-btn-ghost"
            onClick={() =>
              match.daily
                ? shareDaily(match.daily, match.moves, starsFor(match.goal, match.moves, match.mode, match.levelId), useGame.getState().profile.puzzleStreak)
                : shareRun(match.score, match.bestCombo, match.levelId)
            }
          >
            Share
          </button>
          {match.daily ? (
            <button type="button" className="pj-btn pj-btn-primary pj-won-next" onClick={() => setTab("lobby")}>
              Home ▶
            </button>
          ) : nextOpen && nextId ? (
            <button
              type="button"
              className="pj-btn pj-btn-primary pj-won-next"
              onClick={() => (match.mode === "classic" ? startClassic(nextId) : startAdventure(nextId))}
            >
              {match.mode === "classic" ? "Next level ▶" : "Next island ▶"}
            </button>
          ) : (
            <button type="button" className="pj-btn pj-btn-primary pj-won-next" onClick={newGame}>
              Play again
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function IntroSheet() {
  const unlock = useGame((s) => s.introUnlock);
  const setPanel = useGame((s) => s.setPanel);
  const startTutorial = useGame((s) => s.startTutorial);
  const lesson = lessonForUnlock(unlock);
  if (!unlock) return null;
  const info = UNLOCKS[unlock];
  return (
    <div className="pj-sheet pj-intro text-center" data-testid="intro-card">
      <p className="pj-intro-new">
        <Sparkles className="mr-1 inline size-4" />
        New on this island
      </p>
      <div className={`pj-intro-art is-${info.kind}${info.special ? " is-demo" : ""}`}>
        {info.special ? (
          <SpecialDemo kind={info.special} />
        ) : info.kind === "visitor" ? (
          <img src={info.art} alt="" />
        ) : info.power ? (
          <img src={info.art} alt="" className="pj-intro-power" />
        ) : info.overlay ? (
          <span className="pj-intro-tile pj-cube" style={{ backgroundImage: `url(${info.art})` }}>
            <span className="pj-cube-layers">
              <OverlayFace kind={info.overlay} />
            </span>
          </span>
        ) : (
          <span className="pj-intro-tile" style={{ backgroundImage: `url(${info.art})` }}>
            {info.special ? <SpecialFace kind={info.special} /> : null}
          </span>
        )}
      </div>
      <h2 className="mt-2 font-display text-3xl text-cream">{info.name}</h2>
      <p className="mx-auto mt-2 max-w-[30ch] text-sm text-cream/85">{info.blurb}</p>
      {unlock === "arrows" ? (
        <p className="mx-auto mt-2 max-w-[30ch] text-sm text-cream/85">
          <b>↕</b> zaps up and down. <b>↔</b> zaps side to side.
        </p>
      ) : null}
      {lesson ? (
        <>
          <button
            type="button"
            className="pj-btn pj-btn-primary mt-5 w-full"
            data-testid="intro-try"
            onClick={() => startTutorial(lesson)}
          >
            Try it!
          </button>
          <button
            type="button"
            className="pj-btn pj-btn-ghost mt-2 w-full"
            data-testid="intro-go"
            onClick={() => setPanel(null)}
          >
            Skip
          </button>
        </>
      ) : (
        <button
          type="button"
          className="pj-btn pj-btn-primary mt-5 w-full"
          data-testid="intro-go"
          onClick={() => setPanel(null)}
        >
          Let’s go
        </button>
      )}
    </div>
  );
}

type PlayMode = "adventure" | "classic" | "sandbox";

function AdventureScreen() {
  const current = useGame((s) => s.match.mode);
  const [mode, setMode] = useState<PlayMode>(
    current === "classic" || current === "sandbox" ? current : "adventure",
  );
  const modes: Array<{ id: PlayMode; label: string; blurb: string }> = [
    {
      id: "adventure",
      label: "Adventure",
      blurb: "Islands that add a new special block or visitor as you go.",
    },
    {
      id: "classic",
      label: "Classic",
      blurb: "Thirty levels with plain blocks only. No specials, no visitors.",
    },
    { id: "sandbox", label: "Sandbox", blurb: "Endless plain blocks. Chase your highest score." },
  ];
  const reachedMode = useGame((s) =>
    Math.max(s.profile.adventure.unlocked, s.profile.classic.unlocked),
  );
  const shown = modes.filter((m) => m.id === "adventure" || reachedMode >= FEATURE_AT[m.id]);
  const active = shown.find((m) => m.id === mode) ?? shown[0]!;
  return (
    <div className={active.id === "adventure" ? "pj-play is-map" : "pj-play"}>
      {shown.length > 1 ? (
        <div className="pj-modes mt-3" role="tablist" aria-label="Game mode">
          {shown.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              data-testid={`mode-${m.id}`}
              className={`pj-mode-tab ${mode === m.id ? "is-on" : ""}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      ) : null}
      {active.id === "adventure" ? null : <p className="mt-2 text-sm text-muted">{active.blurb}</p>}
      <div className={active.id === "adventure" ? "pj-play-body" : "mt-3"}>
        {active.id === "adventure" ? (
          <AdventureMap />
        ) : active.id === "classic" ? (
          <ClassicList />
        ) : (
          <SandboxCard />
        )}
      </div>
    </div>
  );
}

function SandboxCard() {
  const best = useGame((s) => s.profile.sandboxBest);
  const startSandbox = useGame((s) => s.startSandbox);
  return (
    <div className="pj-card text-center">
      <div className="text-xs text-muted">Your best</div>
      <div className="mt-1 font-display text-4xl tabular-nums">{formatInt(best)}</div>
      <button
        type="button"
        data-testid="sandbox-play"
        className="pj-btn pj-btn-primary mt-4 w-full"
        onClick={startSandbox}
      >
        Play Sandbox
      </button>
    </div>
  );
}

function ClassicList() {
  const profile = useGame((s) => s.profile);
  const startClassic = useGame((s) => s.startClassic);
  return (
    <div className="pj-classic-grid">
      {CLASSIC.map((lvl) => {
        const locked = lvl.id > profile.classic.unlocked;
        const stars = profile.classic.stars[String(lvl.id)] ?? 0;
        return (
          <button
            key={lvl.id}
            type="button"
            data-testid={`classic-${lvl.id}`}
            className={`pj-classic-cell ${locked ? "is-locked" : ""}`}
            disabled={locked}
            onClick={() => startClassic(lvl.id)}
            aria-label={`Classic level ${lvl.id}. ${goalLabel(lvl.goal)}.${locked ? " Locked." : ""}`}
          >
            <span className="font-display text-xl tabular-nums">
              {locked ? <Lock className="mx-auto size-4" /> : lvl.id}
            </span>
            <span className="pj-classic-goal">{goalLabel(lvl.goal)}</span>
            <span className="flex justify-center gap-0.5" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <Star
                  key={n}
                  className={`size-2.5 ${n <= stars ? "text-gold" : "text-muted/40"}`}
                  fill={n <= stars ? "currentColor" : "none"}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MoreScreen() {
  const profile = useGame((s) => s.profile);
  const setTab = useGame((s) => s.setTab);
  const setPanel = useGame((s) => s.setPanel);
  const startSandbox = useGame((s) => s.startSandbox);
  const xpNeed = xpForLevel(profile.level);
  return (
    <div>
      <h2 className="font-display text-2xl">More</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Sandbox best" value={formatInt(profile.sandboxBest)} />
        <Stat label="Best combo" value={`x${profile.bestCombo}`} />
        <Stat label="Runs" value={String(profile.games)} />
        <Stat label="Level" value={`${profile.level} · ${profile.xp}/${xpNeed}`} />
      </div>
      <div className="mt-3 space-y-2">
        <button
          type="button"
          className="pj-btn pj-btn-ghost w-full"
          onClick={() => setPanel("how")}
        >
          <Info className="mr-2 inline size-4" />
          How to play
        </button>
        <button
          type="button"
          className="pj-btn pj-btn-ghost w-full"
          onClick={() => setPanel("settings")}
        >
          <Settings className="mr-2 inline size-4" />
          Settings
        </button>
        <button
          type="button"
          className="pj-btn pj-btn-ghost w-full"
          onClick={() => setTab("skins")}
        >
          <Paintbrush className="mr-2 inline size-4" />
          Block skins
        </button>
        <button type="button" className="pj-btn pj-btn-ghost w-full" onClick={startSandbox}>
          <RotateCcw className="mr-2 inline size-4" />
          New Sandbox run
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  icon: Icon,
  on,
  onClick,
}: {
  label: string;
  icon: typeof Volume2;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="pj-card flex w-full items-center gap-3 text-left"
      onClick={onClick}
    >
      <Icon className="size-4" />
      <span className="flex-1 font-extrabold">{label}</span>
      <span className={`pj-switch ${on ? "is-on" : ""}`} />
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="pj-card">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-display text-xl tabular-nums">{value}</div>
    </div>
  );
}
