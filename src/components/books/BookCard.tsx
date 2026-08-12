import { Link } from '@tanstack/react-router'
import type { BookSummary } from '@/services/types'
import { FeaturedBadge } from '@/components/ui/Badge'
import { useCover } from '@/services/hooks'
import { Skeleton } from '@/components/ui/Spinner'

function CoverImage({ book, eager }: { book: BookSummary; eager: boolean }) {
  const url = useCover(book.id)
  if (!url) return <Skeleton className="absolute inset-0 rounded-2xl" />
  return (
    <img
      src={url}
      alt={`Cover of ${book.title}`}
      loading={eager ? 'eager' : 'lazy'}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
    />
  )
}

export function BookCard({ book, eager = false }: { book: BookSummary; eager?: boolean }) {
  return (
    <Link
      to="/books/$bookId"
      params={{ bookId: book.id }}
      className="group flex flex-col gap-3 outline-none"
      aria-label={`Read ${book.title}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-paper-200 shadow-card transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lift">
        <CoverImage book={book} eager={eager} />
        {book.featured && (
          <div className="absolute left-3 top-3">
            <FeaturedBadge />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-display text-lg font-semibold leading-snug text-ink-900 group-hover:text-coral-600">
          {book.title}
        </h3>
        {book.category && (
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500">{book.category}</p>
        )}
      </div>
    </Link>
  )
}

export function BookGrid({ books, eager = false }: { books: BookSummary[]; eager?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:gap-7 md:grid-cols-3">
      {books.map((book, i) => (
        <BookCard key={book.id} book={book} eager={eager || i < 2} />
      ))}
    </div>
  )
}
