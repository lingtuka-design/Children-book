import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  BOOKS_PER_PAGE_HOME,
  HERO_MESSAGE,
  SITE,
} from "@/lib/site";
import { BookGrid } from "@/components/public/BookGrid";
import { Pagination } from "@/components/public/Pagination";
import { HeroScene } from "@/components/public/HeroScene";

export const metadata: Metadata = {
  title: `Personalized Children's Books — ${SITE.name}`,
  description: HERO_MESSAGE,
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [total, books] = await Promise.all([
    prisma.book.count({ where: { published: true } }),
    prisma.book.findMany({
      where: { published: true },
      orderBy: [
        { topFeature: "desc" },
        { featureOrder: "asc" },
        { displayOrder: "desc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * BOOKS_PER_PAGE_HOME,
      take: BOOKS_PER_PAGE_HOME,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        author: true,
        coverThumb: true,
        cover: true,
        pageCount: true,
        topFeature: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / BOOKS_PER_PAGE_HOME));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero — order promotion */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-soft via-paper to-sun-soft px-6 py-10 shadow-card sm:px-10 sm:py-14">
        <HeroScene className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-70 lg:block" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sun/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-ink">
            <Sparkles size={12} strokeWidth={2.5} aria-hidden />
            Personalized picture books
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl md:text-[2.75rem]">
            {HERO_MESSAGE}
          </h1>
          <Link
            href="/order"
            className="group mt-7 inline-flex items-center gap-2 rounded-full bg-coral px-7 py-3.5 text-base font-bold text-white shadow-lift transition-all hover:-translate-y-0.5 hover:bg-coral-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
          >
            Place Order
            <ArrowRight
              size={18}
              strokeWidth={2.5}
              className="transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
          <p className="mt-4 text-sm font-medium text-ink-soft">
            24 pages · 4:3 · Rs. 1,500 — no account needed
          </p>
        </div>
      </section>

      {/* Latest books */}
      <section className="mt-14" aria-labelledby="latest-heading">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2
              id="latest-heading"
              className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
            >
              Latest
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Newly published stories from the studio.
            </p>
          </div>
          <Link
            href="/books"
            className="hidden items-center gap-1 text-sm font-bold text-coral-deep hover:underline sm:inline-flex"
          >
            View all books
            <ArrowRight size={15} strokeWidth={2.5} aria-hidden />
          </Link>
        </div>

        <BookGrid books={books} />

        <div className="mt-10">
          <Pagination basePath="/" currentPage={page} totalPages={totalPages} />
        </div>
      </section>
    </div>
  );
}
