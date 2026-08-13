import { useState } from 'react'
import { Link, useParams, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, CalendarDays, UserRound, Wand2 } from 'lucide-react'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { ReadOverlay } from '@/components/reader/ReadOverlay'
import { ShareButton } from '@/components/books/ShareButton'
import { SpinnerScreen } from '@/components/ui/Spinner'
import { ErrorBanner } from '@/components/ui/Fields'
import { Badge, FeaturedBadge } from '@/components/ui/Badge'
import { useBook } from '@/services/hooks'
import { usePageMeta } from '@/lib/seo'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/books/$bookId')({ component: BookDetailRoute })

function BookDetailRoute() {
  const { bookId } = useParams({ from: '/books/$bookId' })
  const { data: book, loading, error, reload } = useBook(bookId)
  const [reading, setReading] = useState(false)

  usePageMeta({
    title: book?.title ?? 'Book',
    description: book?.description,
    ogImage:
      book?.ogUrl && typeof window !== 'undefined'
        ? new URL(book.ogUrl, window.location.origin).href
        : undefined,
    ogImageWidth: 1080,
    ogImageHeight: 1440,
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

  return (
    <PublicLayout>
      <section className="container-site py-10">
        <Link to="/books" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-coral-600">
          <ArrowLeft className="size-4" /> All books
        </Link>

        {/* Book header: cover + actions */}
        <div className="mt-8 grid items-center gap-12 lg:grid-cols-[340px_1fr]">
          <div className="relative mx-auto w-full max-w-72 lg:max-w-none">
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-paper-200 shadow-book">
              <img src={book.cover.url} alt={`Cover of ${book.title}`} className="h-full w-full object-cover" />
            </div>
            <span className="absolute -right-4 -top-3 rounded-full bg-sun-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-md">
              24 illustrated pages
            </span>
          </div>

          <div className="text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <h1 className="heading-display w-full text-4xl sm:text-5xl">{book.title}</h1>
              {book.featured && <FeaturedBadge />}
              {book.category && <Badge tone="leaf">{book.category}</Badge>}
            </div>
            {book.description && (
              <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-500 lg:mx-0">{book.description}</p>
            )}
            <dl className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-ink-700 lg:justify-start">
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
            </dl>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <button
                type="button"
                onClick={() => setReading(true)}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-coral-500 px-8 py-3.5 text-lg font-extrabold text-white shadow-[0_16px_36px_-12px_rgba(197,84,47,0.7)] transition-all hover:-translate-y-1 hover:bg-coral-600"
              >
                <BookOpen className="size-5" /> Read
              </button>
              <Link
                to="/order"
                className="inline-flex items-center gap-2.5 rounded-2xl bg-ink-900 px-8 py-3.5 text-lg font-bold text-paper-50 shadow-md transition-all hover:-translate-y-1 hover:bg-ink-700"
              >
                <Wand2 className="size-5" /> Make one like this
              </Link>
              <ShareButton book={book} />
            </div>
            <p className="mt-5 text-sm text-ink-500">
              26 pages — page 0 and 25 are the blank inside covers, just like the real book.
            </p>
          </div>
        </div>
      </section>

      {reading && <ReadOverlay book={book} onClose={() => setReading(false)} />}
    </PublicLayout>
  )
}
