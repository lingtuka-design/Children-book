import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BOOKS_PER_PAGE_ALL, SITE } from "@/lib/site";
import { BookGrid } from "@/components/public/BookGrid";
import { Pagination } from "@/components/public/Pagination";

export const metadata: Metadata = {
  title: "All Books",
  description: `Browse the full ${SITE.name} children's book collection and read every story online.`,
};

export default async function BooksPage({
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
      skip: (page - 1) * BOOKS_PER_PAGE_ALL,
      take: BOOKS_PER_PAGE_ALL,
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

  const totalPages = Math.max(1, Math.ceil(total / BOOKS_PER_PAGE_ALL));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        All Books
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
        Every story in the studio collection. Open a cover to read the book in
        our interactive flipbook.
      </p>

      <div className="mt-8">
        <BookGrid books={books} />
      </div>

      <div className="mt-10">
        <Pagination
          basePath="/books"
          currentPage={page}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
