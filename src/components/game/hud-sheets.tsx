import { SHOP } from "@/lib/game/liveops";
import { xpForLevel } from "@/lib/game/content";
import { isNative } from "@/lib/game/native";
import { useGame } from "@/lib/game/store";
import { ItemCard, ShopSheetFrame, Wallet } from "./store-ui";

/** Tap the coins or gems at the top: buy packs of that currency (and the other one below). */
export function CurrencySheet({ first }: { first: "coins" | "gems" }) {
  const order: Array<"coins" | "gems"> = first === "coins" ? ["coins", "gems"] : ["gems", "coins"];
  return (
    <ShopSheetFrame title={first === "coins" ? "Get Jungle Coins" : "Get Gems"} sub={<Wallet />} wide>
      {order.map((sec) => (
        <section key={sec} className="pj-shop-sec">
          <h3>{sec === "coins" ? "🪙 Coin packs" : "💎 Gem packs"}</h3>
          <p className="pj-cur-help">{sec === "coins" ? "Pay with gems or real money." : "Pay with Jungle Coins or real money."}</p>
          <div className="pj-item-grid">
            {SHOP.filter((i) => i.section === sec).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
      <p className="pj-fine">{isNative() ? "Purchases are handled by Apple." : "Real-money purchases are processed securely by Stripe."}</p>
    </ShopSheetFrame>
  );
}

/** Tap the level badge: progress to the next level and how XP is earned. */
export function LevelSheet() {
  const level = useGame((s) => s.profile.level);
  const xp = useGame((s) => s.profile.xp);
  const need = xpForLevel(level);
  const pct = Math.min(100, Math.round((xp / need) * 100));
  return (
    <ShopSheetFrame title={`Level ${level}`}>
      <div className="pj-lvl">
        <div className="pj-lvl-badge font-display">{level}</div>
        <div className="pj-lvl-bar" aria-label={`${pct}% to level ${level + 1}`}>
          <span style={{ width: `${pct}%` }} />
          <b>{pct}%</b>
        </div>
        <div className="pj-lvl-nums tabular-nums">
          {xp.toLocaleString("en-US")} / {need.toLocaleString("en-US")} XP
        </div>
        <div className="pj-lvl-next">
          <b className="tabular-nums">{(need - xp).toLocaleString("en-US")} XP</b> to reach Level {level + 1}
        </div>
        <ul className="pj-lvl-how">
          <li>⭐ Every point you score earns XP (1 XP per 12 points)</li>
          <li>🔥 Big combos and multi-line clears score the most</li>
          <li>🎁 Each new level gives you a reward</li>
        </ul>
      </div>
    </ShopSheetFrame>
  );
}

/** "Are you sure?" before wiping progress. */
export function ResetSheet() {
  const setPanel = useGame((s) => s.setPanel);
  const resetProgress = useGame((s) => s.resetProgress);
  return (
    <div className="pj-sheet text-center">
      <div className="text-4xl">⚠️</div>
      <h2 className="font-display mt-2 text-2xl text-cream">Reset all progress?</h2>
      <p className="mt-2 text-sm text-muted">Islands, stars, coins, gems, boosters and skins all go back to the start. You'll get an Undo button right after, just in case.</p>
      <button type="button" className="pj-btn pj-btn-primary mt-4 w-full" onClick={() => setPanel(null)}>
        No, keep my progress
      </button>
      <button type="button" className="pj-btn pj-btn-ghost mt-2 w-full text-danger" onClick={resetProgress}>
        Yes, reset everything
      </button>
    </div>
  );
}

/** Shown after a reset until the player undoes it or closes it. */
export function UndoResetBar() {
  const can = useGame((s) => s.canUndoReset);
  const undo = useGame((s) => s.undoReset);
  if (!can) return null;
  return (
    <div className="pj-undo-bar" role="status">
      <span>Progress reset.</span>
      <button type="button" onClick={undo}>
        Undo
      </button>
      <button type="button" className="is-x" aria-label="Dismiss" onClick={() => useGame.setState({ canUndoReset: false })}>
        ✕
      </button>
    </div>
  );
}
