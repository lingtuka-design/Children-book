import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { BookGrid } from '@/components/books/BookCard'
import { Pagination } from '@/components/books/Pagination'
import { CardSkeletonGrid } from '@/components/ui/Spinner'
import { ErrorBanner } from '@/components/ui/Fields'
import { useBooks } from '@/services/hooks'
import { usePageMeta } from '@/lib/seo'
import { PAGE_SIZE } from '@/lib/constants'

export const Route = createFileRoute('/books/')({ component: BooksRoute })

function BooksRoute() {
  usePageMeta({
    title: 'All Books',
    description: 'Browse the complete children\u2019s book library — read every story in the interactive reader.',
  })
  const { data: books, loading, error, reload } = useBooks()
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil((books?.length ?? 0) / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visible = books?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) ?? []

  return (
    <PublicLayout>
      <section className="container-site py-12">
        <header className="mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-coral-500">The library</p>
          <h1 className="heading-display mt-2 text-4xl">All Children&rsquo;s Books</h1>
          <p className="mt-2 max-w-xl text-ink-500">
            Every story in our collection — open one and it springs to life with page-turning magic.
          </p>
        </header>

        {loading && <CardSkeletonGrid />}
        {error && <ErrorBanner message={error} onRetry={reload} />}
        {!loading && !error && books && books.length === 0 && (
          <p className="rounded-2xl bg-paper-100 px-6 py-12 text-center text-ink-500">
            Books are being illustrated — check back soon!
          </p>
        )}
        {visible.length > 0 && (
          <>
            <BookGrid books={visible} />
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </section>
    </PublicLayout>
  )
}
