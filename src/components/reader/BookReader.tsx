import React, { useCallback, useEffect, useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'
import {
  ArrowLeft,
  ArrowRight,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { ReaderPage } from '@/services/types'
import { cn } from '@/lib/utils'

interface BookReaderProps {
  pages: ReaderPage[]
  className?: string
  variant?: 'embedded' | 'immersive'
}

/* Page Component wrapped with React.forwardRef for react-pageflip DOM ref handling */
const Page = React.forwardRef<
  HTMLDivElement,
  { page: ReaderPage; number: number; total: number }
>(({ page, number, total }, ref) => {
  return (
    <div
      ref={ref}
      className="page relative h-full w-full overflow-hidden bg-white shadow-md select-none border border-paper-300/40"
      data-density="soft"
    >
      <div className="relative h-full w-full">
        {page.blank ? (
          <div className="paper-blank relative h-full w-full" aria-hidden="true" />
        ) : (
          <img
            src={page.url}
            alt={`Book page ${number}`}
            draggable={false}
            className="h-full w-full object-contain select-none"
          />
        )}

        {/* Paper Spine & Crease Depth Overlay */}
        <div
          className="pointer-events-none absolute inset-y-0 w-8"
          style={{
            background:
              number % 2 === 0
                ? 'linear-gradient(to right, rgba(0,0,0,0.12) 0%, transparent 100%)'
                : 'linear-gradient(to left, rgba(0,0,0,0.12) 0%, transparent 100%)',
            right: number % 2 === 0 ? 'auto' : 0,
            left: number % 2 === 0 ? 0 : 'auto',
          }}
        />

        {/* Page Number Indicator */}
        {!page.blank && (
          <span
            className={cn(
              'absolute bottom-2 text-xs font-bold text-ink-500/70 select-none px-3',
              number % 2 === 0 ? 'left-2' : 'right-2',
            )}
          >
            {number} / {total}
          </span>
        )}
      </div>
    </div>
  )
})
Page.displayName = 'Page'

function playPageTurnSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const bufferSize = Math.floor(ctx.sampleRate * 0.14)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08
      b6 = white * 0.115926
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1400, ctx.currentTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    source.start()
    source.onended = () => {
      void ctx.close()
    }
  } catch {
    // Audio Context restricted or unavailable
  }
}

export function BookReader({ pages, className, variant = 'embedded' }: BookReaderProps) {
  const total = pages.length
  const immersive = variant === 'immersive'
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const flipBookRef = useRef<any>(null)

  const [currentPage, setCurrentPage] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)

  /* Requirement 3: Dynamic Responsive Dimensions with Fallback Width */
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    const initialWidth = Math.min(typeof window !== 'undefined' ? window.innerWidth - 32 : 900, 1024)
    const isPortrait = typeof window !== 'undefined' ? window.innerWidth < 768 : false
    const pageW = isPortrait ? initialWidth : Math.floor(initialWidth / 2)
    const pageH = Math.floor(pageW * 1.333)
    return { width: pageW, height: pageH }
  })

  useEffect(() => {
    const updateDimensions = () => {
      const containerWidth =
        containerRef.current?.clientWidth || Math.min(window.innerWidth - 32, 1024)
      const isPortrait = window.innerWidth < 768
      const effectiveWidth = Math.max(300, Math.min(containerWidth, 1024))
      const pageW = isPortrait ? effectiveWidth : Math.floor(effectiveWidth / 2)
      const pageH = Math.floor(pageW * 1.333)
      setDimensions({ width: pageW, height: pageH })
    }

    updateDimensions()

    const observer = new ResizeObserver(() => {
      updateDimensions()
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    window.addEventListener('resize', updateDimensions)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateDimensions)
    }
  }, [pages, pages.length])

  /* Fullscreen Change Handler */
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

  /* External Navigation Control Handlers via flipBookRef */
  const handlePrev = useCallback(() => {
    if (soundEnabled) playPageTurnSound()
    flipBookRef.current?.pageFlip()?.flipPrev()
  }, [soundEnabled])

  const handleNext = useCallback(() => {
    if (soundEnabled) playPageTurnSound()
    flipBookRef.current?.pageFlip()?.flipNext()
  }, [soundEnabled])

  const handleFirst = useCallback(() => {
    if (soundEnabled) playPageTurnSound()
    flipBookRef.current?.pageFlip()?.flip(0)
  }, [soundEnabled])

  const handleLast = useCallback(() => {
    if (soundEnabled) playPageTurnSound()
    flipBookRef.current?.pageFlip()?.flip(total - 1)
  }, [soundEnabled, total])

  /* Keyboard Navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        handleFirst()
      } else if (e.key === 'End') {
        e.preventDefault()
        handleLast()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleNext, handlePrev, handleFirst, handleLast])

  const handleFlip = useCallback(
    (e: { data: number }) => {
      setCurrentPage(e.data)
      if (soundEnabled) playPageTurnSound()
    },
    [soundEnabled],
  )

  const progress = ((currentPage + 1) / total) * 100

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
      {/* Book Container with ResizeObserver ref */}
      <div
        ref={containerRef}
        className={cn(
          'flex w-full items-center justify-center overflow-hidden',
          immersive ? 'min-h-0 flex-1' : 'mx-auto max-w-5xl',
        )}
      >
        <div className="relative flex items-center justify-center p-2 rounded-2xl bg-paper-300/40 shadow-book">
          {/* Requirement 2: HTMLFlipBook Component with exact specified props */}
          {/* @ts-ignore - react-pageflip React 19 type compatibility */}
          <HTMLFlipBook
            ref={flipBookRef}
            width={dimensions.width}
            height={dimensions.height}
            size="fixed"
            drawShadow={true}
            maxShadowOpacity={0.55}
            flippingTime={600}
            usePortrait={false}
            showCover={false}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={false}
            onFlip={handleFlip}
            className="shadow-2xl rounded-lg overflow-hidden"
            style={{}}
            startPage={0}
            minWidth={280}
            maxWidth={1024}
            minHeight={350}
            maxHeight={1200}
            startZIndex={0}
            autoSize={true}
            mobileScrollSupport={true}
            clickEventForward={true}
          >
            {pages.map((page, idx) => (
              <Page key={page.index ?? idx} page={page} number={idx + 1} total={total} />
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      {/* Requirement 4: Explicit External Navigation Controls */}
      <div
        className={cn(
          'mx-auto flex w-full items-center justify-center gap-2',
          immersive ? 'max-w-xl' : 'max-w-2xl',
        )}
      >
        <button
          type="button"
          className={cn(ctrlBtn, 'hidden size-10 sm:flex')}
          aria-label="First page"
          disabled={currentPage <= 0}
          onClick={handleFirst}
        >
          <SkipBack className="size-5" />
        </button>

        {/* ← Previous Page button */}
        <button
          type="button"
          className={cn(
            ctrlBtn,
            'flex h-11 items-center gap-2 rounded-xl bg-paper-100 px-4 text-sm font-extrabold text-ink-900 border border-paper-300 shadow-sm hover:bg-paper-200 disabled:opacity-40',
            immersive && 'bg-white/15 text-white border-white/20 hover:bg-white/25',
          )}
          aria-label="Previous Page"
          disabled={currentPage <= 0}
          onClick={handlePrev}
        >
          <ArrowLeft className="size-4" />
          <span>← Previous Page</span>
        </button>

        {/* Page counter & progress indicator */}
        <div
          className={cn(
            'flex flex-1 flex-col items-center gap-1 px-2',
            immersive && 'text-paper-50',
          )}
          aria-live="polite"
        >
          <span className={cn('text-sm font-extrabold', immersive ? 'text-paper-50' : 'text-ink-900')}>
            Page {currentPage + 1} of {total}
          </span>
          <div
            className={cn('h-1.5 w-28 overflow-hidden rounded-full', immersive ? 'bg-white/20' : 'bg-paper-200')}
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-coral-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Next Page → button */}
        <button
          type="button"
          className={cn(
            ctrlBtn,
            'flex h-11 items-center gap-2 rounded-xl bg-coral-500 px-4 text-sm font-extrabold text-white shadow-md hover:bg-coral-600 disabled:opacity-40',
          )}
          aria-label="Next Page"
          disabled={currentPage >= total - 1}
          onClick={handleNext}
        >
          <span>Next Page →</span>
          <ArrowRight className="size-4" />
        </button>

        <button
          type="button"
          className={cn(ctrlBtn, 'hidden size-10 sm:flex')}
          aria-label="Last page"
          disabled={currentPage >= total - 1}
          onClick={handleLast}
        >
          <SkipForward className="size-5" />
        </button>

        {!immersive && (
          <>
            <div className={cn('mx-1 h-8 w-px', immersive ? 'bg-white/20' : 'bg-paper-200')} aria-hidden="true" />
            <button
              type="button"
              className={cn(ctrlBtn, 'flex size-10')}
              aria-label={soundEnabled ? 'Mute page turn sound' : 'Enable page turn sound'}
              onClick={() => setSoundEnabled((s) => !s)}
              title={soundEnabled ? 'Page flip audio on' : 'Page flip audio muted'}
            >
              {soundEnabled ? <Volume2 className="size-5 text-coral-600" /> : <VolumeX className="size-5 text-ink-500" />}
            </button>
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
        Drag page corners or click buttons to turn pages
      </p>
    </div>
  )
}
