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

const TURN_MS = 750
const SWIPE_THRESHOLD = 60

interface BookReaderProps {
  pages: ReaderPage[]
  className?: string
  /** 'immersive' fills the viewport (used by the Read overlay). */
  variant?: 'embedded' | 'immersive'
}

type FlipState = { dir: 1 | -1 } | null

function PageFace({
  page,
  side,
  dark = false,
}: {
  page?: ReaderPage
  side: 'left' | 'right' | 'single'
  dark?: boolean
}) {
  if (!page || page.blank) {
    return (
      <div
        className={cn(
          'paper-blank relative h-full w-full overflow-hidden shadow-sm',
          side === 'left' && 'rounded-l-lg border-r border-paper-300/40',
          side === 'right' && 'rounded-r-lg border-l border-paper-300/40',
          side === 'single' && 'rounded-lg border border-paper-300/40',
          dark && 'brightness-90',
        )}
        aria-hidden="true"
      >
        {/* Subtle page spine fold shadow */}
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 w-8',
            side === 'left' && 'right-0 bg-gradient-to-l from-black/10 to-transparent',
            side === 'right' && 'left-0 bg-gradient-to-r from-black/10 to-transparent',
          )}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden bg-white shadow-sm',
        side === 'left' && 'rounded-l-lg border-r border-paper-300/30',
        side === 'right' && 'rounded-r-lg border-l border-paper-300/30',
        side === 'single' && 'rounded-lg border border-paper-300/30',
        dark && 'brightness-90',
      )}
    >
      <img
        src={page.url}
        alt={`Book page ${page.index + 1}`}
        draggable={false}
        className="h-full w-full select-none object-contain"
      />
      {/* Inner spine shadow on paper edge */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 w-10',
          side === 'left' && 'right-0 bg-gradient-to-l from-black/12 to-transparent',
          side === 'right' && 'left-0 bg-gradient-to-r from-black/12 to-transparent',
        )}
      />
    </div>
  )
}

export function BookReader({ pages, className, variant = 'embedded' }: BookReaderProps) {
  const total = pages.length
  const immersive = variant === 'immersive'
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

  /* Responsive Spread/single mode */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setSpread(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  /* Keep pos valid & aligned when mode changes */
  useEffect(() => {
    if (spread && pos % 2 !== 0) setPos(Math.max(0, pos - 1))
    if (!spread && pos > maxPos) setPos(maxPos)
  }, [spread, pos, maxPos])

  const turn = useCallback(
    (dir: 1 | -1) => {
      if (busy) return
      const step = spread ? 2 : 1
      const to = pos + dir * step
      if (to < 0 || to > maxPos) return
      setFlip({ dir })
      setBusy(true)
      window.setTimeout(() => {
        setPos(to)
        setFlip(null)
        setBusy(false)
      }, TURN_MS)
    },
    [busy, pos, spread, maxPos],
  )

  const jump = useCallback(
    (to: number) => {
      if (busy) return
      let target = Math.max(0, Math.min(to, maxPos))
      if (spread && target % 2 !== 0) target = Math.max(0, target - 1)
      setPos(target)
    },
    [busy, spread, maxPos],
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

  /* Page Index calculations during 3D flip */
  const flipPages = useMemo(() => {
    if (!flip) return null

    if (spread) {
      if (flip.dir === 1) {
        // Next: Right page (pos+1) turns over to become Left page (pos+2)
        return {
          underLeft: pages[pos],
          underRight: pages[pos + 3],
          front: pages[pos + 1], // Right side facing 0deg
          back: pages[pos + 2],  // Left side facing -180deg
          frontSide: 'right' as const,
          backSide: 'left' as const,
        }
      } else {
        // Previous: Left page (pos) turns back to become Right page (pos-1)
        return {
          underLeft: pages[pos - 2],
          underRight: pages[pos + 1],
          front: pages[pos],      // Left side facing 0deg
          back: pages[pos - 1],   // Right side facing 180deg
          frontSide: 'left' as const,
          backSide: 'right' as const,
        }
      }
    } else {
      // Single Page Mode
      if (flip.dir === 1) {
        return {
          underPage: pages[pos + 1],
          front: pages[pos],
          back: pages[pos + 1],
          frontSide: 'single' as const,
          backSide: 'single' as const,
        }
      } else {
        return {
          underPage: pages[pos],
          front: pages[pos - 1],
          back: pages[pos],
          frontSide: 'single' as const,
          backSide: 'single' as const,
        }
      }
    }
  }, [flip, spread, pos, pages])

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

  const ctrlBtn = cn(
    'items-center justify-center rounded-xl transition-colors disabled:opacity-35 disabled:cursor-not-allowed',
    immersive
      ? 'text-paper-50/90 hover:bg-white/10 disabled:hover:bg-transparent'
      : 'text-ink-700 hover:bg-paper-100 disabled:hover:bg-transparent',
  )

  return (
    <div
      ref={frameRef}
      className={cn(
        'flex flex-col gap-4',
        immersive && 'h-full gap-3',
        fullscreen && 'p-6 md:p-10',
        className,
      )}
    >
      <div className={cn('book-3d flex w-full items-center justify-center', immersive ? 'min-h-0 flex-1' : 'mx-auto max-w-5xl')}>
        <div
          className={cn(
            'relative w-full touch-pan-y select-none rounded-xl bg-paper-300/80 shadow-book ring-1 ring-ink-900/15',
            spread ? 'aspect-[8/3]' : 'aspect-[4/3]',
            !immersive && (spread ? '' : 'max-w-xl'),
          )}
          style={{
            cursor: 'pointer',
            ...(immersive ? { height: '100%', aspectRatio: spread ? '8 / 3' : '4 / 3', maxWidth: '100%' } : {}),
          }}
          aria-label="Book reader — tap left/right or swipe to turn pages"
          {...pointerHandlers}
        >
          {/* STATIC VIEW (NO FLIP ACTIVE) */}
          {!flip && (
            <>
              {spread ? (
                <>
                  {/* Left Static Page */}
                  <div className="absolute inset-y-0 left-0 w-1/2">
                    <PageFace page={pages[pos]} side="left" />
                  </div>
                  {/* Right Static Page */}
                  <div className="absolute inset-y-0 right-0 w-1/2">
                    <PageFace page={pages[pos + 1]} side="right" />
                  </div>
                </>
              ) : (
                /* Single Mode Static Page */
                <div className="absolute inset-y-0 left-0 w-full">
                  <PageFace page={pages[pos]} side="single" />
                </div>
              )}
            </>
          )}

          {/* DYNAMIC 3D FLIPPING ACTIVE */}
          {flip && flipPages && (
            <>
              {spread ? (
                <>
                  {/* Underneath Left Page */}
                  <div className="absolute inset-y-0 left-0 z-10 w-1/2">
                    <PageFace page={flipPages.underLeft} side="left" />
                    {/* Shadow overlay during flip */}
                    {flip.dir === -1 && (
                      <div className="shadow-anim-left pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                    )}
                  </div>

                  {/* Underneath Right Page */}
                  <div className="absolute inset-y-0 right-0 z-10 w-1/2">
                    <PageFace page={flipPages.underRight} side="right" />
                    {/* Shadow overlay during flip */}
                    {flip.dir === 1 && (
                      <div className="shadow-anim-right pointer-events-none absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />
                    )}
                  </div>

                  {/* Turning 3D Leaf */}
                  <div
                    className={cn(
                      'absolute inset-y-0 z-30 w-1/2',
                      flip.dir === 1 ? 'left-1/2 origin-left' : 'left-0 origin-right',
                    )}
                  >
                    <div
                      className={cn(
                        'relative h-full w-full',
                        flip.dir === 1 ? 'flip-anim-fwd' : 'flip-anim-back',
                      )}
                    >
                      {/* Front Face */}
                      <div className="flip-face absolute inset-0">
                        <PageFace page={flipPages.front} side={flipPages.frontSide} />
                        {/* Dynamic page curvature highlight */}
                        <div className="shine-anim pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </div>

                      {/* Back Face */}
                      <div className="flip-back flip-face absolute inset-0">
                        <PageFace page={flipPages.back} side={flipPages.backSide} />
                        {/* Dynamic page curvature highlight */}
                        <div className="shine-anim pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-white/30 to-transparent" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Single Page 3D Flip */
                <>
                  {/* Underneath Single Page */}
                  <div className="absolute inset-y-0 left-0 z-10 w-full">
                    <PageFace page={flipPages.underPage} side="single" />
                  </div>

                  {/* Turning Single Leaf */}
                  <div
                    className={cn(
                      'absolute inset-y-0 z-30 w-full',
                      flip.dir === 1 ? 'left-0 origin-left' : 'left-0 origin-right',
                    )}
                  >
                    <div
                      className={cn(
                        'relative h-full w-full',
                        flip.dir === 1 ? 'flip-anim-fwd' : 'flip-anim-back',
                      )}
                    >
                      <div className="flip-face absolute inset-0">
                        <PageFace page={flipPages.front} side="single" />
                      </div>
                      <div className="flip-back flip-face absolute inset-0">
                        <PageFace page={flipPages.back} side="single" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Center Book Spine Line & Crease Depth Shadow */}
          {spread && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-1/2 z-40 w-4 -translate-x-1/2"
              style={{
                background:
                  'linear-gradient(to right, transparent 0%, rgba(30,20,10,0.18) 35%, rgba(30,20,10,0.38) 50%, rgba(30,20,10,0.18) 65%, transparent 100%)',
              }}
            />
          )}

          {/* Outer Book Vignette */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-40 rounded-xl"
            style={{ boxShadow: 'inset 0 0 35px rgb(46 40 32 / 0.16)' }}
          />
        </div>
      </div>

      {/* Reader Controls Bar */}
      <div className={cn('mx-auto flex w-full items-center justify-center gap-1', immersive ? 'max-w-xl' : 'max-w-2xl')}>
        <button type="button" className={cn(ctrlBtn, 'hidden size-10 sm:flex')} aria-label="First page" disabled={!canPrev} onClick={() => jump(0)}>
          <SkipBack className="size-5" />
        </button>
        <button
          type="button"
          className={cn(ctrlBtn, 'flex size-10 gap-1 max-sm:size-auto max-sm:min-w-14 max-sm:px-2', !immersive && 'sm:size-10 sm:min-w-0 sm:px-0')}
          aria-label="Previous page"
          disabled={!canPrev}
          onClick={() => turn(-1)}
        >
          <ChevronLeft className="size-6" />
          <span className="text-xs font-extrabold max-sm:inline sm:hidden">Previous</span>
        </button>

        <div
          className={cn(
            'flex flex-1 flex-col items-center gap-1 px-2',
            immersive && 'text-paper-50',
          )}
          aria-live="polite"
        >
          <span className={cn('text-sm font-extrabold', immersive ? 'text-paper-50' : 'text-ink-900')}>{label}</span>
          <div
            className={cn('h-1.5 w-32 overflow-hidden rounded-full', immersive ? 'bg-white/20' : 'bg-paper-200')}
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-coral-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          className={cn(ctrlBtn, 'flex size-10 gap-1 max-sm:size-auto max-sm:min-w-14 max-sm:px-2', !immersive && 'sm:size-10 sm:min-w-0 sm:px-0')}
          aria-label="Next page"
          disabled={!canNext}
          onClick={() => turn(1)}
        >
          <span className="text-xs font-extrabold max-sm:inline sm:hidden">Next</span>
          <ChevronRight className="size-6" />
        </button>
        <button type="button" className={cn(ctrlBtn, 'hidden size-10 sm:flex')} aria-label="Last page" disabled={!canNext} onClick={() => jump(maxPos)}>
          <SkipForward className="size-5" />
        </button>

        {!immersive && (
          <>
            <div className={cn('mx-1 h-8 w-px', immersive ? 'bg-white/20' : 'bg-paper-200')} aria-hidden="true" />
            <button
              type="button"
              className={cn(ctrlBtn, 'flex size-10')}
              aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
          </>
        )}
      </div>

      <p
        className={cn('text-center text-xs font-semibold', immersive ? 'text-paper-50/60' : 'text-ink-500')}
        aria-hidden="true"
      >
        <span className="hidden sm:inline">Use arrow keys · </span>
        <RotateCw className="mr-0.5 inline size-3.5" />
        <RotateCcw className="mr-0.5 inline size-3.5" />
        Tap sides or swipe to turn pages
      </p>
    </div>
  )
}
