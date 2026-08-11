import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "admin_session";
export const CSRF_COOKIE = "csrf_token";

export interface SessionUser {
  id: string;
  username: string;
}

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add it to your .env file (see .env.example)."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ ...user } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.id !== "string" || typeof payload.username !== "string")
      return null;
    return { id: payload.id, username: payload.username };
  } catch {
    return null;
  }
}

/** Reads and verifies the admin session from a request (middleware / route handlers). */
export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Reads and verifies the admin session from server components (next/headers). */
export async function getSessionFromCookies(cookieStore: {
  get(name: string): { value?: string } | undefined;
}) {
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Double-submit CSRF check for state-changing admin API calls. */
export function csrfOk(req: NextRequest) {
  const cookie = req.cookies.get(CSRF_COOKIE)?.value;
  const header = req.headers.get("x-csrf-token");
  return Boolean(cookie && header && cookie === header);
}

/**
 * Guards admin API mutations: requires a valid session AND a matching CSRF
 * token. Returns an error response when unauthorized, or null when allowed.
 */
export async function requireAdminMutation(
  req: NextRequest
): Promise<NextResponse | null> {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorized();
  if (!csrfOk(req)) {
    return NextResponse.json(
      { error: "Security token missing or invalid. Please refresh the page and try again." },
      { status: 403 }
    );
  }
  return null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function newCsrfToken() {
  return (
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  );
}

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
