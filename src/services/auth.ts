/**
 * Admin authentication.
 *
 * This is a client-side gate only: credentials are verified against a stored
 * SHA-256 digest, never stored in plain text, and the session is kept in
 * sessionStorage with an expiry. The AuthService boundary is intentionally
 * small so a real server-side implementation (Cloudflare Workers + secure
 * session cookie) can replace it later without touching the UI.
 */

const SESSION_KEY = 'admin-session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const USERNAME = 'lingtuka'
const PASSWORD_DIGEST = '53842a1e388e10151d4a922030e00e4c74a93973c1a5b05937cee400811c1a36'

interface Session {
  username: string
  expiresAt: number
}

type AuthListener = (authed: boolean) => void

const listeners = new Set<AuthListener>()

function subscribe(fn: AuthListener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify(authed: boolean): void {
  for (const fn of listeners) fn(authed)
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Constant-time digest comparison. */
function safeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length)
  let diff = a.length === b.length ? 0 : 1
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

export const auth = {
  subscribe,
  isAuthed(): boolean {
    const session = readSession()
    return session !== null
  },
  async login(username: string, password: string): Promise<{ ok: boolean; reason?: string }> {
    if (!crypto?.subtle) {
      return { ok: false, reason: 'Secure login unavailable in this browser' }
    }
    const digest = await sha256Hex(`${username}:${password}`)
    const ok =
      username.trim().toLowerCase() === USERNAME && safeEqual(digest, PASSWORD_DIGEST)
    if (ok) {
      const session: Session = { username: username.trim().toLowerCase(), expiresAt: Date.now() + SESSION_TTL_MS }
      try {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      } catch {
        return { ok: false, reason: 'Could not create session in this browser' }
      }
      notify(auth.isAuthed())
    }
    return ok ? { ok: true } : { ok: false, reason: 'Invalid username or password' }
  },
  logout(): void {
    try {
      window.sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
    notify(auth.isAuthed())
  },
}

function readSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    if (typeof session.expiresAt !== 'number' || Date.now() > session.expiresAt) {
      window.sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

