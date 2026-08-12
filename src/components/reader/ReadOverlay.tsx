import { useEffect, useMemo } from 'react'
import { BookOpen, X } from 'lucide-react'
import type { Book } from '@/services/types'
import { buildReaderPages } from '@/services/types'
import { BookReader } from './BookReader'

interface ReadOverlayProps {
  book: Book
  onClose: () => void
}

/**
 * Immersive, near-fullscreen reading mode. Desktop shows the realistic
 * page-flip; mobile shows single pages with labelled Previous/Next buttons.
 */
export function ReadOverlay({ book, onClose }: ReadOverlayProps) {
  const pages = useMemo(() => buildReaderPages(book), [book])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink-900"
      role="dialog"
      aria-modal="true"
      aria-label={`Reading ${book.title}`}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-coral-500 text-white">
            <BookOpen className="size-4.5" />
          </span>
          <p className="truncate font-display text-base font-semibold text-paper-50 sm:text-lg">{book.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close reader"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-paper-50 transition-colors hover:bg-white/20"
        >
          <X className="size-4.5" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </div>
      <div className="min-h-0 flex-1 px-3 pb-5 sm:px-10">
        <BookReader pages={pages} variant="immersive" />
      </div>
    </div>
  )
}
