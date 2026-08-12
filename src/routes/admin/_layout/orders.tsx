import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ClipboardList, Lock, Phone, MapPin, BookOpen, Trash2, MessageSquare, Download } from 'lucide-react'
import { SpinnerScreen } from '@/components/ui/Spinner'
import { ErrorBanner } from '@/components/ui/Fields'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Modal'
import { ORDER_STATUSES, PRICE_LABEL, statusLabel, type OrderStatusValue } from '@/lib/constants'
import { useOrders } from '@/services/hooks'
import { usePageMeta } from '@/lib/seo'
import * as orderService from '@/services/orders'
import { formatDate } from '@/lib/utils'
import type { Order } from '@/services/types'
import { cn } from '@/lib/utils'

const statusTone = (s: OrderStatusValue) =>
  s === 'new' ? 'coral' : s === 'completed' ? 'leaf' : s === 'cancelled' ? 'red' : s === 'in-progress' ? 'sun' : 'ink'

export const Route = createFileRoute('/admin/_layout/orders')({ component: AdminOrdersRoute })

function AdminOrdersRoute() {
  usePageMeta({ title: 'Orders' })
  const { data: orders, loading, error, reload } = useOrders()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [statusBusy, setStatusBusy] = useState<string | null>(null)

  async function changeStatus(order: Order, status: OrderStatusValue) {
    setStatusBusy(order.id)
    setActionError(null)
    try {
      await orderService.updateOrderStatus(order.id, status)
      reload()
    } catch {
      setActionError('Could not update the order status')
    } finally {
      setStatusBusy(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)
    try {
      await orderService.deleteOrder(deleteTarget.id)
      setDeleteTarget(null)
      if (expanded === deleteTarget.id) setExpanded(null)
      reload()
    } catch {
      setActionError('Could not delete the order')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <SpinnerScreen label="Loading orders…" />
  if (error) return <ErrorBanner message={error} onRetry={reload} />

  const countBy = (s: OrderStatusValue) => (orders ?? []).filter((o) => o.status === s).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading-display text-3xl">Orders</h1>
          <p className="mt-1 text-ink-500">
            Customer details, photos and stories are private — visible only here in the admin console.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-coral-100 px-3 py-1.5 text-coral-700">New: {countBy('new')}</span>
          <span className="rounded-full bg-sun-100 px-3 py-1.5 text-amber-700">In progress: {countBy('in-progress')}</span>
          <span className="rounded-full bg-leaf-100 px-3 py-1.5 text-leaf-700">Completed: {countBy('completed')}</span>
        </div>
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      {!orders || orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-paper-300 bg-paper-100/60 px-6 py-16 text-center">
          <ClipboardList className="size-10 text-coral-500" aria-hidden="true" />
          <p className="font-bold text-ink-900">No orders yet</p>
          <p className="text-sm text-ink-500">New customer orders will appear here as soon as they&rsquo;re placed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const open = expanded === order.id
            return (
              <article
                key={order.id}
                className={cn('overflow-hidden rounded-3xl border bg-white shadow-card', open ? 'border-coral-300' : 'border-paper-200')}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : order.id)}
                  aria-expanded={open}
                  className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 text-left hover:bg-paper-50/70"
                >
                  <div className="min-w-40">
                    <p className="text-sm font-extrabold text-coral-600">{order.id}</p>
                    <p className="text-xs text-ink-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="min-w-44">
                    <p className="font-bold text-ink-900">{order.customer.name}</p>
                    <p className="text-xs font-semibold text-coral-600">Child: {order.childName || 'Not specified'}</p>
                    <p className="flex items-center gap-1 text-xs text-ink-500 mt-0.5">
                      <MapPin className="size-3" aria-hidden="true" />
                      {order.customer.city} · {order.customer.locality}
                    </p>
                  </div>
                  <div className="min-w-24">
                    <p className="text-sm text-ink-500">Style</p>
                    <p className="text-sm font-bold text-ink-900">{order.styleName || '—'}</p>
                  </div>
                  <div className="min-w-20">
                    <p className="text-sm text-ink-500">Total</p>
                    <p className="text-sm font-extrabold text-ink-900">{PRICE_LABEL}</p>
                  </div>
                  <Badge tone={statusTone(order.status)} className="ml-auto">
                    {statusLabel(order.status)}
                  </Badge>
                </button>

                {open && (
                  <div className="animate-fade-in border-t border-paper-200 px-5 py-5">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4">
                        <section>
                          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide text-ink-500">
                            <Phone className="size-4" aria-hidden="true" /> Customer &amp; Child details
                          </h3>
                          <dl className="space-y-1.5 rounded-2xl bg-paper-100/70 p-4 text-sm">
                            <Row k="Parent / Buyer Name" v={order.customer.name} />
                            <Row k="Child's Name (Naupang Hming)" v={order.childName || 'Not specified'} />
                            <Row k="Phone" v={order.customer.phone} />
                            <Row k="Town / City" v={order.customer.city} />
                            <Row k="Locality" v={order.customer.locality} />
                            <Row k="House address" v={order.customer.address} />
                            <Row k={'Child\u2019s age'} v={String(order.childAge)} />
                          </dl>
                        </section>
                        <section>
                          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide text-ink-500">
                            <MessageSquare className="size-4" aria-hidden="true" /> Story request
                          </h3>
                          <p className="rounded-2xl bg-paper-100/70 p-4 text-sm italic leading-relaxed text-ink-700">
                            {order.story || 'No story provided.'}
                          </p>
                        </section>
                        <section>
                          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide text-ink-500">
                            <BookOpen className="size-4" aria-hidden="true" /> Product
                          </h3>
                          <p className="rounded-2xl bg-paper-100/70 p-4 text-sm">
                            <strong>{order.product.name}</strong> · {order.product.contentPages} content pages ·{' '}
                            {order.product.totalPages} physical pages · {PRICE_LABEL}
                          </p>
                        </section>
                      </div>

                      <div className="space-y-4">
                        <section>
                          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide text-ink-500">
                            <Lock className="size-4" aria-hidden="true" /> Child photos for AI Face Swap (private)
                          </h3>
                          <div className="flex flex-wrap gap-4">
                            {order.photos.map((photo, i) => (
                              <div key={i} className="flex flex-col items-center gap-2">
                                <img
                                  src={photo}
                                  alt={`Child photo ${i + 1}`}
                                  className="aspect-[4/5] w-36 rounded-2xl border border-paper-200 object-cover shadow-sm"
                                />
                                <a
                                  href={photo}
                                  download={`${(order.childName || order.customer.name).replace(/\s+/g, '_')}_photo_${i + 1}.png`}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-coral-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm hover:bg-coral-600"
                                  title="Download uncompressed original photo for AI Face Swap"
                                >
                                  <Download className="size-3.5" /> Download Original ({i + 1})
                                </a>
                              </div>
                            ))}
                          </div>
                        </section>
                        <section>
                          <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-ink-500">Order status</h3>
                          <div className="flex flex-wrap gap-2" role="group" aria-label="Change order status">
                            {ORDER_STATUSES.map((s) => (
                              <button
                                key={s.value}
                                type="button"
                                disabled={statusBusy === order.id}
                                onClick={() => void changeStatus(order, s.value)}
                                className={cn(
                                  'rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition-all disabled:opacity-50',
                                  order.status === s.value
                                    ? 'border-coral-500 bg-coral-500 text-white shadow-md'
                                    : 'border-paper-300 bg-white text-ink-700 hover:border-coral-300',
                                )}
                                aria-pressed={order.status === s.value}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </section>
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(order)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" /> Delete order
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete order"
        message={
          deleteTarget
            ? `This permanently deletes order ${deleteTarget.id} including customer details and photos. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-semibold text-ink-500">{k}</dt>
      <dd className="text-right font-bold text-ink-900">{v}</dd>
    </div>
  )
}
