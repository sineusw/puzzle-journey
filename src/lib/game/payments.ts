/** Browser side of real-money purchases (see payments-api.ts). */
import { createCheckout, verifyCheckout } from "./payments-api.ts";

export async function startCheckout(sku: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await createCheckout({ data: { sku } });
    if (res.ok) {
      window.location.href = res.url;
      return { ok: true };
    }
    return {
      ok: false,
      message: res.error === "unconfigured" ? "Real-money purchases open soon. Use coins for now!" : "Couldn't open checkout. Try again.",
    };
  } catch {
    return { ok: false, message: "Couldn't reach the store. Check your connection." };
  }
}

/** After Stripe sends the player back: pay out a completed purchase once. */
export async function claimCheckoutReturn(grant: (sku: string, sessionId: string) => void, toast: (msg: string) => void): Promise<void> {
  const url = new URL(window.location.href);
  const id = url.searchParams.get("paid");
  const canceled = url.searchParams.has("canceled");
  if (!id && !canceled) return;
  url.searchParams.delete("paid");
  url.searchParams.delete("canceled");
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  if (!id) return;
  try {
    const res = await verifyCheckout({ data: { id } });
    if (res.ok) grant(res.sku, id);
    else if (res.error !== "claimed") toast("We couldn't confirm that purchase. If you were charged, contact support.");
  } catch {
    toast("We couldn't confirm that purchase yet. Reopen the game to retry.");
  }
}
