import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, PartyPopper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS, formatDate, formatPrice } from "@/lib/site";

export const metadata: Metadata = {
  title: "Order Received",
  robots: { index: false },
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  let ref: string | undefined;
  try {
    const params = await searchParams;
    ref = params?.ref;
  } catch {
    ref = undefined;
  }
  if (!ref) notFound();

  const order = await prisma.order.findUnique({
    where: { orderNumber: ref.toUpperCase() },
    select: {
      orderNumber: true,
      customerName: true,
      pageCount: true,
      aspectRatio: true,
      price: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-14 sm:px-6">
      <div className="pop-in rounded-3xl border border-ink/5 bg-paper p-8 text-center shadow-card sm:p-12">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-soft text-teal-deep">
          <CheckCircle2 size={34} strokeWidth={2} aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink">
          Order Received!
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Thank you for ordering a personalized children&apos;s book. Our team
          will start crafting your child&apos;s story very soon.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-ink/10 text-left">
          <div className="flex items-center justify-between bg-cream px-5 py-3.5">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-faint">
              Order number
            </span>
            <span className="font-display text-lg font-semibold tracking-wide text-ink">
              {order.orderNumber}
            </span>
          </div>
          <dl className="divide-y divide-ink/5 px-5 text-sm">
            <div className="flex items-center justify-between py-3">
              <dt className="text-ink-soft">Name</dt>
              <dd className="font-bold text-ink">{order.customerName}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-ink-soft">Product</dt>
              <dd className="font-bold text-ink">
                Custom Children&apos;s Book · {order.pageCount} pages ·{" "}
                {order.aspectRatio}
              </dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-ink-soft">Price</dt>
              <dd className="font-display text-lg font-semibold text-ink">
                {formatPrice(order.price, order.currency)}
              </dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-ink-soft">Submitted</dt>
              <dd className="font-bold text-ink">{formatDate(order.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-ink-soft">Status</dt>
              <dd className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-ink-soft">
          <PartyPopper size={15} strokeWidth={2.2} className="text-sun" aria-hidden />
          We&apos;ll contact you on the phone number you provided once your book
          is ready.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/books"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            Browse more books
            <ArrowRight size={15} strokeWidth={2.5} aria-hidden />
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border-2 border-ink/10 px-6 text-sm font-bold text-ink-soft transition-colors hover:border-ink/25 hover:text-ink"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
