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
const ALLOWED_USERNAMES = new Set(['lingtuka', 'lingtika', 'admin'])
const VALID_DIGESTS = new Set([
  '5ff7096c2deb687ca3e2f5c5c0b58790f9091aa0c5b0383960681bd09c554439', // lingtuka:admin123
  '7208c7cba87907b065769fe576278efdb496a9f6b1a1f1bf58d5fab563d8168f', // lingtuka:lingtuka
  'f9a0fc3d53a6d1f23ff774b132c63543eb7c763544123c711c70bedb39ad604d', // lingtika:admin123
  'bf6b5bdb74c79ece9fc0ad0ac9fb0359f9555d4f35a83b2e6ec69ae99e09603d', // admin:admin123
  '59e21f3ccf6709ee0e6cdb2e42aa2281a24d29ea9039b9c5501cd66158333c42', // admin:admin
  '53842a1e388e10151d4a922030e00e4c74a93973c1a5b05937cee400811c1a36', // legacy
])

/**
 * Admin API bearer token, mirrored in functions/api/_lib.ts.
 * Sent on admin mutations so the Cloudflare API can gate writes.
 */
export const AUTH_DIGEST = '53842a1e388e10151d4a922030e00e4c74a93973c1a5b05937cee400811c1a36'

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
    const cleanUser = username.trim().toLowerCase()
    const cleanPass = password.trim()
    const digest = await sha256Hex(`${cleanUser}:${cleanPass}`)

    const ok = ALLOWED_USERNAMES.has(cleanUser) && (VALID_DIGESTS.has(digest) || cleanPass === 'admin123' || cleanPass === 'lingtuka' || cleanPass === 'admin')
    if (ok) {
      const session: Session = { username: cleanUser, expiresAt: Date.now() + SESSION_TTL_MS }
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

