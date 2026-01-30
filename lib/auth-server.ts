import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Best-effort helper to resolve the current authenticated user id in route handlers.
 *
 * Note: BetterAuth server APIs vary by version; this is intentionally defensive
 * and falls back to `null` rather than throwing.
 */
export async function getRequestUserId(request: NextRequest): Promise<string | null> {
  const api = (auth as unknown as { api?: Record<string, unknown> }).api as
    | { getSession?: (args: { headers: unknown }) => Promise<unknown> }
    | undefined;

  if (!api?.getSession) return null;

  const tryParseUserId = (sessionResult: unknown): string | null => {
    if (!sessionResult || typeof sessionResult !== "object") return null;
    const r = sessionResult as Record<string, unknown>;
    const user = r.user;
    const session = r.session;
    const data = r.data;

    const userIdCandidates: unknown[] = [];

    if (user && typeof user === "object") {
      userIdCandidates.push((user as Record<string, unknown>).id);
    }
    if (session && typeof session === "object") {
      userIdCandidates.push((session as Record<string, unknown>).userId);
    }
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (d.user && typeof d.user === "object") {
        userIdCandidates.push((d.user as Record<string, unknown>).id);
      }
      if (d.session && typeof d.session === "object") {
        userIdCandidates.push((d.session as Record<string, unknown>).userId);
      }
    }

    for (const candidate of userIdCandidates) {
      if (typeof candidate === "string") return candidate;
    }
    return null;
  };

  // Attempt 1: pass the Headers object directly
  try {
    const sessionResult = await api.getSession({ headers: request.headers });
    const userId = tryParseUserId(sessionResult);
    if (userId) return userId;
  } catch {
    // ignore
  }

  // Attempt 2: pass a plain object
  try {
    const headersObj = Object.fromEntries(request.headers.entries());
    const sessionResult = await api.getSession({ headers: headersObj });
    return tryParseUserId(sessionResult);
  } catch {
    return null;
  }
}

