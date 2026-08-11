"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpenText,
  Clock3,
  Loader2,
  PackageOpen,
  ShoppingBag,
  Sparkles,
  Upload,
} from "lucide-react";
import { api } from "@/lib/admin-client";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { formatDate, formatPrice } from "@/lib/site";

interface DashboardData {
  stats: {
    totalBooks: number;
    publishedBooks: number;
    topFeatures: number;
    totalOrders: number;
    newOrders: number;
    inProgress: number;
    awaiting: number;
    completed: number;
    cancelled: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    price: number;
    currency: string;
    createdAt: string;
  }[];
  recentBooks: {
    id: string;
    title: string;
    slug: string;
    coverThumb: string | null;
    pageCount: number;
    published: boolean;
    topFeature: boolean;
    createdAt: string;
  }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DashboardData>("/api/admin/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-faint">
        <Loader2 size={22} className="animate-spin" aria-hidden />
        <span className="ml-2 text-sm font-semibold">Loading dashboard…</span>
      </div>
    );
  }

  const s = data.stats;
  const cards = [
    { label: "Total Books", value: s.totalBooks, icon: BookOpenText, tint: "bg-teal-soft text-teal-deep" },
    { label: "Published", value: s.publishedBooks, icon: Sparkles, tint: "bg-sun-soft text-amber-700" },
    { label: "Top Features", value: s.topFeatures, icon: PackageOpen, tint: "bg-lilac-soft text-lilac" },
    { label: "Total Orders", value: s.totalOrders, icon: ShoppingBag, tint: "bg-coral-soft text-coral-deep" },
    { label: "New Orders", value: s.newOrders, icon: Clock3, tint: "bg-sky-100 text-sky-700" },
    { label: "In Progress", value: s.inProgress, icon: Clock3, tint: "bg-amber-100 text-amber-700" },
    { label: "Completed", value: s.completed, icon: Sparkles, tint: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            A quick look at your books, features, and customer orders.
          </p>
        </div>
        <Link
          href="/admin/books/upload"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-coral-deep"
        >
          <Upload size={15} strokeWidth={2.4} aria-hidden />
          Upload New Book
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-ink/5 bg-white p-4 shadow-card"
          >
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${c.tint}`}>
              <c.icon size={16} strokeWidth={2.2} aria-hidden />
            </span>
            <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-ink">
              {c.value}
            </p>
            <p className="text-xs font-bold text-ink-faint">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent orders */}
        <section className="rounded-2xl border border-ink/5 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-coral-deep hover:underline">
              View all
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="mt-6 text-sm text-ink-faint">No orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/5">
              {data.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-cream"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{o.customerName}</p>
                      <p className="text-xs font-semibold text-ink-faint">
                        {o.orderNumber} · {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-bold text-ink">
                        {formatPrice(o.price, o.currency)}
                      </span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recently uploaded books */}
        <section className="rounded-2xl border border-ink/5 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">
              Recently Uploaded Books
            </h2>
            <Link href="/admin/books" className="text-xs font-bold text-coral-deep hover:underline">
              Manage books
            </Link>
          </div>
          {data.recentBooks.length === 0 ? (
            <p className="mt-6 text-sm text-ink-faint">No books uploaded yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/5">
              {data.recentBooks.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/books/${b.id}/edit`}
                    className="flex items-center gap-3 py-3 transition-colors hover:bg-cream"
                  >
                    <span className="h-12 w-9 shrink-0 overflow-hidden rounded-md bg-cream-deep">
                      {b.coverThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.coverThumb} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{b.title}</p>
                      <p className="text-xs font-semibold text-ink-faint">
                        {b.pageCount} pages · {formatDate(b.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {b.topFeature && (
                        <span className="rounded-full bg-sun-soft px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          Top Feature
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          b.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {b.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
