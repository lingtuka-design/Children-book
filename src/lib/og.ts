import { loadImage } from './images'

const W = 1080
const H = 1440

export interface OgCoverInput {
  coverUrl: string
}

/**
 * Renders the book cover by itself as a clean 3:4 JPEG (1080×1440) for social
 * media thumbnails. The cover is fitted without cropping; any letterboxing
 * uses a soft paper tone so the cover stays crisp and clear.
 */
export async function generateOgCover({ coverUrl }: OgCoverInput): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  ctx.fillStyle = '#fdf6ec'
  ctx.fillRect(0, 0, W, H)

  const img = await loadImage(coverUrl)
  const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight)
  const drawW = Math.round(img.naturalWidth * scale)
  const drawH = Math.round(img.naturalHeight * scale)
  const x = Math.round((W - drawW) / 2)
  const y = Math.round((H - drawH) / 2)

  ctx.drawImage(img, x, y, drawW, drawH)
  return canvas.toDataURL('image/jpeg', 0.86)
}
