import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'coral' | 'sun' | 'leaf' | 'ink' | 'sky' | 'red'

const tones: Record<Tone, string> = {
  coral: 'bg-coral-100 text-coral-700',
  sun: 'bg-sun-100 text-amber-700',
  leaf: 'bg-leaf-100 text-leaf-700',
  ink: 'bg-paper-200 text-ink-700',
  sky: 'bg-sky-100 text-sky-800',
  red: 'bg-red-100 text-red-700',
}

export function Badge({ tone = 'ink', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function FeaturedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sun-500 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-md">
      <span aria-hidden="true">★</span> Featured
    </span>
  )
}
