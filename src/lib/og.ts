import { APP_NAME } from './constants'
import { loadImage } from './images'

const W = 1200
const H = 630
const COVER_W = 396
const COVER_H = 528
const COVER_X = 72
const COVER_Y = (H - COVER_H) / 2

export interface OgCardInput {
  coverUrl: string
  title: string
  description?: string
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max).trimEnd() + '…'
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const probe = line ? `${line} ${word}` : word
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines - 1) break
    } else {
      line = probe
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Renders a 1200×630 Open Graph card (book cover + title + excerpt) to a PNG
 * data URL. Runs entirely in the browser so no server-side image processing
 * is needed. The result is uploaded to R2 and linked as og:image.
 */
export async function generateOgCard({ coverUrl, title, description }: OgCardInput): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  /* warm paper background with soft blobs */
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#fdf6ec')
  bg.addColorStop(1, '#f3e8d3')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.globalAlpha = 0.55
  ctx.fillStyle = '#fae0d3'
  ctx.beginPath()
  ctx.arc(1030, 90, 150, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f7d679'
  ctx.beginPath()
  ctx.arc(1100, 560, 110, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e2efe7'
  ctx.beginPath()
  ctx.arc(80, 600, 120, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  /* book cover with shadow + rounded corners */
  try {
    const img = await loadImage(coverUrl)
    ctx.save()
    ctx.shadowColor = 'rgba(46, 40, 32, 0.35)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 14
    ctx.beginPath()
    ctx.roundRect(COVER_X, COVER_Y, COVER_W, COVER_H, 18)
    ctx.fillStyle = '#f7f0e2'
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.clip()
    ctx.drawImage(img, COVER_X, COVER_Y, COVER_W, COVER_H)
    ctx.restore()
    ctx.strokeStyle = 'rgba(46, 40, 32, 0.14)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(COVER_X, COVER_Y, COVER_W, COVER_H, 18)
    ctx.stroke()
  } catch {
    /* cover failed to load — draw an empty book spine */
    ctx.fillStyle = '#e9d9bb'
    ctx.beginPath()
    ctx.roundRect(COVER_X, COVER_Y, COVER_W, COVER_H, 18)
    ctx.fill()
  }

  const textX = COVER_X + COVER_W + 56
  const textW = W - textX - 72

  /* brand label */
  ctx.fillStyle = '#c5542f'
  ctx.font = '700 26px system-ui, sans-serif'
  ctx.fillText(APP_NAME.toUpperCase(), textX, 130)

  /* title */
  ctx.fillStyle = '#2e2820'
  ctx.font = '700 58px Georgia, "Times New Roman", serif'
  const titleLines = wrapText(ctx, truncate(title, 90), textW, 3)
  let y = 190
  for (const line of titleLines) {
    ctx.fillText(line, textX, y)
    y += 68
  }

  /* excerpt */
  const excerpt = truncate(description || 'A personalised storybook, made just for your child.', 200)
  ctx.fillStyle = '#6b5d4e'
  ctx.font = '28px system-ui, sans-serif'
  const excerptLines = wrapText(ctx, excerpt, textW, 4)
  let ey = Math.max(y + 26, 420)
  for (const line of excerptLines) {
    ctx.fillText(line, textX, ey)
    ey += 40
  }

  return canvas.toDataURL('image/png')
}
