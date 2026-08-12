import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

function pageList(page: number, pageCount: number): Array<number | '…'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const pages: Array<number | '…'> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < pageCount - 1) pages.push('…')
  pages.push(pageCount)
  return pages
}

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const [animated, setAnimated] = useState(false)
  const go = useCallback(
    (p: number) => {
      if (p < 1 || p > pageCount || p === page) return
      setAnimated(true)
      onChange(p)
    },
    [page, pageCount, onChange],
  )

  useEffect(() => {
    if (!animated) return
    const t = window.setTimeout(() => setAnimated(false), 400)
    return () => window.clearTimeout(t)
  }, [page, animated])

  if (pageCount <= 1) return null

  const btn =
    'grid size-10 place-items-center rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <nav aria-label="Pagination" className="flex justify-center pt-8">
      <div
        className={cn(
          'flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-paper-200 bg-white p-1.5 shadow-sm transition-opacity',
          animated && 'opacity-0',
        )}
      >
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className={cn(btn, 'text-ink-700 hover:bg-paper-100')}
        >
          <ChevronLeft className="size-5" />
        </button>

        {pageList(page, pageCount).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-ink-500" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => go(p)}
              className={cn(
                btn,
                p === page
                  ? 'bg-coral-500 text-white shadow-md'
                  : 'text-ink-700 hover:bg-paper-100',
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => go(page + 1)}
          className={cn(btn, 'text-ink-700 hover:bg-paper-100')}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </nav>
  )
}
