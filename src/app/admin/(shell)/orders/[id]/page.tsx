"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  Eye,
  Loader2,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { api, errorMessage } from "@/lib/admin-client";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { formatDateTime, formatPrice, ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/site";

interface OrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  phone: string;
  childPhoto1: string;
  childPhoto2: string;
  story: string;
  pageCount: number;
  aspectRatio: string;
  price: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  product: { name: string } | null;
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const photoUrl = (n: 1 | 2) => `/api/admin/orders/${id}/photo/${n}`;

  useEffect(() => {
    api<{ order: OrderDetail }>(`/api/admin/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  const changeStatus = async (status: string) => {
    if (!order || status === order.status) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setOrder({ ...order, status });
      setNotice(`Order status updated to "${ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status}".`);
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (error && !order) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-faint">
        <Loader2 size={22} className="animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-ink-faint hover:text-ink"
        >
          <ArrowLeft size={13} strokeWidth={2.5} aria-hidden />
          Back to orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{order.orderNumber}</h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              Placed {formatDateTime(order.createdAt)} · Updated {formatDateTime(order.updatedAt)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer */}
        <section className="rounded-2xl border border-ink/5 bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-semibold text-ink">Customer Details</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <User size={16} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden />
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-ink-faint">Name</dt>
                <dd className="font-semibold text-ink">{order.customerName}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden />
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-ink-faint">Address</dt>
                <dd className="whitespace-pre-line leading-relaxed text-ink">{order.address}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={16} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden />
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-ink-faint">Phone</dt>
                <dd className="font-semibold text-ink">{order.phone}</dd>
              </div>
            </div>
          </dl>
        </section>

        {/* Product + order info */}
        <section className="rounded-2xl border border-ink/5 bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-semibold text-ink">Product</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Product</dt>
              <dd className="font-bold text-ink">{order.product?.name ?? "Custom Children's Book"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Pages</dt>
              <dd className="font-bold text-ink">{order.pageCount}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Aspect ratio</dt>
              <dd className="font-bold text-ink">{order.aspectRatio}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Price</dt>
              <dd className="font-display text-xl font-semibold text-ink">
                {formatPrice(order.price, order.currency)}
              </dd>
            </div>
          </dl>

          <h2 className="mt-6 font-display text-base font-semibold text-ink">Order Information</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Order ID</dt>
              <dd className="font-mono text-xs font-semibold text-ink">{order.id}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Created</dt>
              <dd className="font-semibold text-ink">{formatDateTime(order.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Updated</dt>
              <dd className="font-semibold text-ink">{formatDateTime(order.updatedAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-soft">Status</dt>
              <dd className="font-semibold text-ink">{ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Photos */}
      <section className="rounded-2xl border border-ink/5 bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-semibold text-ink">Children&apos;s Photos</h2>
        <p className="mt-0.5 text-xs text-ink-faint">
          Private uploads — only visible to administrators.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="overflow-hidden rounded-2xl border border-ink/10">
              <div className="relative aspect-[4/3] bg-cream-deep">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl(n as 1 | 2)}
                  alt={`Child photo ${n}`}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  Photo {n}
                </span>
              </div>
              <div className="flex gap-2 border-t border-ink/10 p-2.5">
                <a
                  href={photoUrl(n as 1 | 2)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink/5 px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-ink/10"
                >
                  <Eye size={13} strokeWidth={2.4} aria-hidden />
                  Open
                </a>
                <a
                  href={`${photoUrl(n as 1 | 2)}?download=1`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-soft px-3 py-2 text-xs font-bold text-teal-deep transition-colors hover:bg-teal-soft/70"
                >
                  <Download size={13} strokeWidth={2.4} aria-hidden />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="rounded-2xl border border-ink/5 bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-semibold text-ink">Story</h2>
        {order.story ? (
          <p className="mt-3 whitespace-pre-line rounded-xl bg-cream px-5 py-4 text-sm leading-relaxed text-ink">
            {order.story}
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-faint">
            The customer didn&apos;t include a story description.
          </p>
        )}
      </section>

      {/* Status control */}
      <section className="rounded-2xl border border-ink/5 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Change Status</h2>
            <p className="mt-0.5 text-xs text-ink-faint">
              Move this order through your workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy || s === order.status}
                onClick={() => changeStatus(s)}
                aria-pressed={s === order.status}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                  s === order.status
                    ? "bg-ink text-white"
                    : "bg-ink/5 text-ink-soft hover:bg-ink/10 hover:text-ink"
                }`}
              >
                {ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
