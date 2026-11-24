/**
 * Real-money checkout through Stripe. Prices come from the shared catalog on
 * the server, never from the browser. Needs STRIPE_SECRET_KEY in the
 * deployment; without it the shop says purchases aren't open yet.
 *
 * Each paid session pays out once: the first verify marks the payment as
 * claimed in Stripe's own metadata, so no database is needed.
 */
import { createServerFn } from "@tanstack/react-start";
import { moneyPrice } from "./liveops.ts";

type CreateResult = { ok: true; url: string } | { ok: false; error: "unconfigured" | "unknown-item" | "stripe" };
type VerifyResult = { ok: true; sku: string } | { ok: false; error: string };

const API = "https://api.stripe.com/v1";

function key(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

async function stripe(path: string, body?: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key()}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(String((json.error as { message?: string })?.message ?? res.status));
  return json;
}

async function origin(): Promise<string> {
  const server = await import("@tanstack/react-start/server");
  const host = server.getRequestHeader("x-forwarded-host") ?? server.getRequestHeader("host") ?? "localhost:8080";
  const proto = server.getRequestHeader("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const createCheckout = createServerFn({ method: "POST" })
  .validator((d: unknown) => ({ sku: String((d as { sku?: unknown })?.sku ?? "") }))
  .handler(async ({ data }): Promise<CreateResult> => {
    if (!key()) return { ok: false, error: "unconfigured" };
    const price = moneyPrice(data.sku);
    if (!price) return { ok: false, error: "unknown-item" };
    try {
      const base = await origin();
      const session = await stripe("/checkout/sessions", {
        mode: "payment",
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": String(Math.round(price.usd * 100)),
        "line_items[0][price_data][product_data][name]": `Block Journey: ${price.name}`,
        "metadata[sku]": data.sku,
        "payment_intent_data[metadata][sku]": data.sku,
        success_url: `${base}/?paid={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/?canceled=1`,
      });
      return { ok: true, url: String(session.url) };
    } catch {
      return { ok: false, error: "stripe" };
    }
  });

export const verifyCheckout = createServerFn({ method: "POST" })
  .validator((d: unknown) => ({ id: String((d as { id?: unknown })?.id ?? "") }))
  .handler(async ({ data }): Promise<VerifyResult> => {
    if (!key()) return { ok: false, error: "unconfigured" };
    if (!/^cs_[A-Za-z0-9_]+$/.test(data.id)) return { ok: false, error: "bad-id" };
    try {
      const s = await stripe(`/checkout/sessions/${data.id}`);
      if (s.payment_status !== "paid") return { ok: false, error: "unpaid" };
      const sku = String((s.metadata as Record<string, string>)?.sku ?? "");
      if (!moneyPrice(sku)) return { ok: false, error: "unknown-item" };
      const pi = String(s.payment_intent ?? "");
      if (pi) {
        const intent = await stripe(`/payment_intents/${pi}`);
        if ((intent.metadata as Record<string, string>)?.claimed === "1") return { ok: false, error: "claimed" };
        await stripe(`/payment_intents/${pi}`, { "metadata[claimed]": "1" });
      }
      return { ok: true, sku };
    } catch {
      return { ok: false, error: "stripe" };
    }
  });
