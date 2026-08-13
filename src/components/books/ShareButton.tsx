import { useCallback, useRef, useState } from 'react'
import { Check, Share2, X } from 'lucide-react'
import type { Book } from '@/services/types'
import { cn } from '@/lib/utils'

function excerptFor(book: Book): string {
  const base = book.description?.trim() || `Read "${book.title}" — a personalised children's storybook.`
  return base.length > 200 ? base.slice(0, 200).trimEnd() + '…' : base
}

/**
 * Share a book: native share sheet (Web Share API, including the cover image
 * as an attachment where supported) with a clipboard fallback.
 */
export function ShareButton({ book, className }: { book: Book; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')
  const timeoutRef = useRef<number | null>(null)

  const flash = useCallback((next: 'copied' | 'error') => {
    setState(next)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setState('idle'), 2600)
  }, [])

  const share = useCallback(async () => {
    const url = window.location.href
    const title = book.title
    const text = excerptFor(book)

    try {
      if (navigator.share) {
        const data: ShareData = { title, text, url }
        try {
          if (book.ogUrl && navigator.canShare) {
            const res = await fetch(book.ogUrl)
            const blob = await res.blob()
            const file = new File([blob], `${book.id}.png`, { type: 'image/png' })
            if (navigator.canShare({ files: [file] })) data.files = [file]
          }
        } catch {
          // sharing without the image attachment still works
        }
        await navigator.share(data)
        return
      }

      await navigator.clipboard.writeText(url)
      flash('copied')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(url)
        flash('copied')
      } catch {
        flash('error')
      }
    }
  }, [book, flash])

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => void share()}
        aria-label={`Share ${book.title}`}
        title="Share this book"
        className={cn(
          'inline-flex items-center gap-2.5 rounded-2xl border border-paper-300 bg-white px-6 py-3.5 text-lg font-bold text-ink-700 shadow-sm transition-all hover:-translate-y-1 hover:border-coral-300 hover:text-coral-600',
          className,
        )}
      >
        <Share2 className="size-5" /> Share
      </button>

      {state !== 'idle' && (
        <div
          role="status"
          className={cn(
            'absolute -top-12 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-bold text-white shadow-lg',
            state === 'copied' ? 'bg-leaf-700' : 'bg-red-600',
          )}
        >
          {state === 'copied' ? (
            <>
              <Check className="size-4" /> Link copied — share it anywhere
            </>
          ) : (
            <>
              <X className="size-4" /> Could not share — copy the address from the browser
            </>
          )}
        </div>
      )}
    </div>
  )
}
