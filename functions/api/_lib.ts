/**
 * Shared helpers for the Wonder Pages API (Cloudflare Pages Functions).
 *
 * Bindings:
 *   BOOK_ASSETS — R2 bucket storing every uploaded asset (covers, pages, photos, style refs)
 *   DB          — D1 database storing book/order/style metadata as JSON documents
 */

export interface Env {
  BOOK_ASSETS: R2Bucket
  DB: D1Database
}

/**
 * Thin admin gate. Mirrors the client-side admin auth (SHA-256 digest of
 * "username:password"). This is a presentation-level guard, consistent with
 * the app's security posture — replace with a real Workers auth/session
 * mechanism for production hardening.
 */
export const ADMIN_DIGEST = '53842a1e388e10151d4a922030e00e4c74a93973c1a5b05937cee400811c1a36'

export function json(data: unknown, status = 200, cache = 'no-store'): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache,
    },
  })
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new Error('Invalid JSON body')
  }
}

export function isAuthed(request: Request): boolean {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  return token.length > 0 && constantTimeEqual(token, ADMIN_DIGEST)
}

export function constantTimeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length)
  let diff = a.length === b.length ? 0 : 1
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

/* ------------------------------------------------------------------ */
/* D1 helpers                                                          */
/* ------------------------------------------------------------------ */

export async function getSetting(env: Env, key: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>()
  return row?.value ?? null
}

export async function setSetting(env: Env, key: string, value: string): Promise<void> {
  await env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind(key, value)
    .run()
}

export async function isSeeded(env: Env): Promise<boolean> {
  return (await getSetting(env, 'seeded')) === '1'
}

/** True while the database has never been seeded — used to bootstrap sample content. */
export async function bootstrapOpen(env: Env): Promise<boolean> {
  return !(await isSeeded(env))
}

/* ------------------------------------------------------------------ */
/* Asset helpers                                                       */
/* ------------------------------------------------------------------ */

const ALLOWED_ASSET_PREFIXES = ['books/', 'orders/', 'styles/', 'og/']
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'svg'])
const KEY_PATTERN = /^[a-z0-9-]+(\/[a-z0-9_.-]+)*\.(jpg|jpeg|png|webp|svg)$/i

export function validAssetKey(key: string): boolean {
  if (!KEY_PATTERN.test(key)) return false
  const prefix = key.split('/')[0] + '/'
  if (!ALLOWED_ASSET_PREFIXES.includes(prefix)) return false
  if (key.includes('..')) return false
  return true
}

export function contentTypeFor(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? ''
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}

export function assetUrl(key: string): string {
  return `/api/assets/${key}`
}

/** True for URLs produced by this API (or full URLs pointing at it). */
export function isAssetUrl(url: string): boolean {
  return url.startsWith('/api/assets/') || url.includes('/api/assets/')
}

export async function putAsset(env: Env, key: string, body: ArrayBuffer | Blob, contentType: string): Promise<void> {
  await env.BOOK_ASSETS.put(key, body, { httpMetadata: { contentType } })
}

export async function deleteAssetsWithPrefix(env: Env, prefix: string): Promise<void> {
  let cursor: string | undefined
  do {
    const listed = await env.BOOK_ASSETS.list({ prefix, cursor })
    if (listed.objects.length > 0) {
      await env.BOOK_ASSETS.delete(listed.objects.map((o) => o.key))
    }
    cursor = listed.truncated ? listed.cursor : undefined
  } while (cursor)
}
