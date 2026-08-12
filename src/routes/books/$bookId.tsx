import { Link, useParams, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, BookOpenText, CalendarDays, UserRound } from 'lucide-react'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { BookReader } from '@/components/reader/BookReader'
import { SpinnerScreen } from '@/components/ui/Spinner'
import { ErrorBanner } from '@/components/ui/Fields'
import { Badge, FeaturedBadge } from '@/components/ui/Badge'
import { useBook } from '@/services/hooks'
import { usePageMeta } from '@/lib/seo'
import { buildReaderPages } from '@/services/types'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/books/$bookId')({ component: BookDetailRoute })

function BookDetailRoute() {
  const { bookId } = useParams({ from: '/books/$bookId' })
  const { data: book, loading, error, reload } = useBook(bookId)

  usePageMeta({
    title: book?.title ?? 'Book',
    description: book?.description,
  })

  if (loading) {
    return (
      <PublicLayout>
        <SpinnerScreen label="Opening the book…" />
      </PublicLayout>
    )
  }

  if (error || !book) {
    return (
      <PublicLayout>
        <div className="container-site py-16">
          <div className="mx-auto max-w-lg">
            <ErrorBanner
              message={error ?? 'We couldn\u2019t find that book. It may have been removed.'}
              onRetry={reload}
            />
            <Link to="/books" className="mt-6 inline-flex items-center gap-1.5 font-bold text-coral-600 hover:underline">
              <ArrowLeft className="size-4" /> Back to the library
            </Link>
          </div>
        </div>
      </PublicLayout>
    )
  }

  const readerPages = buildReaderPages(book)

  return (
    <PublicLayout>
      <section className="container-site py-10">
        <Link to="/books" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-coral-600">
          <ArrowLeft className="size-4" /> All books
        </Link>

        {/* Book header */}
        <div className="mt-6 grid items-start gap-10 lg:grid-cols-[280px_1fr]">
          <div className="mx-auto w-full max-w-72">
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-paper-200 shadow-book">
              <img src={book.cover.url} alt={`Cover of ${book.title}`} className="h-full w-full object-cover" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="heading-display w-full text-4xl">{book.title}</h1>
              {book.featured && <FeaturedBadge />}
              {book.category && <Badge tone="leaf">{book.category}</Badge>}
            </div>
            {book.description && <p className="mt-4 max-w-2xl text-lg text-ink-500">{book.description}</p>}
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-700">
              {book.author && (
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 text-coral-500" aria-hidden="true" />
                  <span className="font-bold">{book.author}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-coral-500" aria-hidden="true" />
                <span className="font-bold">{formatDate(book.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpenText className="size-4 text-coral-500" aria-hidden="true" />
                <span className="font-bold">26 pages · 24 illustrated</span>
              </div>
            </dl>
            <div className="mt-8">
              <Link
                to="/order"
                className="inline-flex items-center gap-2 rounded-2xl bg-ink-900 px-6 py-3 font-bold text-paper-50 shadow-md transition-all hover:-translate-y-0.5 hover:bg-ink-700"
              >
                Make one like this <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Reader */}
        <div id="reader" className="mt-14 scroll-mt-24">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="heading-display text-2xl">Read the book</h2>
            <p className="hidden text-sm text-ink-500 sm:block">First page is the inside cover — just like the real thing.</p>
          </div>
          <BookReader pages={readerPages} />
        </div>
      </section>
    </PublicLayout>
  )
}
