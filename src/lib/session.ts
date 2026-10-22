import crypto from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "rp_session";
const SECRET = process.env.SESSION_SECRET ?? "dev-only-renovation-planner-secret";

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
}

export function encodeSession(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function decodeSession(token: string | undefined | null): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 1) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(userId);
  if (sig.length !== expected.length) return null;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? userId : null;
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

export async function setSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
