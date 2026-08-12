import type { Order, OrderStatus } from './types'
import { idb, kv } from './storage'
import { generateOrderId } from '@/lib/utils'
import { PRODUCT } from '@/lib/constants'

const INDEX_KEY = 'orders:index'
const RECORD_PREFIX = 'order:'

export interface CreateOrderInput {
  customer: Order['customer']
  childAge: number
  photos: string[]
  styleId: string
  styleName: string
  story: string
}

function sortNewestFirst(list: Order[]): Order[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function readIndex(): Order[] {
  const index = kv.get<Order[]>(INDEX_KEY)
  return Array.isArray(index) ? index : []
}

function writeIndex(index: Order[]): void {
  kv.set(INDEX_KEY, index)
}

async function rebuildIndexIfMissing(): Promise<void> {
  if (readIndex().length > 0) return
  const keys = await idb.keys(RECORD_PREFIX)
  const orders: Order[] = []
  for (const key of keys) {
    const order = await idb.get<Order>(key)
    if (order) orders.push(order)
  }
  writeIndex(orders)
}

export async function listOrders(): Promise<Order[]> {
  await rebuildIndexIfMissing()
  return sortNewestFirst(readIndex())
}

export async function getOrder(id: string): Promise<Order | null> {
  const order = await idb.get<Order>(RECORD_PREFIX + id)
  return order && typeof order.id === 'string' ? order : null
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const order: Order = {
    id: generateOrderId(),
    status: 'new',
    customer: {
      name: input.customer.name.trim(),
      city: input.customer.city.trim(),
      locality: input.customer.locality.trim(),
      address: input.customer.address.trim(),
      phone: input.customer.phone.trim(),
    },
    childAge: input.childAge,
    photos: input.photos,
    styleId: input.styleId,
    styleName: input.styleName,
    story: input.story.trim(),
    product: { ...PRODUCT },
    createdAt: new Date().toISOString(),
  }
  await idb.set(RECORD_PREFIX + order.id, order)
  writeIndex([order, ...readIndex()])
  return order
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const order = await getOrder(id)
  if (!order) throw new Error('Order not found')
  order.status = status
  await idb.set(RECORD_PREFIX + id, order)
  const index = readIndex()
  const idx = index.findIndex((o) => o.id === id)
  if (idx >= 0) index[idx] = order
  writeIndex(index)
  return order
}

export async function deleteOrder(id: string): Promise<void> {
  await idb.remove(RECORD_PREFIX + id)
  writeIndex(readIndex().filter((o) => o.id !== id))
}

/** Internal helper used by seeding so sample orders keep stable dates. */
export async function setOrderCreatedAt(id: string, createdAt: string): Promise<void> {
  const order = await getOrder(id)
  if (!order) return
  order.createdAt = createdAt
  await idb.set(RECORD_PREFIX + id, order)
  const index = readIndex()
  const idx = index.findIndex((o) => o.id === id)
  if (idx >= 0) {
    index[idx] = { ...index[idx], createdAt }
    writeIndex(index)
  }
}
