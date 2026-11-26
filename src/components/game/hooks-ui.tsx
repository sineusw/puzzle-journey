/**
 * Comeback hooks: weekly island race, piggy bank, earned wheel spins.
 * Small tiles on the home screen open their sheets.
 */
import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/lib/game/store";
import {
  normalizeLive,
  PIGGY_CAP,
  PIGGY_MIN,
  PIGGY_USD,
  RACE_PRIZES,
  raceStandings,
  SPIN_EVERY,
  usd,
  weekEnd,
} from "@/lib/game/liveops";
import { RewardChips, ShopSheetFrame } from "./store-ui";
import { celebrateClaim } from "./claim-fx";

function useLive() {
  const raw = useGame((s) => s.profile.live);
  return useMemo(() => normalizeLive(raw), [raw]);
}

function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

function timeLeft(to: Date, now: Date): string {
  const ms = Math.max(0, to.getTime() - now.getTime());
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const MEDAL = ["🥇", "🥈", "🥉"];

/** Three big tiles on the home screen: Spin, Race, Piggy. */
export function HooksRow() {
  const live = useLive();
  const setPanel = useGame((s) => s.setPanel);
  const now = useNow();
  const rank = useMemo(() => raceStandings(live.race, now).findIndex((r) => r.me) + 1, [live.race, now]);
  const spins = live.earned.spins + (live.spin.free ? 0 : 1);
  const pig = Math.round((live.piggy / PIGGY_CAP) * 100);
  return (
    <div className="pj-hooks">
      <button type="button" className={`pj-hook is-spin${spins ? " is-hot" : ""}`} onClick={() => setPanel("spin")}>
        {spins ? <span className="pj-hook-badge">{spins}</span> : null}
        <span className="pj-hook-ico">🎡</span>
        <b>Spin</b>
        <small>{spins ? "Ready!" : `${SPIN_EVERY - live.earned.wins} wins`}</small>
      </button>
      <button type="button" className={`pj-hook is-race${live.race.reward ? " is-hot" : ""}`} onClick={() => setPanel("race")}>
        {live.race.reward ? <span className="pj-hook-badge">!</span> : null}
        <span className="pj-hook-ico">🏁</span>
        <b>Race</b>
        <small>{live.race.reward ? "Prize!" : `#${rank} · ${timeLeft(weekEnd(live.race.week), now)}`}</small>
      </button>
      <button type="button" className={`pj-hook is-piggy${live.piggy >= PIGGY_MIN ? " is-hot" : ""}`} onClick={() => setPanel("piggy")}>
        <span className="pj-hook-ico">🐷</span>
        <b>Piggy</b>
        <small>
          <span className="pj-hook-bar">
            <i style={{ width: `${pig}%` }} />
          </span>
        </small>
      </button>
    </div>
  );
}

export function RaceSheet() {
  const live = useLive();
  const now = useNow(15_000);
  const claimRace = useGame((s) => s.claimRace);
  const rows = useMemo(() => raceStandings(live.race, now), [live.race, now]);
  const myRank = rows.findIndex((r) => r.me) + 1;
  const ahead = myRank > 1 ? rows[myRank - 2]! : null;
  return (
    <ShopSheetFrame title="🏁 Island Race" sub={`Win the most islands this week. Ends in ${timeLeft(weekEnd(live.race.week), now)}.`}>
      {live.race.reward ? (
        <div className="pj-race-reward">
          <b>
            {MEDAL[live.race.reward.rank - 1]} You finished #{live.race.reward.rank} last week!
          </b>
          <RewardChips grant={RACE_PRIZES[live.race.reward.rank - 1]!} />
          <button
            type="button"
            className="pj-btn pj-btn-primary w-full"
            onClick={(e) => {
              celebrateClaim(e);
              claimRace();
            }}
          >
            Claim prize
          </button>
        </div>
      ) : null}
      <div className="pj-race-prizes">
        {RACE_PRIZES.map((g, i) => (
          <div key={i} className={`pj-race-prize p${i + 1}`}>
            <span>{MEDAL[i]}</span>
            <RewardChips grant={g} />
          </div>
        ))}
      </div>
      <div className="pj-race-tip">
        {myRank === 1 ? "You're in 1st! Keep winning to hold it." : ahead ? `${ahead.wins - live.race.wins + 1} more win${ahead.wins - live.race.wins + 1 === 1 ? "" : "s"} to pass ${ahead.name}!` : ""}
      </div>
      <ol className="pj-race-list">
        {rows.map((r, i) => (
          <li key={r.name + i} className={`${r.me ? "is-me" : ""}${i < 3 ? ` top${i + 1}` : ""}`}>
            <span className="pj-race-rank">{i < 3 ? MEDAL[i] : i + 1}</span>
            <span className="pj-race-av">{r.avatar}</span>
            <span className="pj-race-name">{r.name}</span>
            <span className="pj-race-wins">{r.wins} 🏝️</span>
          </li>
        ))}
      </ol>
    </ShopSheetFrame>
  );
}

export function PiggySheet() {
  const live = useLive();
  const breakPiggy = useGame((s) => s.breakPiggy);
  const fill = Math.min(1, live.piggy / PIGGY_CAP);
  const ready = live.piggy >= PIGGY_MIN;
  return (
    <ShopSheetFrame title="🐷 Piggy Bank" sub="Every island you win drops Jungle Coins in. Break it open to keep them all.">
      <div className={`pj-piggy${ready ? " is-ready" : ""}`}>
        <div className="pj-piggy-jar">
          <div className="pj-piggy-fill" style={{ height: `${Math.round(fill * 100)}%` }} />
          <span className="pj-piggy-pig">🐷</span>
        </div>
        <div className="pj-piggy-amt">
          <img src="/icons/coin.webp" alt="" /> {live.piggy.toLocaleString("en-US")}
          <small> / {PIGGY_CAP.toLocaleString("en-US")}</small>
        </div>
        <p className="pj-piggy-note">{live.piggy >= PIGGY_CAP ? "Full! It can't hold any more until you break it." : ready ? "Ready to break!" : `Breakable at ${PIGGY_MIN.toLocaleString("en-US")}. Keep winning!`}</p>
      </div>
      <button type="button" className="pj-btn pj-btn-primary w-full" disabled={!ready} onClick={breakPiggy}>
        Break it for {usd(PIGGY_USD)}
      </button>
    </ShopSheetFrame>
  );
}

/** On the win screen: a bonus spin when one was just earned, and where you stand in the race. */
export function WinHooks() {
  const live = useLive();
  const setPanel = useGame((s) => s.setPanel);
  const now = useNow();
  const rows = useMemo(() => raceStandings(live.race, now), [live.race, now]);
  const rank = rows.findIndex((r) => r.me) + 1;
  return (
    <div className="pj-winhooks">
      {live.earned.spins > 0 ? (
        <button type="button" className="pj-winhook is-spin" onClick={() => setPanel("spin")}>
          <span className="pj-winhook-ico">🎡</span>
          <span className="pj-winhook-txt">
            <b>Bonus spin earned!</b>
            <small>Tap to spin the Lucky Wheel</small>
          </span>
          <span className="pj-winhook-rank">›</span>
        </button>
      ) : (
        <div className="pj-winhook is-soft">
          <span className="pj-winhook-ico">🎡</span>
          <span className="pj-winhook-txt">
            <b>Bonus spin</b>
            <small>
              {SPIN_EVERY - live.earned.wins} more win{SPIN_EVERY - live.earned.wins === 1 ? "" : "s"}
            </small>
          </span>
          <span className="pj-winhook-dots" aria-hidden="true">
            {Array.from({ length: SPIN_EVERY }, (_, i) => (
              <i key={i} className={i < live.earned.wins ? "is-on" : ""} />
            ))}
          </span>
        </div>
      )}
      <button type="button" className="pj-winhook is-race" onClick={() => setPanel("race")}>
        <span className="pj-winhook-ico">🏁</span>
        <span className="pj-winhook-txt">
          <b>Island Race</b>
          <small>You're #{rank} of {rows.length}</small>
        </span>
        <span className="pj-winhook-rank">{rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}</span>
      </button>
    </div>
  );
}
