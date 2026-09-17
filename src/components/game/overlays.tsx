import { useEffect, useState, type ReactNode } from "react";
import {
  Info,
  Lock,
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
  CONTINUE_COST,
  QUESTS,
  SHOP_ITEMS,
  SKINS,
  goalLabel,
  xpForLevel,
} from "@/lib/game/content";
import { useGame } from "@/lib/game/store";
import { formatInt } from "@/lib/utils";
import { GameIcon, type IconName } from "./icons";

export function SideRails({ side }: { side: "l" | "r" }) {
  const setPanel = useGame((s) => s.setPanel);
  const profile = useGame((s) => s.profile);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const dailyReady = Date.now() >= profile.daily.nextAt;
  const remain = Math.max(0, profile.daily.nextAt - Date.now());
  const mm = String(Math.floor(remain / 60000) % 60).padStart(2, "0");
  const hh = String(Math.floor(remain / 3600000)).padStart(2, "0");
  const ss = String(Math.floor((remain / 1000) % 60)).padStart(2, "0");
  const questReady = QUESTS.some((q) => profile.quests[q.id].value >= q.target && !profile.quests[q.id].claimed);

  if (side === "l") {
    return (
      <div className="pj-rails pj-rails-l">
        <button type="button" className="pj-rail relative" onClick={() => setPanel("daily")}>
          {dailyReady ? <span className="pj-badge" /> : null}
          <GameIcon name="daily" />
          Daily
        </button>
        <button type="button" className="pj-rail" onClick={() => setPanel("daily")}>
          <GameIcon name="gift" />
          {dailyReady ? "Claim" : `${hh}:${mm}:${ss}`}
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
        {profile.adventure.unlocked === 1 ? <span className="pj-badge" /> : null}
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

export function PowerBar() {
  const profile = useGame((s) => s.profile);
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
            className={`pj-power ${targeting === item.id ? "is-armed" : ""} ${profile.powerups[item.id] <= 0 ? "is-empty" : ""}`}
            onClick={() => armPower(item.id)}
            aria-label={item.label}
          >
            <GameIcon name={item.icon} />
            <span className="pj-count">{profile.powerups[item.id]}</span>
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
  const setPanel = useGame((s) => s.setPanel);
  const dismissLevelUp = useGame((s) => s.dismissLevelUp);

  return (
    <>
      {toast ? <div className="pj-toast">{toast}</div> : null}
      {levelUpTo && panel !== "over" && panel !== "won" ? (
        <div className="pj-modal center" role="dialog" aria-label="Level up">
          <div className="pj-sheet text-center">
            <p className="text-sm font-extrabold tracking-widest text-gold uppercase">Level up</p>
            <h2 className="mt-1 font-display text-4xl text-cream">Lv. {levelUpTo}</h2>
            <p className="mt-2 text-sm text-muted">A little more coin, a little more sparkle.</p>
            <button type="button" className="pj-btn pj-btn-primary mt-5 w-full" onClick={dismissLevelUp}>
              Keep going
            </button>
          </div>
        </div>
      ) : null}
      {panel ? (
        <div
          className={`pj-modal ${panel === "how" || panel === "over" || panel === "won" ? "center" : ""}`}
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
        </div>
      ) : null}
    </>
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
  const newGame = useGame((s) => s.newGame);
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
        label="Screen shake"
        icon={Vibrate}
        on={profile.settings.shake}
        onClick={() => toggleSetting("shake")}
      />
      <p className="text-xs text-muted">Music: Cozy Puzzle In-Game 1 by MintoDog (CC0).</p>
      <button type="button" className="pj-btn pj-btn-ghost w-full" onClick={() => setPanel("how")}>
        How to play
      </button>
      <button type="button" className="pj-btn pj-btn-ghost w-full" onClick={newGame}>
        New endless run
      </button>
      <button type="button" className="pj-btn pj-btn-ghost w-full text-danger" onClick={resetProgress}>
        Reset progress
      </button>
    </Sheet>
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
        <li>4. Tap a tray block or Rotate to turn it. Press R on a keyboard.</li>
        <li>5. Specials: bombs blast 3×3, rockets wipe a line, blasts clear the board, stone takes two hits.</li>
        <li>6. Hammer, reroll, bomb, and frost get you out of tight spots.</li>
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

function OverSheet() {
  const profile = useGame((s) => s.profile);
  const match = useGame((s) => s.match);
  const newGame = useGame((s) => s.newGame);
  const continueRun = useGame((s) => s.continueRun);
  return (
    <div className="pj-sheet text-center">
      <h2 className="font-display text-3xl text-cream">No more moves</h2>
      <p className="mt-2 text-sm text-muted">
        Score {formatInt(match.score)} · best {formatInt(profile.highScore)}
      </p>
      <button type="button" className="pj-btn pj-btn-primary mt-5 w-full" onClick={newGame}>
        Play again
      </button>
      <button type="button" className="pj-btn pj-btn-ghost mt-2 w-full" onClick={continueRun}>
        Continue · {CONTINUE_COST} gems
      </button>
    </div>
  );
}

function WonSheet() {
  const match = useGame((s) => s.match);
  const profile = useGame((s) => s.profile);
  const newGame = useGame((s) => s.newGame);
  const startAdventure = useGame((s) => s.startAdventure);
  const setTab = useGame((s) => s.setTab);
  const nextId = match.levelId ? match.levelId + 1 : null;
  const nextOpen = nextId !== null && nextId <= profile.adventure.unlocked && ADVENTURE.some((l) => l.id === nextId);
  return (
    <div className="pj-sheet text-center">
      <Star className="mx-auto size-8 text-gold" fill="currentColor" />
      <h2 className="mt-2 font-display text-3xl text-cream">Island cleared</h2>
      <p className="mt-2 text-sm text-muted">
        {match.goal ? goalLabel(match.goal) : "Challenge complete"} · {formatInt(match.score)} pts
      </p>
      {nextOpen && nextId ? (
        <button type="button" className="pj-btn pj-btn-primary mt-5 w-full" onClick={() => startAdventure(nextId)}>
          Next island
        </button>
      ) : (
        <button type="button" className="pj-btn pj-btn-primary mt-5 w-full" onClick={newGame}>
          Endless run
        </button>
      )}
      <button
        type="button"
        className="pj-btn pj-btn-ghost mt-2 w-full"
        onClick={() => {
          newGame();
          setTab("adventure");
        }}
      >
        Island map
      </button>
    </div>
  );
}

function AdventureScreen() {
  return (
    <div>
      <h2 className="font-display text-2xl">Adventure</h2>
      <p className="mt-1 text-sm text-muted">Ten islands. Clear · relax · level up.</p>
      <div className="mt-3">
        <AdventureList />
      </div>
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
  const newGame = useGame((s) => s.newGame);
  const xpNeed = xpForLevel(profile.level);
  return (
    <div>
      <h2 className="font-display text-2xl">More</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="High score" value={formatInt(profile.highScore)} />
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
        <button type="button" className="pj-btn pj-btn-ghost w-full" onClick={newGame}>
          <RotateCcw className="mr-2 inline size-4" />
          New endless run
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
              <div className="font-extrabold">{lvl.name}</div>
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
