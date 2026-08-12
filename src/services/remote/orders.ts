import type { Order, OrderStatus } from '../types'
import { api, uploadAsset } from '../api'
import { generateOrderId } from '@/lib/utils'
import { PRODUCT } from '@/lib/constants'
import type { CreateOrderInput } from '../orders'

export async function remoteListOrders(): Promise<Order[]> {
  const { orders } = await api<{ orders: Order[] }>('/api/orders')
  return orders
}

export async function remoteCreateOrder(input: CreateOrderInput): Promise<Order> {
  const id = generateOrderId()
  const photos: string[] = []
  for (let i = 0; i < input.photos.length; i++) {
    const { url } = await uploadAsset(`orders/${id}/photo-${i + 1}.webp`, input.photos[i])
    photos.push(url)
  }

  const order: Order = {
    id,
    status: 'new',
    customer: {
      name: input.customer.name.trim(),
      city: input.customer.city.trim(),
      locality: input.customer.locality.trim(),
      address: input.customer.address.trim(),
      phone: input.customer.phone.trim(),
    },
    childAge: input.childAge,
    photos,
    styleId: input.styleId,
    styleName: input.styleName,
    story: input.story.trim(),
    product: { ...PRODUCT },
    createdAt: new Date().toISOString(),
  }

  const { order: saved } = await api<{ order: Order }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  })
  return saved
}

export async function remoteUpdateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { order } = await api<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return order
}

export async function remoteDeleteOrder(id: string): Promise<void> {
  await api(`/api/orders/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
