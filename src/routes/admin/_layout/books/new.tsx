import { Link, createFileRoute } from '@tanstack/react-router'
import { BookEditor } from '@/components/admin/BookEditor'
import { usePageMeta } from '@/lib/seo'

export const Route = createFileRoute('/admin/_layout/books/new')({ component: NewBookRoute })

function NewBookRoute() {
  usePageMeta({ title: 'Add New Book' })
  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/books" className="text-sm font-bold text-coral-600 hover:underline">
          ← Back to books
        </Link>
        <h1 className="heading-display mt-1 text-3xl">Add a new book</h1>
        <p className="mt-1 text-ink-500">
          Upload a cover and all 24 pages. Page numbers are detected from file names and sorting happens automatically.
        </p>
      </div>
      <BookEditor />
    </div>
  )
}
