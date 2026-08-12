import { bootstrapOpen, contentTypeFor, json, validAssetKey } from '../_lib'
import type { Env } from '../_lib'

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const key = Array.isArray(params.key) ? params.key.join('/') : (params.key ?? '')
  if (!key) return json({ error: 'Missing asset key' }, 400)

  const object = await env.BOOK_ASSETS.get(key)
  if (!object) return json({ error: 'Asset not found' }, 404)

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('ETag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return new Response(object.body, { headers })
}

/**
 * Upload a single asset to R2.
 * Multipart form-data fields: `key` (path inside the bucket), `file`.
 * Allowed for guests only for `orders/` (customer photo uploads). Admin
 * assets (books/, styles/) require the admin digest unless the database is
 * still in its initial (unseeded) bootstrap window.
 */
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ error: 'Expected multipart form data' }, 400)
  }

  const key = String(form.get('key') ?? '')
  const file = form.get('file')
  if (!validAssetKey(key)) return json({ error: 'Invalid asset key' }, 400)
  if (!(file instanceof File) || file.size === 0) return json({ error: 'Missing file' }, 400)

  const open = await bootstrapOpen(env)
  const isOrderPhoto = key.startsWith('orders/')
  if (!open && !isOrderPhoto && !isAdmin(request)) {
    return json({ error: 'Unauthorized' }, 401)
  }

  await env.BOOK_ASSETS.put(key, file.stream(), {
    httpMetadata: { contentType: contentTypeFor(key) },
  })

  return json({ key, url: `/api/assets/${key}` })
}

function isAdmin(request: Request): boolean {
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer /, '')
  return token === '53842a1e388e10151d4a922030e00e4c74a93973c1a5b05937cee400811c1a36'
}
