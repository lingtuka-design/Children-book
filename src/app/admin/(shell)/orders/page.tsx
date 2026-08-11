"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, ShoppingBag } from "lucide-react";
import { api, errorMessage } from "@/lib/admin-client";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { formatDate, formatPrice, ORDER_STATUSES } from "@/lib/site";

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  pageCount: number;
  aspectRatio: string;
  price: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const FILTERS = ["ALL", ...ORDER_STATUSES] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: filter, sort });
      if (query.trim()) params.set("q", query.trim());
      const data = await api<{ orders: OrderRow[]; statusCounts: Record<string, number> }>(
        `/api/admin/orders?${params}`
      );
      setOrders(data.orders);
      setStatusCounts(data.statusCounts);
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [filter, sort, query]);

  useEffect(() => {
    const t = setTimeout(load, query ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const total = statusCounts.ALL ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Orders</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          {total} order{total === 1 ? "" : "s"} received from customers.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                filter === f
                  ? "bg-ink text-white"
                  : "bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink"
              }`}
            >
              {f === "ALL" ? "All" : f.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
              <span className="ml-1.5 opacity-60">{statusCounts[f] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, order #, phone…"
              className="w-56 rounded-full border border-ink/10 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-ink placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              aria-label="Search orders"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort orders"
            className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-bold text-ink focus:border-teal focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Customer name</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {!orders ? (
        <div className="flex items-center justify-center py-24 text-ink-faint">
          <Loader2 size={22} className="animate-spin" aria-hidden />
          <span className="ml-2 text-sm font-semibold">Loading orders…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white/60 px-6 py-16 text-center">
          <ShoppingBag size={28} strokeWidth={1.6} className="mx-auto text-ink-faint" aria-hidden />
          <p className="mt-3 text-base font-medium text-ink-soft">
            {query || filter !== "ALL" ? "No orders match this filter." : "No orders yet."}
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            {query || filter !== "ALL"
              ? "Try a different search or status."
              : "When customers place orders, they'll appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/5 bg-white shadow-card">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-widest text-ink-faint">
                <th className="px-4 py-3.5">Order</th>
                <th className="px-3 py-3.5">Customer</th>
                <th className="px-3 py-3.5">Phone</th>
                <th className="px-3 py-3.5">Product</th>
                <th className="px-3 py-3.5">Price</th>
                <th className="px-3 py-3.5">Date</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {orders.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-cream/70">
                  <td className="px-4 py-3 font-bold text-ink">{o.orderNumber}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{o.customerName}</td>
                  <td className="px-3 py-3 text-ink-soft">{o.phone}</td>
                  <td className="px-3 py-3 text-xs font-semibold text-ink-soft">
                    {o.pageCount} pages · {o.aspectRatio}
                  </td>
                  <td className="px-3 py-3 font-bold text-ink">{formatPrice(o.price, o.currency)}</td>
                  <td className="px-3 py-3 text-xs font-semibold text-ink-faint">{formatDate(o.createdAt)}</td>
                  <td className="px-3 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="inline-flex rounded-full bg-ink/5 px-4 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-ink hover:text-white"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
