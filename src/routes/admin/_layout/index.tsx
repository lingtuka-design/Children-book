import { Link, createFileRoute } from '@tanstack/react-router'
import { BookHeart, BookOpen, ClipboardList, Eye, Star } from 'lucide-react'
import { SpinnerScreen } from '@/components/ui/Spinner'
import { ErrorBanner } from '@/components/ui/Fields'
import { Badge } from '@/components/ui/Badge'
import { useAllBooks, useOrders } from '@/services/hooks'
import { usePageMeta } from '@/lib/seo'
import { statusLabel } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

function StatCard({
  icon,
  label,
  value,
  tone,
  to,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  tone: string
  to?: string
}) {
  const inner = (
    <>
      <span className={`grid size-11 place-items-center rounded-2xl ${tone}`}>{icon}</span>
      <div>
        <p className="text-3xl font-extrabold text-ink-900">{value}</p>
        <p className="text-sm font-bold text-ink-500">{label}</p>
      </div>
    </>
  )
  const cls = 'flex items-center gap-4 rounded-3xl border border-paper-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5'
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

export const Route = createFileRoute('/admin/_layout/')({ component: AdminDashboardRoute })

function AdminDashboardRoute() {
  usePageMeta({ title: 'Admin Dashboard' })
  const books = useAllBooks()
  const orders = useOrders()

  if (books.loading || orders.loading) return <SpinnerScreen label="Loading dashboard..." />
  if (books.error || orders.error) {
    return <ErrorBanner message={books.error ?? orders.error ?? 'Failed to load'} onRetry={books.reload} />
  }

  const all = books.data ?? []
  const published = all.filter((b) => b.published)
  const featured = all.filter((b) => b.featured)
  const newOrders = (orders.data ?? []).filter((o) => o.status === 'new')
  const recentOrders = (orders.data ?? []).slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-display text-3xl">Dashboard</h1>
        <p className="mt-1 text-ink-500">Here&rsquo;s what&rsquo;s happening in your studio.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={<BookOpen className="size-5 text-white" />} label="Total Books" value={all.length} tone="bg-coral-500" to="/admin/books" />
        <StatCard icon={<BookHeart className="size-5 text-white" />} label="Published Books" value={published.length} tone="bg-leaf-500" />
        <StatCard icon={<Star className="size-5 text-white" />} label="Top Features" value={featured.length} tone="bg-sun-500" />
        <StatCard icon={<ClipboardList className="size-5 text-white" />} label="New Orders" value={newOrders.length} tone="bg-ink-900" to="/admin/orders" />
      </div>

      <div className="rounded-3xl border border-paper-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm font-bold text-coral-600 hover:underline">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="rounded-xl bg-paper-100 px-4 py-8 text-center text-sm text-ink-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-130 text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-xs font-bold uppercase tracking-wide text-ink-500">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">City</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-paper-100 last:border-0">
                    <td className="py-3 pr-4 font-extrabold text-coral-600">{o.id}</td>
                    <td className="py-3 pr-4 font-bold text-ink-900">{o.customer.name}</td>
                    <td className="py-3 pr-4 text-ink-700">{o.customer.city}</td>
                    <td className="py-3 pr-4 text-ink-700">{formatDate(o.createdAt)}</td>
                    <td className="py-3 text-right">
                      <Badge tone={o.status === 'new' ? 'coral' : o.status === 'completed' ? 'leaf' : o.status === 'cancelled' ? 'red' : 'sun'}>
                        {statusLabel(o.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-dashed border-paper-300 bg-paper-100/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Eye className="size-5 text-coral-500" aria-hidden="true" />
            <p className="text-sm text-ink-700">
              <strong>Tip:</strong> Newly created books appear automatically in the <em>Latest</em> section of the
              homepage. Use <strong>Top Feature</strong> to pin a book to the front of the list.
            </p>
          </div>
          <Link
            to="/admin/books/new"
            className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-bold text-white hover:bg-ink-700"
          >
            + Add new book
          </Link>
        </div>
      </div>
    </div>
  )
}

