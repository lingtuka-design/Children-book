import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ImagePlus, Loader2, RotateCcw, Star } from 'lucide-react'
import { SpinnerScreen } from '@/components/ui/Spinner'
import { ErrorBanner } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { useStyles } from '@/services/hooks'
import { usePageMeta } from '@/lib/seo'
import * as styleService from '@/services/styles'
import { isAcceptedImage, processImage } from '@/lib/images'
import { STYLE_SLOTS } from '@/lib/constants'
import type { BookStyle } from '@/services/types'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/_layout/styles')({ component: AdminStylesRoute })

function AdminStylesRoute() {
  usePageMeta({ title: 'Styles' })
  const { data: styles, loading, error, reload } = useStyles()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function toggleEnabled(style: BookStyle) {
    setLocalError(null)
    try {
      await styleService.updateStyle(style.id, { enabled: !style.enabled })
      reload()
    } catch {
      setLocalError('Could not update the style')
    }
  }

  async function updateField(style: BookStyle, patch: Partial<BookStyle>) {
    setLocalError(null)
    try {
      await styleService.updateStyle(style.id, patch)
      reload()
    } catch {
      setLocalError('Could not save the style')
    }
  }

  async function handleImage(file: File | undefined, style: BookStyle) {
    if (!file) return
    if (!isAcceptedImage(file)) {
      setLocalError('Reference image must be JPG, PNG or WebP')
      return
    }
    setBusyId(style.id)
    setLocalError(null)
    try {
      const url = await processImage(file, { maxWidth: 900, maxHeight: 700, quality: 0.85 })
      await styleService.replaceStyleImage(style.id, url)
      reload()
    } catch {
      setLocalError('Could not process that image')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <SpinnerScreen label="Loading styles…" />
  if (error) return <ErrorBanner message={error} onRetry={reload} />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading-display text-3xl">Illustration styles</h1>
          <p className="mt-1 max-w-xl text-ink-500">
            These four styles are offered to customers in the order form. Only enabled styles are shown. Replace the
            reference image at any time.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RotateCcw className="size-4" />}
          onClick={() => {
            void styleService.resetStyles().then(() => reload())
          }}
        >
          Reset to defaults
        </Button>
      </div>

      {localError && <ErrorBanner message={localError} />}

      <div className="grid gap-5 md:grid-cols-2">
        {styles?.map((style, i) => (
          <div key={style.id} className="rounded-3xl border border-paper-200 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-paper-200 text-sm font-extrabold text-ink-700">
                  {i + 1}
                </span>
                <h2 className="font-display text-lg font-semibold">{style.name}</h2>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-ink-700">
                <span className={cn(style.enabled ? 'text-leaf-700' : 'text-ink-500')}>{style.enabled ? 'Enabled' : 'Disabled'}</span>
                <span className="relative inline-block h-6 w-11 rounded-full bg-paper-200 transition-colors peer-checked:bg-leaf-500">
                  <input
                    type="checkbox"
                    checked={style.enabled}
                    onChange={() => void toggleEnabled(style)}
                    className="peer sr-only"
                    aria-label={`Enable or disable ${style.name}`}
                  />
                  <span
                    className={cn(
                      'absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform',
                      style.enabled && 'translate-x-5 bg-leaf-500',
                    )}
                  />
                </span>
              </label>
            </div>

            <div className="mt-4 flex items-start gap-4">
              <div className="relative shrink-0">
                <img
                  src={style.imageUrl ?? undefined}
                  alt={`Reference image for ${style.name}`}
                  className="aspect-[4/3] w-36 rounded-xl border border-paper-200 object-cover shadow-sm"
                />
                {busyId === style.id && (
                  <div className="absolute inset-0 grid place-items-center rounded-xl bg-ink-900/40 text-white">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <input
                  value={style.name}
                  onChange={(e) => updateField(style, { name: e.target.value })}
                  aria-label={`Style ${i + 1} name`}
                  className="w-full rounded-lg border border-paper-300 px-3 py-2 text-sm font-bold focus:border-coral-400 focus:outline-none"
                />
                <textarea
                  value={style.description}
                  onChange={(e) => updateField(style, { description: e.target.value })}
                  aria-label={`Style ${i + 1} description`}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-paper-300 px-3 py-2 text-sm focus:border-coral-400 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRefs.current[style.id]?.click()}
                    disabled={busyId === style.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-paper-100 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-200 disabled:opacity-60"
                  >
                    <ImagePlus className="size-4" /> Replace image
                  </button>
                  {style.enabled && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-sun-500">
                      <Star className="size-3.5 fill-current" /> shown to customers
                    </span>
                  )}
                </div>
                <input
                  ref={(el) => {
                    fileRefs.current[style.id] = el
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    void handleImage(e.target.files?.[0], style)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-ink-500">
        {STYLE_SLOTS} style slots are available. Slot order determines the order customers see them in.
      </p>
    </div>
  )
}
