import { isAuthed, json } from './_lib'
import type { Env } from './_lib'

interface OrderRecord {
  id: string
  status: string
  customer: { name: string; city: string; locality: string; address: string; phone: string }
  childAge: number
  photos: string[]
  styleId: string
  styleName: string
  story: string
  product: { id: string; name: string; contentPages: number; totalPages: number; price: number }
  createdAt: string
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!isAuthed(request)) return json({ error: 'Unauthorized' }, 401)

  const rows = await env.DB.prepare('SELECT data FROM orders ORDER BY created_at DESC').all<{ data: string }>()
  const orders = (rows.results ?? []).map((r) => JSON.parse(r.data) as OrderRecord)
  return json({ orders })
}

/** Public guest checkout â€” no auth required. */
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let order: OrderRecord
  try {
    order = (await request.json()) as OrderRecord
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!order.id || typeof order.id !== 'string' || !order.customer?.name) {
    return json({ error: 'Invalid order' }, 400)
  }

  const record: OrderRecord = {
    ...order,
    status: 'new',
    createdAt: order.createdAt ?? new Date().toISOString(),
  }

  await env.DB.prepare('INSERT INTO orders (id, status, data, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING')
    .bind(record.id, record.status, JSON.stringify(record), record.createdAt)
    .run()

  return json({ order: record })
}

