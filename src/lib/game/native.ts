/**
 * iPhone app (Capacitor) glue. Everything here is a no-op on the website.
 * The native shell injects `window.Capacitor`; plugins are reached through
 * `Capacitor.Plugins`, so the web bundle needs no native packages.
 */

/** Where the app sends leaderboard and other server calls. */
export const API_BASE = "https://puzzle-journey-ruby.vercel.app";
/** App Store Connect product ids: this prefix + the shop sku (":" becomes "_"). */
export const PRODUCT_PREFIX = "com.pettygamesstudios.blockjourney.";

type Plugins = Record<string, Record<string, (opts?: unknown) => Promise<unknown>> | undefined>;
type Cap = { isNativePlatform?: () => boolean; Plugins?: Plugins };

function cap(): Cap | null {
  if (typeof window === "undefined") return null;
  return ((window as unknown as { Capacitor?: Cap }).Capacitor ?? null) as Cap | null;
}

export function isNative(): boolean {
  return Boolean(cap()?.isNativePlatform?.());
}

export function productId(sku: string): string {
  return PRODUCT_PREFIX + sku.replace(":", "_");
}

/** Server calls are relative on the website; in the app they go to the live site. */
export function patchFetchForNative(): void {
  if (!isNative()) return;
  const w = window as unknown as { __pjFetchPatched?: boolean };
  if (w.__pjFetchPatched) return;
  w.__pjFetchPatched = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && /^\/(_serverFn|api)\//.test(input)) return orig(API_BASE + input, init);
    if (input instanceof URL && input.origin === location.origin && /^\/(_serverFn|api)\//.test(input.pathname)) {
      return orig(API_BASE + input.pathname + input.search, init);
    }
    return orig(input, init);
  };
}

/** Buy through Apple. Resolves with a transaction id, or throws (message "canceled" when the player backs out). */
export async function nativeBuy(sku: string): Promise<string> {
  const P = cap()?.Plugins?.NativePurchases;
  if (!P?.purchaseProduct) throw new Error("Purchases aren't available right now.");
  try {
    const t = (await P.purchaseProduct({ productIdentifier: productId(sku), productType: "inapp", quantity: 1 })) as { transactionId?: string } | null;
    return t?.transactionId ? `ios:${t.transactionId}` : `ios:${sku}:${Date.now()}`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e ?? "");
    throw new Error(/cancel/i.test(msg) ? "canceled" : msg || "Purchase failed.");
  }
}

/** Skus the player owns on this Apple ID (skins and one-time offers), for Restore purchases. */
export async function nativeRestore(): Promise<string[]> {
  const P = cap()?.Plugins?.NativePurchases;
  if (!P?.restorePurchases || !P.getPurchases) throw new Error("Purchases aren't available right now.");
  await P.restorePurchases();
  const r = (await P.getPurchases({ productType: "inapp" })) as { purchases?: Array<{ productIdentifier?: string }> } | null;
  return (r?.purchases ?? [])
    .map((p) => String(p.productIdentifier ?? ""))
    .filter((id) => id.startsWith(PRODUCT_PREFIX))
    .map((id) => id.slice(PRODUCT_PREFIX.length).replace(/^skin_/, "skin:"));
}

/** A light tap on the phone, where supported. */
export function haptic(style: "LIGHT" | "MEDIUM" | "HEAVY" = "LIGHT"): void {
  const H = cap()?.Plugins?.Haptics;
  void H?.impact?.({ style }).catch(() => {});
}

/* ---------------------------------------------------- reminder notifications */

export type Reminder = { id: number; title: string; body: string; at: Date };

function notes() {
  return isNative() ? cap()?.Plugins?.LocalNotifications : undefined;
}

/** Ask once (after the player's first win, never on launch) to send reminders. */
export async function askForReminders(): Promise<void> {
  const n = notes();
  if (!n) return;
  try {
    const cur = (await n.checkPermissions?.()) as { display?: string } | undefined;
    if (cur?.display === "prompt" || cur?.display === "prompt-with-rationale") await n.requestPermissions?.();
  } catch {
    /* ignore */
  }
}

/** Replace any pending reminders with these (called when the app goes to the background). */
export async function scheduleReminders(list: Reminder[]): Promise<void> {
  const n = notes();
  if (!n) return;
  try {
    const cur = (await n.checkPermissions?.()) as { display?: string } | undefined;
    if (cur?.display !== "granted") return;
    const pending = (await n.getPending?.()) as { notifications?: Array<{ id: number }> } | undefined;
    if (pending?.notifications?.length) await n.cancel?.({ notifications: pending.notifications.map((x) => ({ id: x.id })) });
    const future = list.filter((r) => r.at.getTime() > Date.now() + 60_000);
    if (future.length) await n.schedule?.({ notifications: future.map((r) => ({ id: r.id, title: r.title, body: r.body, schedule: { at: r.at, allowWhileIdle: true } })) });
  } catch {
    /* ignore */
  }
}

/** Back in the app: clear what's pending (it'll be rescheduled next time they leave). */
export async function clearReminders(): Promise<void> {
  const n = notes();
  if (!n) return;
  try {
    const pending = (await n.getPending?.()) as { notifications?: Array<{ id: number }> } | undefined;
    if (pending?.notifications?.length) await n.cancel?.({ notifications: pending.notifications.map((x) => ({ id: x.id })) });
  } catch {
    /* ignore */
  }
}
