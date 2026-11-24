/**
 * Server functions for ranked runs. The browser calls these; everything that
 * touches the database or the player cookie runs on the server only.
 *
 * Off (answers "unavailable") wherever scores couldn't be kept safely: in a
 * deployed build with no DATABASE_URL (the PGLite fallback can't run there),
 * and in the claude.ai preview, which has no server at all (the calls fail and
 * the client shows no verified board).
 */

import { createServerFn } from "@tanstack/react-start";
import type { BoardRow, StartResult, SubmitResult } from "./ranked-service.ts";

const COOKIE = "bj_player";

type Ctx = {
  sql: import("./ranked-service.ts").RankedSql;
  svc: typeof import("./ranked-service.ts");
  playerId: string | null;
  ip: string;
  remember: (id: string) => void;
};

/** Open the database and read the caller, or null when ranked play is off here. */
async function context(): Promise<Ctx | null> {
  const deployed = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  // Deployed without a real database: stay off. (Don't even load the database
  // helper: its PGLite fallback can't start inside a deployed function.)
  if (deployed && !process.env.DATABASE_URL?.trim()) return null;
  const db = await import("@/lib/db");
  const server = await import("@tanstack/react-start/server");
  const svc = await import("./ranked-service.ts");
  const sql = await db.getSql();
  const ip = server.getRequestIP({ xForwardedFor: true }) ?? "unknown";
  return {
    sql,
    svc,
    playerId: server.getCookie(COOKIE) ?? null,
    ip,
    remember: (id) =>
      server.setCookie(COOKIE, id, {
        httpOnly: true,
        sameSite: "lax",
        secure: deployed,
        path: "/",
        maxAge: 60 * 60 * 24 * 400,
      }),
  };
}

export const rankedStart = createServerFn({ method: "POST" }).handler(async (): Promise<StartResult> => {
  const ctx = await context();
  if (!ctx) return { ok: false, error: "unavailable" };
  const res = await ctx.svc.startRun(ctx.sql, { playerId: ctx.playerId, ip: ctx.ip });
  if (res.ok && res.playerId !== ctx.playerId) ctx.remember(res.playerId);
  // The player id stays in the http-only cookie; the page never needs it.
  return res.ok ? { ...res, playerId: "" } : res;
});

export const rankedSubmit = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const x = (d ?? {}) as { runId?: unknown; moves?: unknown };
    return { runId: x.runId, moves: x.moves };
  })
  .handler(async ({ data }): Promise<SubmitResult> => {
    const ctx = await context();
    if (!ctx) return { ok: false, error: "unavailable" };
    return ctx.svc.submitRun(ctx.sql, { playerId: ctx.playerId, ip: ctx.ip }, data.runId, data.moves);
  });

export const rankedBoard = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ available: boolean; rows: BoardRow[] }> => {
    const ctx = await context();
    if (!ctx) return { available: false, rows: [] };
    return { available: true, rows: await ctx.svc.verifiedBoard(ctx.sql, ctx.playerId) };
  },
);

export const rankedSetNick = createServerFn({ method: "POST" })
  .validator((d: unknown) => ({ nick: (d as { nick?: unknown } | null)?.nick }))
  .handler(async ({ data }): Promise<{ ok: boolean; nick?: string }> => {
    const ctx = await context();
    if (!ctx) return { ok: false };
    return ctx.svc.setNick(ctx.sql, ctx.playerId, data.nick);
  });
