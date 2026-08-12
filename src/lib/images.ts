import { ACCEPTED_IMAGE_TYPES, ACCEPTED_PHOTO_TYPES } from './constants'
import { readFileAsDataUrl } from './utils'

export interface ImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  outputType?: 'image/jpeg' | 'image/webp'
}

export function isPdf(file: { type: string; name: string }): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

export function isAcceptedImage(file: { type: string }): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type)
}

export function isAcceptedPhoto(file: { type: string }): boolean {
  return ACCEPTED_PHOTO_TYPES.includes(file.type)
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

/** Decode an image (file or data URL) and re-encode it to a bounded, compressed data URL. */
export async function processImage(
  src: string | File,
  options: ImageOptions = {},
): Promise<string> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.82, outputType = 'image/jpeg' } = options
  const dataUrl = typeof src === 'string' ? src : await readFileAsDataUrl(src)
  const img = await loadImage(dataUrl)

  const scale = Math.min(1, maxWidth / img.naturalWidth, maxHeight / img.naturalHeight)
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  return canvas.toDataURL(outputType, quality)
}

/** Snapshot an arbitrary surface (e.g. a canvas) to a bounded data URL. */
export async function snapshotCanvas(
  canvas: HTMLCanvasElement,
  options: ImageOptions = {},
): Promise<string> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.82, outputType = 'image/jpeg' } = options
  const scale = Math.min(1, maxWidth / canvas.width, maxHeight / canvas.height)
  if (scale >= 1) return canvas.toDataURL(outputType, quality)

  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(canvas.width * scale))
  out.height = Math.max(1, Math.round(canvas.height * scale))
  const ctx = out.getContext('2d')
  if (!ctx) return canvas.toDataURL(outputType, quality)
  ctx.drawImage(canvas, 0, 0, out.width, out.height)
  return out.toDataURL(outputType, quality)
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Parse a leading number out of a file name: "page-03.jpg" -> 3, "cover.pdf" -> null */
export function pageNumberFromFilename(name: string): number | null {
  const match = name.match(/(?:^|[^\d])(\d{1,3})(?:[^\d]|$)/)
  return match ? parseInt(match[1], 10) : null
}
