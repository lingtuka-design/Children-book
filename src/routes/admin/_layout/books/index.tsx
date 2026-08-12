import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Eye, Pencil, Plus, Star, StarOff, Trash2, UploadCloud } from 'lucide-react'
import { SpinnerScreen } from '@/components/ui/Spinner'
import { ErrorBanner } from '@/components/ui/Fields'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Modal } from '@/components/ui/Modal'
import { BookReader } from '@/components/reader/BookReader'
import { useAllBooks, useBook, useCover } from '@/services/hooks'
import { usePageMeta } from '@/lib/seo'
import * as bookService from '@/services/books'
import { buildReaderPages } from '@/services/types'
import { formatDate } from '@/lib/utils'
import type { BookSummary } from '@/services/types'

function CoverThumb({ id, title }: { id: string; title: string }) {
  const url = useCover(id)
  return (
    <div className="aspect-[3/4] h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-paper-200 shadow-sm">
      {url && <img src={url} alt={`Cover of ${title}`} className="h-full w-full object-cover" loading="lazy" />}
    </div>
  )
}

export const Route = createFileRoute('/admin/_layout/books/')({ component: AdminBooksRoute })

function AdminBooksRoute() {
  usePageMeta({ title: 'Books' })
  const { data: books, loading, error, reload } = useAllBooks()
  const [previewBook, setPreviewBook] = useState<BookSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BookSummary | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function togglePublish(book: BookSummary) {
    setActionError(null)
    try {
      await bookService.setBookPublished(book.id, !book.published)
      reload()
    } catch {
      setActionError('Could not update publication status')
    }
  }

  async function toggleFeatured(book: BookSummary) {
    setActionError(null)
    try {
      await bookService.setBookFeatured(book.id, !book.featured)
      reload()
    } catch {
      setActionError('Could not update Top Feature status')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)
    try {
      await bookService.deleteBook(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } catch {
      setActionError('Could not delete this book')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-display text-3xl">Books</h1>
          <p className="mt-1 text-ink-500">{books?.length ?? 0} books in the library.</p>
        </div>
        <Link
          to="/admin/books/new"
          className="inline-flex items-center gap-2 rounded-xl bg-coral-500 px-5 py-2.5 font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-coral-600"
        >
          <Plus className="size-5" /> Add New Book
        </Link>
      </div>

      {actionError && <ErrorBanner message={actionError} />}
      {loading && <SpinnerScreen label="Loading books…" />}
      {error && <ErrorBanner message={error} onRetry={reload} />}

      {!loading && !error && books && books.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-paper-300 bg-paper-100/60 px-6 py-16 text-center">
          <UploadCloud className="size-10 text-coral-500" aria-hidden="true" />
          <p className="font-bold text-ink-900">No books yet</p>
          <p className="max-w-sm text-sm text-ink-500">Upload a cover and 24 pages to publish your first book.</p>
          <Link to="/admin/books/new" className="rounded-xl bg-coral-500 px-5 py-2.5 font-bold text-white hover:bg-coral-600">
            Upload your first book
          </Link>
        </div>
      )}

      {!loading && !error && books && books.length > 0 && (
        <div className="overflow-x-auto rounded-3xl border border-paper-200 bg-white shadow-card">
          <table className="w-full min-w-175 text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-left text-xs font-bold uppercase tracking-wide text-ink-500">
                <th className="px-5 py-3.5">Book</th>
                <th className="px-5 py-3.5">Pages</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Featured</th>
                <th className="px-5 py-3.5">Updated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b border-paper-100 last:border-0 hover:bg-paper-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <CoverThumb id={book.id} title={book.title} />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink-900">{book.title}</p>
                        {book.category && <p className="text-xs text-ink-500">{book.category}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={book.pageCount === 24 ? 'font-bold text-leaf-700' : 'font-bold text-red-600'}>
                      {book.pageCount}/24
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => void togglePublish(book)}
                      className="rounded-full px-0 text-left transition-transform hover:scale-105"
                      aria-label={book.published ? 'Unpublish' : 'Publish'}
                      title={book.published ? 'Click to unpublish' : 'Click to publish'}
                    >
                      <Badge tone={book.published ? 'leaf' : 'ink'}>{book.published ? 'Published' : 'Draft'}</Badge>
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => void toggleFeatured(book)}
                      aria-label={book.featured ? 'Remove Top Feature' : 'Mark as Top Feature'}
                      title={book.featured ? 'Remove Top Feature' : 'Mark as Top Feature'}
                      className={
                        book.featured
                          ? 'inline-flex items-center gap-1.5 rounded-full bg-sun-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 transition-transform hover:scale-105'
                          : 'inline-flex items-center gap-1.5 rounded-full bg-paper-100 px-2.5 py-0.5 text-xs font-bold text-ink-500 transition-colors hover:bg-paper-200'
                      }
                    >
                      {book.featured ? <Star className="size-3.5 fill-current" /> : <StarOff className="size-3.5" />}
                      {book.featured ? 'Top Feature' : 'Mark Feature'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-ink-700">{formatDate(book.updatedAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewBook(book)}
                        aria-label={`Preview ${book.title}`}
                        title="Preview"
                        className="grid size-9 place-items-center rounded-xl text-ink-700 hover:bg-paper-100"
                      >
                        <Eye className="size-4.5" />
                      </button>
                      <Link
                        to="/admin/books/$bookId"
                        params={{ bookId: book.id }}
                        aria-label={`Edit ${book.title}`}
                        title="Edit"
                        className="grid size-9 place-items-center rounded-xl text-ink-700 hover:bg-paper-100"
                      >
                        <Pencil className="size-4.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(book)}
                        aria-label={`Delete ${book.title}`}
                        title="Delete"
                        className="grid size-9 place-items-center rounded-xl text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="size-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview modal */}
      <Modal open={previewBook !== null} onClose={() => setPreviewBook(null)} title="Book preview" size="xl">
        {previewBook && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="aspect-[3/4] w-14 overflow-hidden rounded-lg shadow">
                <CoverThumb id={previewBook.id} title={previewBook.title} />
              </div>
              <div>
                <p className="font-bold text-ink-900">{previewBook.title}</p>
                <p className="text-sm text-ink-500">26 pages · page 0 &amp; 25 are blank inside covers</p>
              </div>
            </div>
            <PreviewReader bookId={previewBook.id} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete book"
        message={
          deleteTarget
            ? `This will permanently delete "${deleteTarget.title}" and all of its pages. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function PreviewReader({ bookId }: { bookId: string }) {
  const { data: book, loading } = useBook(bookId)
  if (loading) return <div className="py-10 text-center text-sm text-ink-500">Loading pages…</div>
  if (!book) return <p className="py-10 text-center text-sm text-red-600">Could not load book.</p>
  return <BookReader pages={buildReaderPages(book)} />
}
