import type { BookStyle } from './types'
import { kv } from './storage'
import { STYLE_SLOTS } from '@/lib/constants'
import { svgDataUrl } from '@/lib/images'

const STYLES_KEY = 'styles'

const DEFAULT_STYLE_NAMES = [
  'Watercolour Wonder',
  'Storybook Classic',
  'Crayon Carnival',
  'Soft Pastel Dream',
]

const DEFAULT_STYLE_DESCRIPTIONS = [
  'Gentle watercolour washes with a warm, hand-painted feel.',
  'Timeless storybook illustration — clean lines, cosy colours.',
  'Playful crayon textures full of energy and giggles.',
  'Misty pastel shades, perfect for bedtime adventures.',
]

function stylePlaceholder(index: number): string {
  const hue = [16, 200, 45, 260][index]
  const pastel = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`
  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450">
      <rect width="600" height="450" fill="${pastel(hue, 60, 92)}"/>
      <circle cx="180" cy="180" r="80" fill="${pastel(hue, 70, 74)}" opacity="0.9"/>
      <circle cx="340" cy="250" r="60" fill="${pastel((hue + 40) % 360, 70, 70)}" opacity="0.85"/>
      <circle cx="430" cy="130" r="45" fill="${pastel((hue + 90) % 360, 65, 75)}" opacity="0.8"/>
      <rect x="60" y="60" width="480" height="330" rx="24" fill="none" stroke="${pastel(hue, 55, 55)}" stroke-width="8" opacity="0.5"/>
    </svg>`,
  )
}

function defaultStyles(): BookStyle[] {
  return Array.from({ length: STYLE_SLOTS }, (_, i) => ({
    id: `style-${i + 1}`,
    name: DEFAULT_STYLE_NAMES[i],
    description: DEFAULT_STYLE_DESCRIPTIONS[i],
    imageUrl: stylePlaceholder(i),
    enabled: true,
  }))
}

function readStyles(): BookStyle[] {
  const stored = kv.get<BookStyle[]>(STYLES_KEY)
  if (Array.isArray(stored) && stored.length === STYLE_SLOTS) return stored
  const defaults = defaultStyles()
  kv.set(STYLES_KEY, defaults)
  return defaults
}

export async function getStyles(): Promise<BookStyle[]> {
  return readStyles()
}

export async function getEnabledStyles(): Promise<BookStyle[]> {
  return readStyles().filter((s) => s.enabled)
}

export async function updateStyle(id: string, patch: Partial<BookStyle>): Promise<BookStyle[]> {
  const styles = readStyles().map((s) => (s.id === id ? { ...s, ...patch } : s))
  kv.set(STYLES_KEY, styles)
  return styles
}

export async function replaceStyleImage(id: string, imageUrl: string): Promise<BookStyle[]> {
  return updateStyle(id, { imageUrl })
}

export async function resetStyles(): Promise<BookStyle[]> {
  const defaults = defaultStyles()
  kv.set(STYLES_KEY, defaults)
  return defaults
}
