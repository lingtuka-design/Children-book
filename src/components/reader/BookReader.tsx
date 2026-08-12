import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import type { ReaderPage } from '@/services/types'
import { cn } from '@/lib/utils'

const TURN_MS = 900
const SWIPE_THRESHOLD = 60

interface BookReaderProps {
  pages: ReaderPage[]
  className?: string
}

type FlipState = { dir: 1 | -1 } | null

function PageFace({
  page,
  dark = false,
  side,
}: {
  page: ReaderPage
  dark?: boolean
  side: 'left' | 'right' | 'single'
}) {
  const corner =
    side === 'left' ? 'rounded-l-md' : side === 'right' ? 'rounded-r-md' : 'rounded-md'
  if (page.blank) {
    return (
      <div
        className={cn('paper-blank relative h-full w-full overflow-hidden', corner, dark && 'brightness-90')}
        aria-hidden="true"
      />
    )
  }
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-white', corner, dark && 'brightness-90')}>
      <img
        src={page.url}
        alt={`Book page ${page.index + 1}`}
        draggable={false}
        className="h-full w-full select-none object-contain"
      />
    </div>
  )
}

export function BookReader({ pages, className }: BookReaderProps) {
  const total = pages.length
  const frameRef = useRef<HTMLDivElement>(null)
  const [spread, setSpread] = useState(false)
  const [pos, setPos] = useState(0)
  const [flip, setFlip] = useState<FlipState>(null)
  const [busy, setBusy] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const dragRef = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  const viewCount = spread ? 2 : 1
  const maxPos = total - viewCount
  const canPrev = pos > 0
  const canNext = pos < maxPos

  /* Spread/single mode */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 760px)')
    const update = () => setSpread(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  /* Keep pos valid when mode changes */
  useEffect(() => {
    if (spread && pos % 2 !== 0) setPos(pos - 1)
    if (!spread && pos > maxPos) setPos(maxPos)
  }, [spread, pos, maxPos])

  const turn = useCallback(
    (dir: 1 | -1) => {
      if (busy) return
      const to = pos + dir * viewCount
      if (to < 0 || to > maxPos) return
      setFlip({ dir })
      setBusy(true)
      window.setTimeout(() => {
        setPos(to)
        setFlip(null)
        setBusy(false)
      }, TURN_MS)
    },
    [busy, pos, viewCount, maxPos],
  )

  const jump = useCallback(
    (to: number) => {
      if (busy) return
      const clamped = Math.max(0, Math.min(to, maxPos))
      setPos(clamped)
    },
    [busy, maxPos],
  )

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        turn(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        turn(-1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        jump(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        jump(maxPos)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [turn, jump, maxPos])

  /* Fullscreen */
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void frameRef.current?.requestFullscreen()
    }
  }, [])

  const underIndex = useMemo(() => {
    if (!flip) return -1
    if (flip.dir === 1) return pos + viewCount
    return spread ? pos - 2 : pos - 1
  }, [flip, pos, viewCount, spread])

  const flipFront = useMemo(() => {
    if (!flip) return -1
    if (flip.dir === 1) return spread ? pos + 1 : pos
    return pos
  }, [flip, spread, pos])

  const flipBack = useMemo(() => {
    if (!flip) return -1
    if (flip.dir === 1) return pos + viewCount
    return spread ? pos - 1 : pos - 1
  }, [flip, spread, pos, viewCount])

  const pointerHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      dragRef.current = { x: e.clientX, y: e.clientY, moved: false }
    },
    onPointerUp: (e: React.PointerEvent) => {
      const start = dragRef.current
      dragRef.current = null
      if (!start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) turn(1)
        else turn(-1)
      } else if (Math.abs(dx) + Math.abs(dy) < 8) {
        const rect = e.currentTarget.getBoundingClientRect()
        const leftHalf = e.clientX < rect.left + rect.width / 2
        if (leftHalf) turn(-1)
        else turn(1)
      }
    },
  }

  const label = spread ? `Pages ${pos + 1}–${pos + 2} of ${total}` : `Page ${pos + 1} of ${total}`
  const progress = ((pos + viewCount) / total) * 100

  const ctrlBtn =
    'grid size-10 place-items-center rounded-xl text-ink-700 transition-colors hover:bg-paper-100 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent'

  return (
    <div ref={frameRef} className={cn('flex flex-col gap-4', fullscreen && 'p-6 md:p-10', className)}>
      <div className="book-3d mx-auto w-full max-w-4xl">
        <div
          className={cn(
            'relative w-full touch-pan-y select-none overflow-hidden rounded-lg bg-paper-200 shadow-book ring-1 ring-ink-900/10',
            spread ? 'aspect-[8/3]' : 'aspect-[4/3] max-w-2xl',
          )}
          style={{ cursor: 'pointer' }}
          aria-label="Book reader — swipe or use the buttons to turn pages"
          {...pointerHandlers}
        >
          {/* left static page (spread only) */}
          {spread && !(flip && flip.dir === -1) && (
            <div className="absolute inset-y-0 left-0 z-10 w-1/2">
              <PageFace page={pages[pos]} side="left" />
            </div>
          )}

          {/* right static page (spread only) */}
          {spread && !flip && (
            <div className="absolute inset-y-0 right-0 w-1/2">
              <PageFace page={pages[pos + 1]} side="right" />
            </div>
          )}

          {/* single-mode static page (the full page) */}
          {!spread && !flip && (
            <div className="absolute inset-y-0 left-0 w-full">
              <PageFace page={pages[pos]} side="single" />
            </div>
          )}

          {/* spine shadow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-px -translate-x-1/2"
            style={{
              background:
                'linear-gradient(to right, transparent 0%, rgb(74 63 51 / 0.35) 25%, rgb(74 63 51 / 0.5) 50%, rgb(74 63 51 / 0.35) 75%, transparent 100%)',
            }}
          />

          {/* under page visible through the turning gap */}
          {flip && underIndex >= 0 && underIndex < total && (
            <div
              className={cn(
                'absolute inset-y-0 z-0',
                flip.dir === 1 ? (spread ? 'right-0 w-1/2' : 'left-0 w-full') : spread ? 'left-0 w-1/2' : 'left-0 w-full',
              )}
            >
              <PageFace page={pages[underIndex]} dark side="single" />
            </div>
          )}

          {/* flipping page */}
          {flip && flipFront >= 0 && flipBack >= 0 && (
            <div
              className={cn(
                'absolute inset-y-0 z-30',
                spread ? 'w-1/2' : 'w-full',
                flip.dir === 1 ? 'left-1/2 origin-left' : spread ? 'left-0 origin-right' : 'left-0 origin-left',
              )}
            >
              <div
                className={cn(
                  'relative h-full w-full',
                  flip.dir === 1 ? 'flip-anim-fwd' : 'flip-anim-back',
                )}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="flip-face absolute inset-0">
                  <PageFace page={pages[flipFront]} side={flip.dir === 1 ? (spread ? 'right' : 'single') : spread ? 'left' : 'single'} />
                </div>
                <div className="flip-back flip-face absolute inset-0">
                  <PageFace page={pages[flipBack]} side={flip.dir === 1 ? (spread ? 'left' : 'single') : spread ? 'right' : 'single'} />
                </div>
              </div>
            </div>
          )}

          {/* subtle vignette */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-lg"
            style={{ boxShadow: 'inset 0 0 60px rgb(46 40 32 / 0.14)' }}
          />
        </div>
      </div>

      {/* controls */}
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center gap-1">
        <button type="button" className={ctrlBtn} aria-label="First page" disabled={!canPrev} onClick={() => jump(0)}>
          <SkipBack className="size-5" />
        </button>
        <button type="button" className={ctrlBtn} aria-label="Previous page" disabled={!canPrev} onClick={() => turn(-1)}>
          <ChevronLeft className="size-6" />
        </button>

        <div className="flex flex-1 flex-col items-center gap-1 px-2" aria-live="polite">
          <span className="text-sm font-extrabold text-ink-900">{label}</span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-paper-200" aria-hidden="true">
            <div
              className="h-full rounded-full bg-coral-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button type="button" className={ctrlBtn} aria-label="Next page" disabled={!canNext} onClick={() => turn(1)}>
          <ChevronRight className="size-6" />
        </button>
        <button type="button" className={ctrlBtn} aria-label="Last page" disabled={!canNext} onClick={() => jump(maxPos)}>
          <SkipForward className="size-5" />
        </button>

        <div className="mx-1 h-8 w-px bg-paper-200" aria-hidden="true" />
        <button
          type="button"
          className={ctrlBtn}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          onClick={toggleFullscreen}
        >
          {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
        </button>
      </div>

      <p className="text-center text-xs font-semibold text-ink-500" aria-hidden="true">
        <span className="hidden sm:inline">Use arrow keys · </span>
        <RotateCw className="mr-0.5 inline size-3.5" />
        <RotateCcw className="mr-0.5 inline size-3.5" />
        Swipe to turn pages
      </p>
    </div>
  )
}
