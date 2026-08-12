import { Check } from 'lucide-react'
import type { BookStyle } from '@/services/types'
import { cn } from '@/lib/utils'

export function StyleCards({
  styles,
  selectedId,
  onSelect,
  error,
  loading,
}: {
  styles: BookStyle[]
  selectedId: string | null
  onSelect: (id: string) => void
  error?: string
  loading?: boolean
}) {
  return (
    <fieldset>
      <legend className="mb-1 font-display text-lg font-semibold">
        Choose an illustration style
        <span className="ml-0.5 text-coral-500" aria-hidden="true">*</span>
      </legend>
      <p className="mb-4 text-sm text-ink-500">
        Pick the look you love — our illustrators will match your child&rsquo;s book to it.
      </p>
      {styles.length === 0 && !loading ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          No styles are available right now. Please check back shortly.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {styles.map((style) => {
            const selected = style.id === selectedId
            return (
              <label
                key={style.id}
                className={cn(
                  'group relative cursor-pointer overflow-hidden rounded-2xl border-2 bg-white shadow-card transition-all hover:-translate-y-0.5',
                  selected
                    ? 'border-coral-500 ring-4 ring-coral-100'
                    : 'border-transparent hover:border-paper-300',
                )}
              >
                <input
                  type="radio"
                  name="style"
                  value={style.id}
                  checked={selected}
                  onChange={() => onSelect(style.id)}
                  className="sr-only"
                />
                <img
                  src={style.imageUrl ?? undefined}
                  alt={style.name}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-ink-900">{style.name}</p>
                    <span
                      className={cn(
                        'grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
                        selected ? 'border-coral-500 bg-coral-500 text-white' : 'border-paper-300 bg-white text-transparent',
                      )}
                      aria-hidden="true"
                    >
                      <Check className="size-3" />
                    </span>
                  </div>
                  {style.description && <p className="mt-1 text-sm text-ink-500">{style.description}</p>}
                </div>
              </label>
            )
          })}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  )
}
