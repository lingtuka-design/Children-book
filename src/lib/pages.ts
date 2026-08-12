import type { BookCoverAsset, BookPageAsset } from '@/services/types'
import { isAcceptedImage, isPdf, pageNumberFromFilename, processImage } from './images'
import { pdfToImages } from './pdf'
import { ACCEPTED_BOOK_TYPES } from './constants'

export interface ProcessResult {
  pages: BookPageAsset[]
  errors: string[]
}

const PAGE_MAX = 24

function nextFreeNumber(used: Set<number>): number {
  for (let i = 1; i <= PAGE_MAX; i++) {
    if (!used.has(i)) return i
  }
  return PAGE_MAX
}

/**
 * Turn uploaded files (images + multi-page PDFs) into numbered book pages.
 * Numbers come from file names ("page-03.jpg" → 3); PDFs expand to one page
 * per PDF page, continuing from their base number. Never relies on upload order.
 */
export async function processPageFiles(files: File[], existing: BookPageAsset[]): Promise<ProcessResult> {
  const used = new Set(existing.map((p) => p.pageNumber))
  const pages = [...existing]
  const errors: string[] = []

  for (const file of files) {
    if (isPdf(file)) {
      try {
        const images = await pdfToImages(file)
        const base = pageNumberFromFilename(file.name) ?? nextFreeNumber(used)
        for (let i = 0; i < images.length; i++) {
          const num = base + i
          if (num > PAGE_MAX) {
            errors.push(`"${file.name}" page ${i + 1} exceeds page ${PAGE_MAX}`)
            continue
          }
          const idx = pages.findIndex((p) => p.pageNumber === num)
          const asset: BookPageAsset = { pageNumber: num, url: images[i], mime: 'image/jpeg' }
          if (idx >= 0) pages[idx] = asset
          else pages.push(asset)
          used.add(num)
        }
      } catch {
        errors.push(`Could not process PDF "${file.name}"`)
      }
    } else if (isAcceptedImage(file)) {
      const num = pageNumberFromFilename(file.name) ?? nextFreeNumber(used)
      if (num > PAGE_MAX) {
        errors.push(`"${file.name}" exceeds page ${PAGE_MAX}`)
        continue
      }
      try {
        const url = await processImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 })
        const idx = pages.findIndex((p) => p.pageNumber === num)
        const asset: BookPageAsset = { pageNumber: num, url, mime: 'image/jpeg' }
        if (idx >= 0) pages[idx] = asset
        else pages.push(asset)
        used.add(num)
      } catch {
        errors.push(`Could not read image "${file.name}"`)
      }
    } else {
      errors.push(`Unsupported file "${file.name}" — use ${ACCEPTED_BOOK_TYPES.join(', ')}`)
    }
  }

  pages.sort((a, b) => a.pageNumber - b.pageNumber)
  return { pages, errors }
}

/** Process a single cover file (image or first page of a PDF). */
export async function processCoverFile(file: File): Promise<BookCoverAsset> {
  if (isPdf(file)) {
    const images = await pdfToImages(file, { pageLimit: 1, maxWidth: 900, maxHeight: 1200, quality: 0.85 })
    if (images.length === 0) throw new Error('PDF has no pages')
    return { url: images[0], mime: 'image/jpeg' }
  }
  if (!isAcceptedImage(file)) throw new Error('Cover must be a PNG, JPG/JPEG or PDF')
  const url = await processImage(file, { maxWidth: 900, maxHeight: 1200, quality: 0.85 })
  return { url, mime: 'image/jpeg' }
}

/** List of missing content page numbers in a page set (validates 1–24). */
export function missingPages(pages: BookPageAsset[]): number[] {
  const present = new Set(pages.map((p) => p.pageNumber))
  const missing: number[] = []
  for (let i = 1; i <= PAGE_MAX; i++) {
    if (!present.has(i)) missing.push(i)
  }
  return missing
}
