/**
 * Rewarded videos. Uses a real ad network when one is on the page (Google's
 * H5 Games Ads `adBreak`, or a native bridge in the app-store build);
 * otherwise plays a 15-second house video promoting our other games, so the
 * reward flow works everywhere.
 */
import { create } from "zustand";

export type VideoReason = "continue" | "coins" | "double";

type AdState = {
  open: VideoReason | null;
  resolve: ((watched: boolean) => void) | null;
  finish: (watched: boolean) => void;
};

export const useHouseAd = create<AdState>((set, get) => ({
  open: null,
  resolve: null,
  finish: (watched) => {
    get().resolve?.(watched);
    set({ open: null, resolve: null });
  },
}));

type AdBreak = (o: {
  type: "reward";
  name: string;
  beforeReward: (show: () => void) => void;
  adDismissed: () => void;
  adViewed: () => void;
  adBreakDone: (info: { breakStatus: string }) => void;
}) => void;

type NativeAds = { showRewarded: (reason: string) => Promise<boolean> };

export function showRewardedVideo(reason: VideoReason): Promise<boolean> {
  const w = window as Window & { adBreak?: AdBreak; BlockJourneyAds?: NativeAds };
  if (w.BlockJourneyAds) return w.BlockJourneyAds.showRewarded(reason).catch(() => false);
  if (w.adBreak) {
    return new Promise((resolve) => {
      let done = false;
      let shown = false;
      const end = (v: boolean) => {
        if (!done) {
          done = true;
          resolve(v);
        }
      };
      w.adBreak!({
        type: "reward",
        name: `bj-${reason}`,
        beforeReward: (show) => {
          shown = true;
          show();
        },
        adDismissed: () => end(false),
        adViewed: () => end(true),
        adBreakDone: () => {
          // No ad available right now: fall back to the house video.
          if (!shown) houseAd(reason).then(end);
          else end(false);
        },
      });
    });
  }
  return houseAd(reason);
}

function houseAd(reason: VideoReason): Promise<boolean> {
  return new Promise((resolve) => useHouseAd.setState({ open: reason, resolve }));
}
