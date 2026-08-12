import { bootstrapOpen, isAuthed, json } from './_lib'
import type { Env } from './_lib'

/**
 * Marks the database as seeded. Only callable once, during the bootstrap
 * window (or by an authenticated admin for manual re-seeding).
 */
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const open = await bootstrapOpen(env)
  if (!open && !isAuthed(request)) return json({ error: 'Unauthorized' }, 401)

  await env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind('seeded', '1')
    .run()

  return json({ ok: true, seeded: true })
}

