import type { ImageOptions } from './images'
import { snapshotCanvas } from './images'

type PdfModule = typeof import('pdfjs-dist')

let pdfjsPromise: Promise<PdfModule> | null = null
let workerConfigured = false

async function loadPdfjs(): Promise<PdfModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((mod) => {
      if (!workerConfigured) {
        mod.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()
        workerConfigured = true
      }
      return mod
    })
  }
  return pdfjsPromise
}

export interface PdfPageOptions extends ImageOptions {
  /** Only render up to this many pages. */
  pageLimit?: number
}

/**
 * Render every page of a PDF to a compressed image data URL (client-side only).
 * This is how PDF uploads become browser-displayable book pages.
 */
export async function pdfToImages(file: File, options: PdfPageOptions = {}): Promise<string[]> {
  const pdfjs = await loadPdfjs()
  const buffer = await file.arrayBuffer()
  const task = pdfjs.getDocument({ data: buffer })
  const doc = await task.promise
  const count = Math.min(doc.numPages, options.pageLimit ?? doc.numPages)
  const images: string[] = []

  try {
    for (let i = 1; i <= count; i++) {
      const page = await doc.getPage(i)
      const base = Math.min(page.view[2], page.view[3])
      const target = Math.min(1400, base * 2)
      const scale = target / base
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvas, viewport }).promise
      images.push(await snapshotCanvas(canvas, options))
    }
  } finally {
    void task.destroy().catch(() => undefined)
  }
  return images
}
