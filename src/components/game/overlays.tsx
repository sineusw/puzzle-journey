import { useEffect, useState, type ReactNode } from "react";
import {
  Info,
  Lock,
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
  CONTINUE_COST,
  QUESTS,
  SHOP_ITEMS,
  SKINS,
  goalLabel,
  xpForLevel,
} from "@/lib/game/content";
import { useGame } from "@/lib/game/store";
import { VISITOR_IDS, VISITOR_META } from "@/lib/game/visitors";
import { formatInt } from "@/lib/utils";
import { GameIcon, type IconName } from "./icons";
import * as audio from "@/lib/game/audio";
import { cheer } from "@/lib/game/voice";
import { SpecialFace } from "./tile-art";

export function SideRails({ side }: { side: "l" | "r" }) {
  const setPanel = useGame((s) => s.setPanel);
  const dailyNextAt = useGame((s) => s.profile.daily.nextAt);
  const firstIsland = useGame((s) => s.profile.adventure.unlocked === 1);
  const questReady = useGame((s) => QUESTS.some((q) => s.profile.quests[q.id].value >= q.target && !s.profile.quests[q.id].claimed));

  if (side === "l") {
    return (
      <div className="pj-rails pj-rails-l">
        <DailyRail nextAt={dailyNextAt} onOpen={() => setPanel("daily")} />
        <button type="button" className="pj-rail" onClick={() => setPanel("daily")}>
          <GameIcon name="gift" />
          <GiftTimer nextAt={dailyNextAt} />
        </button>
        <button type="button" className="pj-rail" onClick={() => setPanel("events")}>
          <GameIcon name="events" />
          Events
        </button>
      </div>
    );
  }

  return (
    <div className="pj-rails pj-rails-r">
      <button type="button" className="pj-rail relative" onClick={() => setPanel("map")}>
        {firstIsland ? <span className="pj-badge" /> : null}
        <GameIcon name="map" />
        Map
      </button>
      <button type="button" className="pj-rail relative" onClick={() => setPanel("quests")}>
        {questReady ? <span className="pj-badge" /> : null}
        <GameIcon name="quests" />
        Quests
      </button>
      <button type="button" className="pj-rail" onClick={() => setPanel("shop")}>
        <GameIcon name="shop" />
        Shop
      </button>
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
      Daily
    </button>
  );
}

function GiftTimer({ nextAt }: { nextAt: number }) {
  const now = useNow();
  const remain = Math.max(0, nextAt - now);
  if (remain === 0) return <>Claim</>;
  const hh = String(Math.floor(remain / 3600000)).padStart(2, "0");
  const mm = String(Math.floor(remain / 60000) % 60).padStart(2, "0");
  const ss = String(Math.floor((remain / 1000) % 60)).padStart(2, "0");
  return <>{`${hh}:${mm}:${ss}`}</>;
}

export function PowerBar() {
  const powerups = useGame((s) => s.profile.powerups);
  const targeting = useGame((s) => s.targeting);
  const armPower = useGame((s) => s.armPower);
  const setPanel = useGame((s) => s.setPanel);
  const items: Array<{ id: "hammer" | "refresh" | "bomb" | "freeze"; label: string; icon: IconName }> = [
    { id: "hammer", label: "Hammer", icon: "hammer" },
    { id: "refresh", label: "Reroll", icon: "refresh" },
    { id: "bomb", label: "Bomb", icon: "bomb" },
    { id: "freeze", label: "Frost", icon: "frost" },
  ];
  return (
    <div className="pj-powers">
      {items.map((item) => (
        <div key={item.id} className="pj-power-wrap">
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
          <button
            type="button"
            className="pj-add"
            onClick={() => setPanel("shop")}
            aria-label={`Buy ${item.label}`}
          >
            +
          </button>
        </div>
      ))}
    </div>
  );
}

export function TabScreens() {
  const tab = useGame((s) => s.tab);
  if (tab === "home") return null;
  return (
    <div className="pj-screen">
      {tab === "adventure" ? <AdventureScreen /> : null}
      {tab === "challenges" ? <ChallengeScreen /> : null}
      {tab === "skins" ? <SkinsScreen /> : null}
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
      {levelUpTo && panel !== "over" && panel !== "won" ? <LevelUpSheet level={levelUpTo} onClose={dismissLevelUp} /> : null}
      {panel ? (
        <div
          className={`pj-modal ${panel === "how" || panel === "over" || panel === "won" || panel === "intro" ? "center" : ""}`}
          role="dialog"
          aria-modal="true"
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
    <div className="pj-modal center" role="dialog" aria-label="Level up">
      <div className="pj-sheet pj-result text-center">
        <p className="text-sm font-extrabold tracking-widest text-gold uppercase">Level up</p>
        <h2 className="pj-result-title mt-1 font-display text-cream">Lv. {level}</h2>
        <p className="mt-2 text-sm text-cream/85">You're getting better every round. Here's a little coin to celebrate.</p>
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

function ShopSheet() {
  const buy = useGame((s) => s.buy);
  const profile = useGame((s) => s.profile);
  return (
    <Sheet title="Night market">
      <p className="text-sm text-muted">
        {formatInt(profile.coins)} coins · {formatInt(profile.gems)} gems
      </p>
      {SHOP_ITEMS.map((item) => (
        <div key={item.id} className="pj-card flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-extrabold">{item.name}</div>
            <div className="text-xs text-muted">{item.blurb}</div>
          </div>
          <button
            type="button"
            data-testid={`buy-${item.id}`}
            className="pj-btn pj-btn-primary shrink-0 text-sm"
            onClick={() => buy(item.id)}
          >
            {item.coins ? `${item.coins}c` : `${item.gems}g`}
          </button>
        </div>
      ))}
    </Sheet>
  );
}

function QuestSheet() {
  const profile = useGame((s) => s.profile);
  const claimQuest = useGame((s) => s.claimQuest);
  return (
    <Sheet title="Quests">
      {QUESTS.map((q) => {
        const p = profile.quests[q.id];
        const ready = p.value >= q.target && !p.claimed;
        return (
          <div key={q.id} className="pj-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-extrabold">{q.title}</div>
                <div className="text-xs text-muted">{q.blurb}</div>
              </div>
              <button
                type="button"
                className="pj-btn pj-btn-primary text-sm"
                disabled={!ready}
                onClick={() => claimQuest(q.id)}
              >
                {p.claimed ? "Done" : ready ? "Claim" : `${Math.min(p.value, q.target)}/${q.target}`}
              </button>
            </div>
            <div className="pj-meter mt-2">
              <span style={{ width: `${Math.min(100, (p.value / q.target) * 100)}%` }} />
            </div>
          </div>
        );
      })}
    </Sheet>
  );
}

function DailySheet() {
  const profile = useGame((s) => s.profile);
  const claimDaily = useGame((s) => s.claimDaily);
  const ready = Date.now() >= profile.daily.nextAt;
  return (
    <Sheet title="Daily gift">
      <div className="pj-card text-center">
        <GameIcon name="gift" className="mx-auto size-12" />
        <p className="mt-2 font-extrabold">Streak {profile.daily.streak}</p>
        <p className="text-sm text-muted">A small pouch every eight hours.</p>
        <button
          type="button"
          className="pj-btn pj-btn-primary mt-4 w-full"
          disabled={!ready}
          onClick={claimDaily}
        >
          {ready ? "Claim gift" : "Come back later"}
        </button>
      </div>
    </Sheet>
  );
}

function EventsSheet() {
  const startChallenge = useGame((s) => s.startChallenge);
  const setPanel = useGame((s) => s.setPanel);
  return (
    <Sheet title="Lantern weekend">
      <div className="pj-card">
        <div className="font-extrabold">Combo tide</div>
        <p className="mt-1 text-sm text-muted">String a x3 combo while the lanterns are lit.</p>
        <button
          type="button"
          className="pj-btn pj-btn-primary mt-3 w-full"
          onClick={() => {
            setPanel(null);
            startChallenge("streak");
          }}
        >
          Play event
        </button>
      </div>
    </Sheet>
  );
}

function MapSheet() {
  return (
    <Sheet title="Island map">
      <AdventureList compact />
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
      <button type="button" className="pj-btn pj-btn-ghost w-full text-danger" onClick={resetProgress}>
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
  const start = useGame((s) => s.start);
  return (
    <div className="pj-sheet text-left">
      <h2 className="font-display text-2xl text-cream">How to play</h2>
      <ol className="mt-3 space-y-2 text-[15px] leading-snug text-cream/90">
        <li>1. Drag a next-block from the tray under the board onto the grid.</li>
        <li>2. Fill a whole row or column to clear it. Fill several and they all pop at once.</li>
        <li>3. Chain clears on back-to-back drops for combos.</li>
        <li>4. Blocks don’t rotate — plan around the shapes you’re given.</li>
        <li>5. Three ways to play: Adventure, Classic levels with plain blocks, and Sandbox for a high score.</li>
        <li>6. Adventure starts with plain blocks. New special blocks and Island Visitors join one at a time as you travel.</li>
        <li>7. Hammer, reroll, bomb, and frost get you out of tight spots.</li>
      </ol>
      <button
        type="button"
        className="pj-btn pj-btn-primary mt-5 w-full"
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
  return mode === "adventure" ? "Adventure" : mode === "classic" ? "Classic" : mode === "sandbox" ? "Sandbox" : "Challenge";
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
  const continueRun = useGame((s) => s.continueRun);
  const setTab = useGame((s) => s.setTab);
  const sandbox = match.mode === "sandbox";
  const best = sandbox ? profile.sandboxBest : profile.highScore;
  const beatBest = match.score > 0 && match.score > bestAtStart && bestAtStart > 0 && (sandbox || !match.goal);
  const pct = match.goal ? Math.min(1, match.goalProgress / match.goal.value) : 0;
  const left = match.goal ? Math.max(0, match.goal.value - match.goalProgress) : 0;
  const unit = match.goal?.type === "lines" ? (left === 1 ? "line" : "lines") : match.goal?.type === "combo" ? "combo steps" : "points";
  const [title, sub] = beatBest
    ? ["New best!", `You beat your best by ${formatInt(match.score - bestAtStart)} points. Amazing run!`]
    : match.goal && pct >= 0.85
      ? ["So close!", `Only ${formatInt(left)} ${unit} to go. You've got this!`]
      : match.goal && pct >= 0.5
        ? ["Nice run!", "You made it more than halfway. One more try?"]
        : match.goal
          ? ["Good try!", "Every run makes you sharper. Go again!"]
          : ["Nice run!", `You cleared ${match.lines} ${match.lines === 1 ? "line" : "lines"}. Can you beat ${formatInt(best)}?`];
  const shown = useCountUp(match.score, 900, 350);
  useEffect(() => {
    if (beatBest) audio.feelNewBest();
    else audio.feelRoundOver();
    cheer(title, { delayMs: 300, priority: true });
    // Play once when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="pj-sheet pj-result text-center" data-testid="over-sheet">
      <p className="text-xs font-extrabold tracking-widest text-gold uppercase">{modeName(match.mode)}</p>
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
      <button type="button" className="pj-btn pj-btn-primary mt-4 w-full" onClick={newGame}>
        {match.levelId ? "Try again" : "Play again"}
      </button>
      <button type="button" className="pj-btn pj-btn-ghost mt-2 w-full" onClick={continueRun}>
        Continue · {CONTINUE_COST} gems
      </button>
      <button type="button" className="pj-btn pj-btn-ghost mt-2 w-full" onClick={() => setTab("adventure")}>
        Choose a mode
      </button>
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
  const nextNew = match.mode === "adventure" && nextId ? ADVENTURE.find((l) => l.id === nextId)?.introduces : undefined;
  // Stars earned this run (not the saved best), so the reveal matches the play.
  const ratio = match.goal ? match.goalProgress / match.goal.value : 1;
  const stars = ratio >= 1.6 ? 3 : ratio >= 1.2 ? 2 : 1;
  const reward = id ? list.find((l) => l.id === id)?.reward : CHALLENGES.find((c) => c.goal.type === match.goal?.type && c.goal.value === match.goal?.value)?.reward;
  const [lit, setLit] = useState(0);
  const shown = useCountUp(match.score, 1000, 400 + stars * 450);
  const [title, sub] = WIN_LINES[stars]!;
  useEffect(() => {
    audio.feelLevelComplete();
    cheer(stars === 3 ? "Amazing! Three stars!" : match.mode === "classic" ? "Level cleared! Great job!" : "Island cleared! Great job!", {
      delayMs: 200,
      priority: true,
    });
    const timers = Array.from({ length: stars }, (_, i) =>
      window.setTimeout(() => {
        setLit(i + 1);
        audio.feelStar(i);
      }, 650 + i * 450),
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
    <div className="pj-sheet pj-result text-center" data-testid="won-sheet">
      <div className="pj-result-stars" aria-label={`${stars} of 3 stars`}>
        {[1, 2, 3].map((n) => (
          <span key={n} className={`pj-result-star ${n <= lit ? "is-lit" : ""} ${n === 2 ? "is-mid" : ""}`}>
            <Star fill="currentColor" />
          </span>
        ))}
      </div>
      <h2 className="pj-result-title mt-1 font-display text-cream">{title}</h2>
      <p className="mx-auto mt-1 max-w-[30ch] text-sm text-cream/85">{sub}</p>
      <div className="pj-result-score tabular-nums">{formatInt(shown)}</div>
      <p className="text-xs text-muted">{match.goal ? goalLabel(match.goal) : "Challenge complete"}</p>
      <RunStats />
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
      {nextOpen && nextId ? (
        <button
          type="button"
          className="pj-btn pj-btn-primary mt-4 w-full"
          onClick={() => (match.mode === "classic" ? startClassic(nextId) : startAdventure(nextId))}
        >
          {match.mode === "classic" ? "Next level" : "Next island"}
        </button>
      ) : (
        <button type="button" className="pj-btn pj-btn-primary mt-4 w-full" onClick={newGame}>
          Play again
        </button>
      )}
      <button type="button" className="pj-btn pj-btn-ghost mt-2 w-full" onClick={() => setTab("adventure")}>
        Choose a mode
      </button>
    </div>
  );
}

function IntroSheet() {
  const unlock = useGame((s) => s.introUnlock);
  const setPanel = useGame((s) => s.setPanel);
  if (!unlock) return null;
  const info = UNLOCKS[unlock];
  return (
    <div className="pj-sheet pj-intro text-center" data-testid="intro-card">
      <p className="pj-intro-new">
        <Sparkles className="mr-1 inline size-4" />
        New on this island
      </p>
      <div className={`pj-intro-art is-${info.kind}`}>
        {info.kind === "visitor" ? (
          <img src={info.art} alt="" />
        ) : (
          <span className="pj-intro-tile" style={{ backgroundImage: `url(${info.art})` }}>
            {info.special ? <SpecialFace kind={info.special} /> : null}
          </span>
        )}
      </div>
      <h2 className="mt-2 font-display text-3xl text-cream">{info.name}</h2>
      <p className="mx-auto mt-2 max-w-[28ch] text-sm text-cream/85">{info.blurb}</p>
      <button type="button" className="pj-btn pj-btn-primary mt-5 w-full" data-testid="intro-go" onClick={() => setPanel(null)}>
        Let’s go
      </button>
    </div>
  );
}

type PlayMode = "adventure" | "classic" | "sandbox";

function AdventureScreen() {
  const current = useGame((s) => s.match.mode);
  const [mode, setMode] = useState<PlayMode>(current === "classic" || current === "sandbox" ? current : "adventure");
  const modes: Array<{ id: PlayMode; label: string; blurb: string }> = [
    { id: "adventure", label: "Adventure", blurb: "Islands that add a new special block or visitor as you go." },
    { id: "classic", label: "Classic", blurb: "Thirty levels with plain blocks only. No specials, no visitors." },
    { id: "sandbox", label: "Sandbox", blurb: "Endless plain blocks. Chase your highest score." },
  ];
  const active = modes.find((m) => m.id === mode)!;
  return (
    <div>
      <h2 className="font-display text-2xl">Play</h2>
      <div className="pj-modes mt-3" role="tablist" aria-label="Game mode">
        {modes.map((m) => (
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
      <p className="mt-2 text-sm text-muted">{active.blurb}</p>
      <div className="mt-3">
        {mode === "adventure" ? <AdventureList /> : mode === "classic" ? <ClassicList /> : <SandboxCard />}
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
      <button type="button" data-testid="sandbox-play" className="pj-btn pj-btn-primary mt-4 w-full" onClick={startSandbox}>
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
            <span className="font-display text-xl tabular-nums">{locked ? <Lock className="mx-auto size-4" /> : lvl.id}</span>
            <span className="pj-classic-goal">{goalLabel(lvl.goal)}</span>
            <span className="flex justify-center gap-0.5" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <Star key={n} className={`size-2.5 ${n <= stars ? "text-gold" : "text-muted/40"}`} fill={n <= stars ? "currentColor" : "none"} />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ChallengeScreen() {
  const startChallenge = useGame((s) => s.startChallenge);
  return (
    <div>
      <h2 className="font-display text-2xl">Challenges</h2>
      <p className="mt-1 text-sm text-muted">Short goals on a fresh board.</p>
      <div className="mt-3 space-y-2">
        {CHALLENGES.map((ch) => (
          <div key={ch.id} className="pj-card flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-extrabold">{ch.name}</div>
              <div className="text-xs text-muted">{ch.blurb}</div>
            </div>
            <button
              type="button"
              data-testid={`challenge-${ch.id}`}
              className="pj-btn pj-btn-primary shrink-0 text-sm"
              onClick={() => startChallenge(ch.id)}
            >
              Play
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkinsScreen() {
  const skin = useGame((s) => s.profile.skin);
  const setSkin = useGame((s) => s.setSkin);
  return (
    <div>
      <h2 className="font-display text-2xl">Skins</h2>
      <p className="mt-1 text-sm text-muted">Same blocks, different dusk.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {SKINS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`pj-card text-left ${skin === s.id ? "is-on" : ""}`}
            onClick={() => setSkin(s.id)}
          >
            <div className="flex gap-1">
              <span className="pj-swatch" data-c="cyan" data-skin={s.id} />
              <span className="pj-swatch" data-c="pink" data-skin={s.id} />
              <span className="pj-swatch" data-c="amber" data-skin={s.id} />
            </div>
            <div className="mt-2 font-extrabold">{s.name}</div>
            <div className="text-xs text-muted">{s.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MoreScreen() {
  const profile = useGame((s) => s.profile);
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
        <button type="button" className="pj-btn pj-btn-ghost w-full" onClick={() => setPanel("how")}>
          <Info className="mr-2 inline size-4" />
          How to play
        </button>
        <button type="button" className="pj-btn pj-btn-ghost w-full" onClick={() => setPanel("settings")}>
          <Settings className="mr-2 inline size-4" />
          Settings
        </button>
        <button type="button" className="pj-btn pj-btn-ghost w-full" onClick={startSandbox}>
          <RotateCcw className="mr-2 inline size-4" />
          New Sandbox run
        </button>
      </div>
    </div>
  );
}

function AdventureList({ compact = false }: { compact?: boolean }) {
  const profile = useGame((s) => s.profile);
  const startAdventure = useGame((s) => s.startAdventure);
  return (
    <div className="space-y-2">
      {ADVENTURE.map((lvl) => {
        const locked = lvl.id > profile.adventure.unlocked;
        const stars = profile.adventure.stars[String(lvl.id)] ?? 0;
        return (
          <div key={lvl.id} className="pj-card flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-dusk font-extrabold">
              {locked ? <Lock className="size-4 text-muted" /> : lvl.id}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-extrabold">{lvl.name}</span>
                {lvl.introduces ? (
                  <span className="pj-new-chip">New: {UNLOCKS[lvl.introduces].name}</span>
                ) : null}
              </div>
              <div className="text-xs text-muted">{compact ? goalLabel(lvl.goal) : lvl.blurb}</div>
              <div className="mt-1 flex gap-0.5">
                {[1, 2, 3].map((n) => (
                  <Star
                    key={n}
                    className={`size-3 ${n <= stars ? "text-gold" : "text-muted/40"}`}
                    fill={n <= stars ? "currentColor" : "none"}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              data-testid={`adv-${lvl.id}`}
              className="pj-btn pj-btn-primary shrink-0 text-sm"
              disabled={locked}
              onClick={() => startAdventure(lvl.id)}
            >
              {locked ? "Locked" : stars ? "Replay" : "Play"}
            </button>
          </div>
        );
      })}
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
    <button type="button" className="pj-card flex w-full items-center gap-3 text-left" onClick={onClick}>
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
