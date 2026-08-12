import { bootstrapOpen, isAuthed, json } from '../_lib'
import type { Env } from '../_lib'

interface StyleRecord {
  id: string
  name: string
  description: string
  imageUrl: string | null
  enabled: boolean
}

/** Upsert one style record at /api/styles/:id. */
export const onRequestPut: PagesFunction<Env> = async ({ env, request, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  if (!id) return json({ error: 'Missing style id' }, 400)
  if (!isAuthed(request)) {
    if (!(await bootstrapOpen(env))) return json({ error: 'Unauthorized' }, 401)
  }

  let style: StyleRecord
  try {
    style = (await request.json()) as StyleRecord
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const record: StyleRecord = {
    id,
    name: style.name ?? '',
    description: style.description ?? '',
    imageUrl: style.imageUrl ?? null,
    enabled: style.enabled !== false,
  }

  await env.DB.prepare('INSERT INTO styles (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data')
    .bind(id, JSON.stringify(record))
    .run()

  return json({ style: record })
}
