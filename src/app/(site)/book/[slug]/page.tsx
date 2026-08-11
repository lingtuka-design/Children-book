import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PenLine } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SITE, formatPrice } from "@/lib/site";
import { BookReader } from "@/components/public/BookReader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      cover: true,
      author: true,
      published: true,
    },
  });
  if (!book || !book.published) return { title: "Book not found" };

  const description = book.description ?? `Read "${book.title}" online.`;
  return {
    title: book.title,
    description,
    openGraph: {
      type: "book",
      title: book.title,
      description,
      images: book.cover ? [{ url: book.cover }] : undefined,
    },
  };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug },
    include: {
      pages: { orderBy: { pageNumber: "asc" } },
    },
  });

  if (!book || !book.published) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-faint">
        <Link href="/" className="font-medium hover:text-coral-deep">
          Home
        </Link>
        <ChevronRight size={14} aria-hidden />
        <Link href="/books" className="font-medium hover:text-coral-deep">
          Books
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span className="truncate font-medium text-ink-soft">{book.title}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-14">
        {/* Cover */}
        <div className="mx-auto w-full max-w-sm">
          <div className="relative overflow-hidden rounded-2xl shadow-lift">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={book.cover}
              alt={`Cover of ${book.title}`}
              className="aspect-[3/4] w-full object-cover"
            />
            {book.topFeature && (
              <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-sun px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink shadow-soft">
                Top Feature
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            {book.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-ink-soft">
            {book.author && <span>by {book.author}</span>}
            {book.illustrator && <span>· Illustrated by {book.illustrator}</span>}
            {book.year && <span>· {book.year}</span>}
          </div>

          {book.description && (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
              {book.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-cream-deep px-3.5 py-1.5 text-xs font-bold text-ink">
              {book.pageCount} pages
            </span>
            {book.tags?.split(",").map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-lilac-soft px-3.5 py-1.5 text-xs font-semibold text-lilac"
              >
                {tag.trim()}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BookReader
              title={book.title}
              cover={book.cover}
              pages={book.pages.map((p) => ({
                src: p.image,
                thumb: p.thumb ?? p.image,
              }))}
              trigger={
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-8 text-base font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  Read Book
                </button>
              }
            />
            <Link
              href="/order"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-coral px-8 text-base font-bold text-coral-deep transition-all hover:-translate-y-0.5 hover:bg-coral-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
            >
              <PenLine size={17} strokeWidth={2.4} aria-hidden />
              Order a Book Like This
            </Link>
          </div>

          <p className="mt-8 max-w-md rounded-2xl bg-teal-soft px-5 py-4 text-sm leading-relaxed text-teal-deep">
            Loved this story? Order a personalized book starring your own
            child — {formatPrice(1500)} for a 24-page, 4:3 custom picture book.
          </p>
        </div>
      </div>

      <p className="mt-14 text-center text-sm text-ink-faint">
        {SITE.name} · {SITE.tagline}
      </p>
    </div>
  );
}
