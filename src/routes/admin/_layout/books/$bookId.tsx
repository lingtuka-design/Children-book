import { Link, useParams, createFileRoute } from '@tanstack/react-router'
import { BookEditor } from '@/components/admin/BookEditor'
import { SpinnerScreen } from '@/components/ui/Spinner'
import { useBook } from '@/services/hooks'
import { usePageMeta } from '@/lib/seo'

export const Route = createFileRoute('/admin/_layout/books/$bookId')({ component: EditBookRoute })

function EditBookRoute() {
  const { bookId } = useParams({ from: '/admin/_layout/books/$bookId' })
  const { data: book, loading } = useBook(bookId)
  usePageMeta({ title: book ? `Edit ${book.title}` : 'Edit Book' })

  if (loading) return <SpinnerScreen label="Loading book…" />

  if (!book) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl bg-red-50 px-5 py-4 font-semibold text-red-700">This book no longer exists.</p>
        <Link to="/admin/books" className="inline-block font-bold text-coral-600 hover:underline">
          ← Back to books
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/books" className="text-sm font-bold text-coral-600 hover:underline">
          ← Back to books
        </Link>
        <h1 className="heading-display mt-1 text-3xl">Edit: {book.title}</h1>
        <p className="mt-1 text-ink-500">
          Replace pages, swap the cover, change the story details, then publish.
        </p>
      </div>
      <BookEditor initialBook={book} />
    </div>
  )
}
