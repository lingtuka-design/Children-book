import type { BookStyle } from '../types'
import { api, uploadAsset } from '../api'
import { STYLE_SLOTS } from '@/lib/constants'
import { svgDataUrl } from '@/lib/images'

const DEFAULT_NAMES = ['Watercolour Wonder', 'Storybook Classic', 'Crayon Carnival', 'Soft Pastel Dream']
const DEFAULT_DESCRIPTIONS = [
  'Gentle watercolour washes with a warm, hand-painted feel.',
  'Timeless storybook illustration — clean lines, cosy colours.',
  'Playful crayon textures full of energy and giggles.',
  'Misty pastel shades, perfect for bedtime adventures.',
]

function placeholderSvg(index: number): string {
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

export function defaultRemoteStyles(): BookStyle[] {
  return Array.from({ length: STYLE_SLOTS }, (_, i) => ({
    id: `style-${i + 1}`,
    name: DEFAULT_NAMES[i],
    description: DEFAULT_DESCRIPTIONS[i],
    imageUrl: placeholderSvg(i),
    enabled: true,
  }))
}

export async function remoteGetStyles(): Promise<BookStyle[]> {
  const { styles } = await api<{ styles: BookStyle[] }>('/api/styles')
  if (styles.length > 0) return styles
  try {
    await remoteResetStyles()
    const again = await api<{ styles: BookStyle[] }>('/api/styles')
    return again.styles
  } catch {
    return defaultRemoteStyles()
  }
}

export async function remoteUpdateStyle(id: string, patch: Partial<BookStyle>): Promise<BookStyle[]> {
  const current = await api<{ styles: BookStyle[] }>('/api/styles')
  const target = current.styles.find((s) => s.id === id) ?? { id, name: '', description: '', imageUrl: null, enabled: true }
  const next = { ...target, ...patch }
  await api(`/api/styles/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(next) })
  const after = await api<{ styles: BookStyle[] }>('/api/styles')
  return after.styles
}

export async function remoteReplaceStyleImage(id: string, imageUrl: string): Promise<BookStyle[]> {
  const { url } = await uploadAsset(`styles/${id}/ref.webp`, imageUrl)
  return remoteUpdateStyle(id, { imageUrl: url })
}

export async function remoteResetStyles(): Promise<BookStyle[]> {
  const defaults = defaultRemoteStyles()
  for (const style of defaults) {
    const imageUrl = style.imageUrl ?? ''
    const { url } = await uploadAsset(`styles/${style.id}/ref.svg`, imageUrl)
    await api(`/api/styles/${style.id}`, { method: 'PUT', body: JSON.stringify({ ...style, imageUrl: url }) })
  }
  return defaults.map((s) => ({ ...s, imageUrl: `/api/assets/styles/${s.id}/ref.svg` }))
}
