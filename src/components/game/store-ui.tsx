import { celebrateClaim } from "./claim-fx";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Clock, Lock, Play, X } from "lucide-react";
import { CONTINUE_COST, QUESTS, SKINS, type SkinId } from "@/lib/game/content";
import {
  AD_COINS,
  AD_DAILY_CAP,
  DAILY_REWARDS,
  EVENT_TIERS,
  QUEST_CHEST,
  SHOP,
  SPIN_EXTRA_PER_DAY,
  SPIN_PRIZES,
  WEEKLY,
  calendarReady,
  currentEvent,
  grantParts,
  normalizeLive,
  usd,
  type Grant,
  type ShopItem,
  type ShopSection,
} from "@/lib/game/liveops";
import { useHouseAd } from "@/lib/game/ads";
import { useGame } from "@/lib/game/store";
import { formatInt } from "@/lib/utils";
import { BlockFace } from "./block";

/* ----------------------------------------------------------- shared bits */

function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s % 60).padStart(2, "0")}s`;
}

export function ShopSheetFrame({ title, sub, children, wide }: { title: string; sub?: ReactNode; children: ReactNode; wide?: boolean }) {
  const setPanel = useGame((s) => s.setPanel);
  return (
    <div className={`pj-sheet pj-store-sheet${wide ? " is-wide" : ""}`}>
      <button type="button" className="pj-close" onClick={() => setPanel(null)} aria-label="Close">
        <X className="size-4" />
      </button>
      <h2 className="pj-store-title">{title}</h2>
      {sub ? <div className="pj-store-sub">{sub}</div> : null}
      <div className="pj-store-body">{children}</div>
    </div>
  );
}

export function Wallet() {
  const coins = useGame((s) => s.profile.coins);
  const gems = useGame((s) => s.profile.gems);
  const passes = useGame((s) => s.profile.live.passes);
  return (
    <div className="pj-wallet">
      <span>
        <img src="/icons/coin.webp" alt="" />
        {formatInt(coins)}
      </span>
      <span>
        <img src="/icons/gem.webp" alt="" />
        {formatInt(gems)}
      </span>
      <span title="Continue Passes">
        <img src="/icons/refresh.webp" alt="" />
        {passes}
      </span>
    </div>
  );
}

/** Both prices side by side: in-game currency and real money. */
export function PriceButtons({
  coins,
  gems,
  money,
  onCoins,
  onMoney,
  disabled,
  compact,
}: {
  coins?: number;
  gems?: number;
  money?: number;
  onCoins?: () => void;
  onMoney?: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const balance = useGame((s) => (coins ? s.profile.coins : s.profile.gems));
  const short = (coins ?? gems ?? 0) > balance;
  return (
    <div className={`pj-prices${compact ? " is-compact" : ""}`}>
      {coins || gems ? (
        <button type="button" className={`pj-price is-coin${short ? " is-short" : ""}`} disabled={disabled} onClick={onCoins}>
          <img src={coins ? "/icons/coin.webp" : "/icons/gem.webp"} alt={coins ? "coins" : "gems"} />
          {formatInt(coins ?? gems ?? 0)}
        </button>
      ) : null}
      {money ? (
        <button type="button" className="pj-price is-money" disabled={disabled} onClick={onMoney}>
          {usd(money)}
        </button>
      ) : null}
    </div>
  );
}

function ItemArt({ art, qty, big }: { art: string[]; qty?: string; big?: boolean }) {
  return (
    <div className={`pj-item-art${big ? " is-big" : ""}`} data-n={Math.min(art.length, 4)}>
      <span className="pj-item-glow" />
      {art.slice(0, 4).map((src, i) => (
        <img key={i} src={src} alt="" className={`pj-item-img is-${i}`} draggable={false} />
      ))}
      {qty ? <span className="pj-item-qty">{qty}</span> : null}
    </div>
  );
}

export function RewardChips({ grant, small }: { grant: Grant; small?: boolean }) {
  return (
    <div className={`pj-chips${small ? " is-small" : ""}`}>
      {grantParts(grant).map((p, i) => (
        <span key={i} className="pj-chip">
          <img src={p.icon} alt="" />
          {p.text}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ shop */

const SECTION_TITLE: Record<ShopSection, string> = {
  offers: "Special offers",
  boosters: "Boosters",
  passes: "Continue Passes",
  coins: "Coins",
  gems: "Gems",
};

export function ShopSheet() {
  const bought = useGame((s) => s.profile.live.bought);
  const adsLeft = useGame((s) => AD_DAILY_CAP - normalizeLive(s.profile.live).ads.n);
  const watchForCoins = useGame((s) => s.watchForCoins);
  const videoBusy = useGame((s) => s.videoBusy);
  const sections: ShopSection[] = ["offers", "boosters", "passes", "coins", "gems"];
  return (
    <ShopSheetFrame title="Island Shop" sub={<Wallet />} wide>
      <button type="button" className="pj-free-video" disabled={adsLeft <= 0 || videoBusy} onClick={() => void watchForCoins()}>
        <span className="pj-free-play">
          <Play className="size-4" fill="currentColor" />
        </span>
        <span className="flex-1 text-left">
          <b>Free coins</b>
          <small>{adsLeft > 0 ? `Watch a short video · ${adsLeft} left today` : "Come back tomorrow for more"}</small>
        </span>
        <span className="pj-free-amt">
          <img src="/icons/coin.webp" alt="" />+{AD_COINS}
        </span>
      </button>
      {sections.map((sec) => {
        const items = SHOP.filter((i) => i.section === sec && !(i.once && bought.includes(i.id)));
        if (!items.length) return null;
        return (
          <section key={sec} className="pj-shop-sec">
            <h3>{SECTION_TITLE[sec]}</h3>
            <div className={sec === "offers" ? "pj-offer-list" : "pj-item-grid"}>
              {items.map((item) => (sec === "offers" ? <OfferCard key={item.id} item={item} /> : <ItemCard key={item.id} item={item} />))}
            </div>
          </section>
        );
      })}
      <p className="pj-fine">Real-money purchases are processed securely by Stripe.</p>
    </ShopSheetFrame>
  );
}

function OfferCard({ item }: { item: ShopItem }) {
  const buyMoney = useGame((s) => s.buyMoney);
  return (
    <div className="pj-offer" data-id={item.id}>
      {item.tag ? <span className="pj-ribbon">{item.tag}</span> : null}
      <ItemArt art={item.art} big />
      <div className="min-w-0 flex-1">
        <div className="pj-offer-name">{item.name}</div>
        <RewardChips grant={item.grant} small />
        <div className="mt-2">
          <PriceButtons money={item.usd} onMoney={() => void buyMoney(item.id)} />
        </div>
      </div>
    </div>
  );
}

export function ItemCard({ item }: { item: ShopItem }) {
  const buyItem = useGame((s) => s.buyItem);
  const buyMoney = useGame((s) => s.buyMoney);
  return (
    <div className="pj-item" data-testid={`buy-${item.id}`}>
      {item.tag ? <span className="pj-item-tag">{item.tag}</span> : null}
      <ItemArt art={item.art} qty={item.qty} />
      <div className="pj-item-name">{item.name}</div>
      {item.blurb ? <div className="pj-item-blurb">{item.blurb}</div> : null}
      <PriceButtons coins={item.coins} gems={item.gems} money={item.usd} onCoins={() => buyItem(item.id)} onMoney={() => void buyMoney(item.id)} compact />
    </div>
  );
}

/* ----------------------------------------------------------------- skins */

const PREVIEW: Array<["cyan" | "azure" | "lime" | "pink" | "amber" | "orange" | "violet", boolean]> = [
  ["pink", false],
  ["amber", false],
  ["cyan", false],
  ["lime", false],
  ["violet", true],
  ["orange", false],
  ["azure", false],
  ["pink", false],
  ["lime", false],
];

export function SkinsScreen() {
  const current = useGame((s) => s.profile.skin);
  const owned = useGame((s) => s.profile.live.ownedSkins);
  const [sel, setSel] = useState<SkinId>(current);
  const skin = SKINS.find((s) => s.id === sel) ?? SKINS[0]!;
  const setSkin = useGame((s) => s.setSkin);
  const buySkin = useGame((s) => s.buySkin);
  const buyMoney = useGame((s) => s.buyMoney);
  const has = owned.includes(skin.id);
  return (
    <div className="pj-skins">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl">Block Skins</h2>
        <Wallet />
      </div>
      <div className="pj-skin-stage" data-rarity={skin.rarity}>
        <div className="pj-skin-board">
          {PREVIEW.map(([c, star], i) => (
            <BlockFace key={`${sel}-${i}`} color={c} star={star} skin={sel} />
          ))}
        </div>
        <div className="pj-skin-info">
          <span className="pj-rarity" data-rarity={skin.rarity}>
            {skin.rarity}
          </span>
          <div className="pj-skin-name">{skin.name}</div>
          <p className="pj-skin-blurb">{skin.blurb}</p>
          {has ? (
            <button type="button" className="pj-btn pj-btn-primary mt-3 w-full" disabled={current === skin.id} onClick={() => setSkin(skin.id)}>
              {current === skin.id ? (
                <>
                  <Check className="mr-1 inline size-4" /> Equipped
                </>
              ) : (
                "Equip"
              )}
            </button>
          ) : (
            <div className="mt-3">
              <PriceButtons coins={skin.coins} money={skin.usd} onCoins={() => buySkin(skin.id)} onMoney={() => void buyMoney(`skin:${skin.id}`)} />
            </div>
          )}
        </div>
      </div>
      <div className="pj-skin-grid">
        {SKINS.map((s) => {
          const mine = owned.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              className={`pj-skin-card${sel === s.id ? " is-sel" : ""}${current === s.id ? " is-on" : ""}`}
              data-rarity={s.rarity}
              onClick={() => setSel(s.id)}
            >
              <div className="pj-skin-mini">
                <BlockFace color="pink" skin={s.id} />
                <BlockFace color="cyan" skin={s.id} />
                <BlockFace color="lime" skin={s.id} />
                <BlockFace color="amber" skin={s.id} />
              </div>
              <div className="pj-skin-card-name">{s.name}</div>
              {current === s.id ? (
                <span className="pj-skin-state is-on">Equipped</span>
              ) : mine ? (
                <span className="pj-skin-state">Owned</span>
              ) : (
                <span className="pj-skin-state is-price">
                  <span>
                    <img src="/icons/coin.webp" alt="" />
                    {formatInt(s.coins)}
                  </span>
                  <span className="is-usd">{usd(s.usd)}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- daily */

export function DailySheet() {
  const profile = useGame((s) => s.profile);
  const claimCalendar = useGame((s) => s.claimCalendar);
  const claimDaily = useGame((s) => s.claimDaily);
  const now = useNow();
  const live = normalizeLive(profile.live);
  const ready = calendarReady(live);
  const giftReady = now >= profile.daily.nextAt;
  return (
    <ShopSheetFrame title="Daily Rewards" sub="Log in every day. Day 7 is a treasure chest!">
      <div className="pj-cal">
        {DAILY_REWARDS.map((g, i) => {
          const done = i < live.calendar.claimed;
          const today = i === live.calendar.claimed && ready;
          return (
            <div key={i} className={`pj-cal-day${done ? " is-done" : ""}${today ? " is-today" : ""}${i === 6 ? " is-big" : ""}`}>
              <span className="pj-cal-n">Day {i + 1}</span>
              <img src={i === 6 ? "/icons/gift.webp" : grantParts(g)[0]!.icon} alt="" className="pj-cal-img" />
              <span className="pj-cal-txt">{i === 6 ? "Treasure" : grantParts(g)[0]!.text}</span>
              {done ? (
                <span className="pj-cal-check">
                  <Check className="size-4" />
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      {ready ? <RewardChips grant={DAILY_REWARDS[live.calendar.claimed]!} /> : null}
      <button type="button" className="pj-btn pj-btn-primary mt-3 w-full" disabled={!ready} onClick={(e) => { celebrateClaim(e, true); claimCalendar(); }}>
        {ready ? `Claim day ${live.calendar.claimed + 1}` : "Come back tomorrow"}
      </button>
      <div className="pj-gift-row">
        <img src="/icons/gift.webp" alt="" />
        <div className="min-w-0 flex-1">
          <b>Free gift</b>
          <small>{giftReady ? "Ready to open!" : `Next gift in ${countdown(profile.daily.nextAt - now)}`}</small>
        </div>
        <button type="button" className="pj-btn pj-btn-primary text-sm" disabled={!giftReady} onClick={(e) => { celebrateClaim(e); claimDaily(); }}>
          {giftReady ? "Open" : <Clock className="size-4" />}
        </button>
      </div>
    </ShopSheetFrame>
  );
}

/* ---------------------------------------------------------------- events */

export function EventsSheet() {
  const rawLive = useGame((s) => s.profile.live);
  const live = useMemo(() => normalizeLive(rawLive), [rawLive]);
  const claimEventTier = useGame((s) => s.claimEventTier);
  const setPanel = useGame((s) => s.setPanel);
  const setTab = useGame((s) => s.setTab);
  const now = useNow();
  const { def, endsAt, next } = useMemo(() => currentEvent(new Date(now)), [now]);
  const max = EVENT_TIERS[EVENT_TIERS.length - 1]!.pts;
  const pct = Math.min(100, (live.event.pts / max) * 100);
  return (
    <ShopSheetFrame title="Island Events">
      <div className="pj-event-hero" style={{ background: `linear-gradient(135deg, ${def.colors[0]}, ${def.colors[1]})` }}>
        <span className="pj-event-token" aria-hidden="true">
          {def.token}
        </span>
        <div className="min-w-0 flex-1">
          <div className="pj-event-live">
            <span className="pj-live-dot" /> LIVE · ends in {countdown(endsAt - now)}
          </div>
          <div className="pj-event-name">{def.name}</div>
          <p className="pj-event-blurb">{def.blurb}</p>
        </div>
      </div>
      <div className="pj-event-score">
        <span>{def.token}</span>
        <b>{formatInt(live.event.pts)}</b> {def.unit} collected
      </div>
      <div className="pj-event-track">
        <div className="pj-event-bar">
          <span style={{ ["--h" as string]: `${pct}%` }} />
        </div>
        {EVENT_TIERS.map((t, i) => {
          const got = live.event.claimed.includes(i);
          const can = live.event.pts >= t.pts && !got;
          return (
            <div key={i} className={`pj-tier${got ? " is-got" : ""}${can ? " is-ready" : ""}`}>
              <div className="pj-tier-pts">
                {def.token} {t.pts}
              </div>
              <RewardChips grant={t.grant} small />
              <button type="button" className="pj-btn pj-btn-primary text-sm" disabled={!can} onClick={(e) => { celebrateClaim(e, true); claimEventTier(i); }}>
                {got ? <Check className="size-4" /> : can ? "Claim" : <Lock className="size-4" />}
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="pj-btn pj-btn-primary mt-3 w-full"
        onClick={() => {
          setPanel(null);
          setTab("adventure");
        }}
      >
        Play to collect {def.unit}
      </button>
      <div className="pj-next-event">
        Next up: <b>{next.token} {next.name}</b> in {countdown(endsAt - now)}
      </div>
    </ShopSheetFrame>
  );
}

/* ---------------------------------------------------------------- quests */

export function QuestSheet() {
  const profile = useGame((s) => s.profile);
  const claimQuest = useGame((s) => s.claimQuest);
  const claimWeekly = useGame((s) => s.claimWeekly);
  const claimQuestChest = useGame((s) => s.claimQuestChest);
  const live = normalizeLive(profile.live);
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const doneCount = QUESTS.filter((q) => profile.quests[q.id].claimed).length;
  const chestReady = doneCount === QUESTS.length && !live.questChest.claimed;
  return (
    <ShopSheetFrame title="Quests">
      <div className="pj-modes" role="tablist">
        {(["daily", "weekly"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={`pj-mode-tab ${tab === t ? "is-on" : ""}`} onClick={() => setTab(t)}>
            {t === "daily" ? "Daily" : "Weekly"}
          </button>
        ))}
      </div>
      {tab === "daily" ? (
        <>
          <div className={`pj-quest-chest${chestReady ? " is-ready" : ""}`}>
            <img src="/icons/gift.webp" alt="" />
            <div className="min-w-0 flex-1">
              <b>Daily chest</b>
              <div className="pj-meter mt-1">
                <span style={{ width: `${(doneCount / QUESTS.length) * 100}%` }} />
              </div>
              <RewardChips grant={QUEST_CHEST} small />
            </div>
            <button type="button" className="pj-btn pj-btn-primary text-sm" disabled={!chestReady} onClick={(e) => { celebrateClaim(e, true); claimQuestChest(); }}>
              {live.questChest.claimed ? <Check className="size-4" /> : chestReady ? "Open" : `${doneCount}/${QUESTS.length}`}
            </button>
          </div>
          {QUESTS.map((q) => {
            const p = profile.quests[q.id];
            const ready = p.value >= q.target && !p.claimed;
            return (
              <QuestRow
                key={q.id}
                title={q.title}
                blurb={q.blurb}
                value={p.value}
                target={q.target}
                grant={{ coins: q.coins, gems: q.gems }}
                state={p.claimed ? "done" : ready ? "ready" : "open"}
                onClaim={() => claimQuest(q.id)}
              />
            );
          })}
        </>
      ) : (
        WEEKLY.map((w) => {
          const v = live.weekly.prog[w.id] ?? 0;
          const done = live.weekly.claimed.includes(w.id);
          return (
            <QuestRow
              key={w.id}
              title={w.title}
              blurb={w.blurb}
              value={v}
              target={w.target}
              grant={w.grant}
              state={done ? "done" : v >= w.target ? "ready" : "open"}
              onClaim={() => claimWeekly(w.id)}
            />
          );
        })
      )}
    </ShopSheetFrame>
  );
}

function QuestRow(p: { title: string; blurb: string; value: number; target: number; grant: Grant; state: "open" | "ready" | "done"; onClaim: () => void }) {
  return (
    <div className={`pj-quest is-${p.state}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-extrabold">{p.title}</div>
          <div className="text-xs text-muted">{p.blurb}</div>
          <RewardChips grant={p.grant} small />
        </div>
        <button type="button" className="pj-btn pj-btn-primary shrink-0 text-sm" disabled={p.state !== "ready"} onClick={(e) => { celebrateClaim(e); p.onClaim(); }}>
          {p.state === "done" ? <Check className="size-4" /> : p.state === "ready" ? "Claim" : `${formatInt(Math.min(p.value, p.target))}/${formatInt(p.target)}`}
        </button>
      </div>
      <div className="pj-meter mt-2">
        <span style={{ width: `${Math.min(100, (p.value / p.target) * 100)}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ lucky spin */

export function SpinSheet() {
  const rawLive = useGame((s) => s.profile.live);
  const live = useMemo(() => normalizeLive(rawLive), [rawLive]);
  const spinWheel = useGame((s) => s.spinWheel);
  const busy = useGame((s) => s.videoBusy);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<number | null>(null);
  const n = SPIN_PRIZES.length;
  const seg = 360 / n;
  const go = async (how: "free" | "video") => {
    if (spinning) return;
    setWon(null);
    const idx = await spinWheel(how);
    if (idx === null) return;
    setSpinning(true);
    // Land the prize under the pointer at the top, after a few full turns.
    const target = 360 * 6 + (360 - (idx * seg + seg / 2)) + (Math.random() - 0.5) * seg * 0.6;
    setAngle((a) => a - (a % 360) + target);
    window.setTimeout(() => {
      setSpinning(false);
      setWon(idx);
    }, 4200);
  };
  const extraLeft = SPIN_EXTRA_PER_DAY - live.spin.extra;
  const gradient = `conic-gradient(${SPIN_PRIZES.map((p, i) => `${p.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(", ")})`;
  return (
    <ShopSheetFrame title="Lucky Spin" sub="One free spin every day. Win up to 100 gems!">
      <div className="pj-wheel-wrap">
        <div className="pj-wheel-pointer" />
        <div className="pj-wheel" style={{ background: gradient, transform: `rotate(${angle}deg)`, transition: spinning ? "transform 4.1s cubic-bezier(0.12, 0.7, 0.08, 1)" : "none" }}>
          {SPIN_PRIZES.map((p, i) => {
            const part = grantParts(p.grant)[0]!;
            return (
              <div key={i} className="pj-wheel-seg" style={{ transform: `rotate(${i * seg + seg / 2}deg)` }}>
                <img src={part.icon} alt="" />
                <span>{p.label}</span>
              </div>
            );
          })}
        </div>
        <div className="pj-wheel-hub">SPIN</div>
      </div>
      {won !== null ? (
        <div className="pj-spin-won">
          <b>{SPIN_PRIZES[won]!.label === "JACKPOT" ? "JACKPOT!" : "You won!"}</b>
          <RewardChips grant={SPIN_PRIZES[won]!.grant} />
        </div>
      ) : null}
      {!live.spin.free ? (
        <button type="button" className="pj-btn pj-btn-primary w-full" disabled={spinning} onClick={() => void go("free")}>
          Free spin!
        </button>
      ) : (
        <button type="button" className="pj-cont-btn is-video" disabled={spinning || busy || extraLeft <= 0} onClick={() => void go("video")}>
          <span className="pj-cont-ico">
            <Play className="size-5" fill="currentColor" />
          </span>
          <span className="flex-1 text-left">
            <b>{extraLeft > 0 ? "Spin again" : "No spins left today"}</b>
            <small>{extraLeft > 0 ? `Watch a short video · ${extraLeft} left today` : "Your free spin resets tomorrow"}</small>
          </span>
        </button>
      )}
    </ShopSheetFrame>
  );
}

/* -------------------------------------------------------------- continue */

/** The "keep going" box on the game-over sheet. */
export function ContinueOptions() {
  const passes = useGame((s) => s.profile.live.passes);
  const gems = useGame((s) => s.profile.gems);
  const used = useGame((s) => s.videoContinueRun === s.runStats.startedAt);
  const busy = useGame((s) => s.videoBusy);
  const continueWith = useGame((s) => s.continueWith);
  const buyMoney = useGame((s) => s.buyMoney);
  const streak = useGame((s) => (s.match.mode === "adventure" || s.match.mode === "classic" ? s.profile.levelStreak : 0));
  return (
    <div className="pj-continue">
      <div className="pj-continue-title">Keep going?</div>
      {streak >= 2 ? <div className="pj-streak-warn">🔥 Continue to keep your {streak}-win streak and its free boosters!</div> : null}
      <button type="button" className="pj-cont-btn is-video" disabled={used || busy} onClick={() => void continueWith("video")}>
        <span className="pj-cont-ico">
          <Play className="size-5" fill="currentColor" />
        </span>
        <span className="flex-1 text-left">
          <b>{used ? "Video used this run" : "Watch a video"}</b>
          <small>Clears 3 rows + easier blocks</small>
        </span>
        <span className="pj-cont-tag">FREE</span>
      </button>
      {passes > 0 ? (
        <button type="button" className="pj-cont-btn is-pass" onClick={() => void continueWith("pass")}>
          <span className="pj-cont-ico">
            <img src="/icons/refresh.webp" alt="" />
          </span>
          <span className="flex-1 text-left">
            <b>Use a Continue Pass</b>
            <small>You have {passes} · Clears 3 rows + easier blocks</small>
          </span>
        </button>
      ) : (
        <button type="button" className="pj-cont-btn is-pass" onClick={() => void buyMoney("pass5")}>
          <span className="pj-cont-ico">
            <img src="/icons/refresh.webp" alt="" />
          </span>
          <span className="flex-1 text-left">
            <b>Get 5 Continue Passes</b>
            <small>Keep playing any time you get stuck</small>
          </span>
          <span className="pj-cont-tag is-money">{usd(3.99)}</span>
        </button>
      )}
      <button type="button" className="pj-cont-btn is-gems" disabled={gems < CONTINUE_COST} onClick={() => void continueWith("gems")}>
        <span className="pj-cont-ico">
          <img src="/icons/gem.webp" alt="" />
        </span>
        <span className="flex-1 text-left">
          <b>Continue with gems</b>
          <small>Clears your two fullest rows</small>
        </span>
        <span className="pj-cont-tag">
          <img src="/icons/gem.webp" alt="" className="inline size-3.5" /> {CONTINUE_COST}
        </span>
      </button>
    </div>
  );
}

/* ----------------------------------------------------------- house video */

const HOUSE_SECONDS = 15;

/** Our own rewarded video, used whenever no ad network is on the page. */
export function HouseAd() {
  const open = useHouseAd((s) => s.open);
  const finish = useHouseAd((s) => s.finish);
  const [left, setLeft] = useState(HOUSE_SECONDS);
  useEffect(() => {
    if (!open) return;
    setLeft(HOUSE_SECONDS);
    const t0 = Date.now();
    const id = window.setInterval(() => {
      const l = Math.max(0, HOUSE_SECONDS - Math.floor((Date.now() - t0) / 1000));
      setLeft(l);
      if (l === 0) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [open]);
  if (!open) return null;
  const done = left === 0;
  return (
    <div className="pj-housead" role="dialog" aria-label="Video">
      <div className="pj-housead-top">
        <span className="pj-housead-timer">{done ? "Reward ready" : `Reward in ${left}s`}</span>
        <button type="button" className="pj-housead-x" onClick={() => finish(done)} aria-label={done ? "Close and get reward" : "Skip without reward"}>
          <X className="size-4" />
        </button>
      </div>
      <div className="pj-housead-stage">
        <div className="pj-housead-glow" />
        <div className="pj-housead-kicker">From the makers of Block Journey</div>
        <div className="pj-housead-logo">
          99<span>%</span>
        </div>
        <div className="pj-housead-name">IMPOSSIBLE</div>
        <p className="pj-housead-copy">Can you beat the game 99% of players can't? Free to play.</p>
        <div className="pj-housead-dots" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <a className="pj-btn pj-btn-primary mt-4" href="https://99-percent-impossible.vercel.app" target="_blank" rel="noreferrer">
          Play free
        </a>
      </div>
      <div className="pj-housead-bar">
        <span style={{ width: `${((HOUSE_SECONDS - left) / HOUSE_SECONDS) * 100}%` }} />
      </div>
      {done ? (
        <button type="button" className="pj-btn pj-btn-primary pj-housead-claim" onClick={() => finish(true)}>
          Claim reward
        </button>
      ) : null}
    </div>
  );
}
