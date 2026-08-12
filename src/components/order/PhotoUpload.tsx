import { useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { ACCEPTED_PHOTO_TYPES } from '@/lib/constants'
import { isAcceptedPhoto, processImage } from '@/lib/images'
import { cn } from '@/lib/utils'

interface PhotoSlot {
  label: string
  required: boolean
  error?: string
  onChange: (dataUrl: string | null) => void
  value: string | null
}

function PhotoField({ slot, disabled }: { slot: PhotoSlot; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setLocalError(null)
    if (!isAcceptedPhoto(file)) {
      setLocalError('Use JPG, PNG or WebP')
      return
    }
    setProcessing(true)
    try {
      const url = await processImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.82, outputType: 'image/webp' })
      slot.onChange(url)
    } catch {
      setLocalError('Could not read that image')
    } finally {
      setProcessing(false)
    }
  }

  const error = slot.error ?? localError

  return (
    <div>
      <p className="mb-1.5 text-sm font-bold text-ink-700">
        {slot.label}
        {slot.required ? (
          <span className="ml-0.5 text-coral-500" aria-hidden="true">*</span>
        ) : (
          <span className="ml-1.5 font-semibold text-ink-500">(optional)</span>
        )}
      </p>
      {slot.value ? (
        <div className="relative w-full max-w-60">
          <img
            src={slot.value}
            alt={slot.label}
            className="aspect-[4/5] w-full rounded-2xl border border-paper-200 object-cover shadow-sm"
          />
          <button
            type="button"
            onClick={() => {
              slot.onChange(null)
              setLocalError(null)
            }}
            aria-label={`Remove ${slot.label}`}
            className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-ink-900/60 text-white backdrop-blur transition-colors hover:bg-ink-900"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || processing}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex w-full max-w-60 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 transition-all',
            error
              ? 'border-red-300 bg-red-50/50'
              : 'border-paper-300 bg-paper-100/70 hover:border-coral-300 hover:bg-coral-50/60',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          {processing ? (
            <span className="text-sm font-bold text-coral-600">Processing…</span>
          ) : (
            <>
              <span className="grid size-11 place-items-center rounded-full bg-white text-coral-500 shadow-sm">
                <ImagePlus className="size-5" />
              </span>
              <span className="text-sm font-bold text-ink-700">Upload {slot.required ? 'photo' : 'photo (optional)'}</span>
              <span className="text-xs text-ink-500">JPG · PNG · WebP</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_PHOTO_TYPES.join(',')}
        className="sr-only"
        onChange={(e) => {
          void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {error && (
        <p role="alert" className="mt-1 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export function PhotoUpload({
  photo1,
  photo2,
  onChange1,
  onChange2,
  photo1Error,
  disabled = false,
}: {
  photo1: string | null
  photo2: string | null
  onChange1: (v: string | null) => void
  onChange2: (v: string | null) => void
  photo1Error?: string
  disabled?: boolean
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Camera className="size-5 text-coral-500" aria-hidden="true" />
        <h3 className="font-display text-lg font-semibold">Child&rsquo;s photos</h3>
      </div>
      <p className="mb-4 text-sm text-ink-500">
        We use these to draw your child into the story. A clear, happy face works best.
      </p>
      <div className="flex flex-wrap gap-6">
        <PhotoField slot={{ label: 'Child Photo 1', required: true, error: photo1Error, onChange: onChange1, value: photo1 }} disabled={disabled} />
        <PhotoField slot={{ label: 'Child Photo 2', required: false, onChange: onChange2, value: photo2 }} disabled={disabled} />
      </div>
    </div>
  )
}
