import { isAuthed, json } from '../_lib'
import type { Env } from '../_lib'

export const onRequestPatch: PagesFunction<Env> = async ({ env, request, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  if (!id) return json({ error: 'Missing order id' }, 400)
  if (!isAuthed(request)) return json({ error: 'Unauthorized' }, 401)

  let body: { status?: string }
  try {
    body = (await request.json()) as { status?: string }
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const allowed = ['new', 'confirmed', 'in-progress', 'completed', 'cancelled']
  if (!body.status || !allowed.includes(body.status)) {
    return json({ error: 'Invalid status' }, 400)
  }

  const row = await env.DB.prepare('SELECT data FROM orders WHERE id = ?').bind(id).first<{ data: string }>()
  if (!row) return json({ error: 'Order not found' }, 404)

  const order = JSON.parse(row.data) as { status: string }
  order.status = body.status

  await env.DB.prepare('UPDATE orders SET status = ?, data = ? WHERE id = ?').bind(body.status, JSON.stringify(order), id).run()

  return json({ order })
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, request, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  if (!id) return json({ error: 'Missing order id' }, 400)
  if (!isAuthed(request)) return json({ error: 'Unauthorized' }, 401)

  await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run()
  return json({ ok: true })
}
