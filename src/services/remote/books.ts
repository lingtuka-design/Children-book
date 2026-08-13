import type { Book, BookDraft, BookPageAsset, BookSummary } from '../types'
import { api, isRemoteAssetUrl, uploadAsset } from '../api'
import { generateOgCard } from '@/lib/og'
import { slugify } from '@/lib/utils'

const coverCache = new Map<string, string>()

export function getRemoteCoverCache(): Map<string, string> {
  return coverCache
}

function extFromUrl(url: string): string {
  if (url.startsWith('data:image/svg')) return 'svg'
  if (url.startsWith('data:image/webp')) return 'webp'
  if (url.startsWith('data:image/png')) return 'png'
  if (url.startsWith('data:image/jpeg')) return 'jpg'
  return url.split('.').pop()?.split('?')[0] ?? 'webp'
}

/** Upload a data-URL asset to R2 unless it is already a stored remote URL. */
async function ensureRemoteAsset(prefix: string, label: string, url: string): Promise<string> {
  if (isRemoteAssetUrl(url)) return url
  const { url: stored } = await uploadAsset(`${prefix}/${label}.${extFromUrl(url)}`, url)
  return stored
}

function uniqueSlug(base: string, existing: BookSummary[], excludeId?: string): string {
  const seen = new Set(existing.map((b) => b.id).filter((id) => id !== excludeId))
  let slug = base || 'book'
  let n = 2
  while (seen.has(slug)) {
    slug = `${base || 'book'}-${n}`
    n += 1
  }
  return slug
}

export async function remoteListBooks(): Promise<BookSummary[]> {
  const { books } = await api<{ books: BookSummary[] }>('/api/books')
  for (const b of books) {
    if (b.coverUrl) coverCache.set(b.id, b.coverUrl)
  }
  return books
}

export async function remoteGetBook(id: string): Promise<Book | null> {
  try {
    const { book } = await api<{ book: Book }>(`/api/books/${encodeURIComponent(id)}`)
    if (book?.cover?.url) coverCache.set(book.id, book.cover.url)
    return book
  } catch {
    return null
  }
}

export async function remoteGetCoverUrl(id: string): Promise<string | null> {
  const cached = coverCache.get(id)
  if (cached !== undefined) return cached
  try {
    const { book } = await api<{ book: Book }>(`/api/books/${encodeURIComponent(id)}`)
    if (book?.cover?.url) {
      coverCache.set(id, book.cover.url)
      return book.cover.url
    }
  } catch {
    // fall through
  }
  return null
}

async function prepareDraft(prefix: string, draft: BookDraft): Promise<BookDraft> {
  const coverUrl = draft.cover ? await ensureRemoteAsset(prefix, 'cover', draft.cover.url) : null
  const pages: BookPageAsset[] = []
  for (const page of draft.pages) {
    const url = await ensureRemoteAsset(prefix, `pages/p${page.pageNumber}`, page.url)
    pages.push({ pageNumber: page.pageNumber, url, mime: 'image/*' })
  }
  return {
    ...draft,
    cover: coverUrl ? { url: coverUrl, mime: 'image/*' } : null,
    pages,
  }
}

/**
 * Render the 1200×630 social card (cover + title + excerpt) and store it in
 * R2 so social platforms can preview the book. Best-effort: failures keep the
 * previously stored card (or none).
 */
async function ensureOgCard(id: string, draft: BookDraft, coverChanged: boolean): Promise<string | undefined> {
  if (!draft.cover || (!coverChanged && draft.ogUrl)) return draft.ogUrl
  try {
    const png = await generateOgCard({ coverUrl: draft.cover.url, title: draft.title, description: draft.description })
    const { url } = await uploadAsset(`og/${id}.png`, png)
    return url
  } catch {
    return draft.ogUrl
  }
}

export async function remoteCreateBook(draft: BookDraft): Promise<Book> {
  const existing = await remoteListBooks()
  const id = uniqueSlug(slugify(draft.title), existing)
  const prepared = await prepareDraft(`books/${id}`, draft)
  prepared.ogUrl = await ensureOgCard(id, prepared, true)
  const { book } = await api<{ book: Book }>('/api/books', {
    method: 'POST',
    body: JSON.stringify({ ...prepared, id }),
  })
  return book
}

export async function remoteUpdateBook(id: string, draft: BookDraft): Promise<Book> {
  const existing = await remoteGetBook(id)
  const prepared = await prepareDraft(`books/${id}`, draft)
  const coverChanged = !existing || !prepared.cover || existing.cover.url !== prepared.cover.url
  prepared.ogUrl = await ensureOgCard(id, prepared, coverChanged)
  const { book } = await api<{ book: Book }>(`/api/books/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify(prepared),
  })
  return book
}

export async function remoteDeleteBook(id: string): Promise<void> {
  await api(`/api/books/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function remoteSetBookFeatured(id: string, featured: boolean): Promise<Book> {
  const book = await remoteGetBook(id)
  if (!book) throw new Error('Book not found')
  return remoteUpdateBook(id, { ...book, category: book.category ?? '', author: book.author ?? '', featured })
}

export async function remoteSetBookPublished(id: string, published: boolean): Promise<Book> {
  const book = await remoteGetBook(id)
  if (!book) throw new Error('Book not found')
  return remoteUpdateBook(id, { ...book, category: book.category ?? '', author: book.author ?? '', published })
}
