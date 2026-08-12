import type { Book, BookCoverAsset, BookDraft, BookPageAsset, BookSummary } from './types'
import { idb, kv } from './storage'
import { slugify } from '@/lib/utils'

const INDEX_KEY = 'books:index'
const RECORD_PREFIX = 'book:'
const COVER_PREFIX = 'cover:'

const coverCache = new Map<string, string>()

async function writeCoverRecord(book: Book): Promise<void> {
  coverCache.set(book.id, book.cover.url)
  await idb.set(COVER_PREFIX + book.id, { url: book.cover.url, mime: book.cover.mime })
}

/** Small, fast cover lookup for listings (avoids loading full book records). */
export async function getCoverUrl(id: string): Promise<string | null> {
  const cached = coverCache.get(id)
  if (cached !== undefined) return cached
  const cover = await idb.get<{ url: string; mime: string }>(COVER_PREFIX + id)
  if (!cover || !cover.url) return null
  coverCache.set(id, cover.url)
  return cover.url
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function sortNewestFirst(list: BookSummary[]): BookSummary[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function readIndex(): BookSummary[] {
  const index = kv.get<BookSummary[]>(INDEX_KEY)
  return Array.isArray(index) ? index : []
}

function writeIndex(index: BookSummary[]): void {
  kv.set(INDEX_KEY, index)
}

function toSummary(book: Book): BookSummary {
  return {
    id: book.id,
    title: book.title,
    description: book.description,
    category: book.category,
    author: book.author,
    pageCount: book.pages.length,
    featured: book.featured,
    published: book.published,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  }
}

async function rebuildIndexIfMissing(): Promise<void> {
  if (readIndex().length > 0) return
  const keys = await idb.keys(RECORD_PREFIX)
  const books: Book[] = []
  for (const key of keys) {
    const book = await idb.get<Book>(key)
    if (book) books.push(book)
  }
  writeIndex(books.map(toSummary))
}

function uniqueSlug(base: string, index: BookSummary[], excludeId?: string): string {
  const seen = new Set(index.map((b) => b.id).filter((id) => id !== excludeId))
  let slug = base || 'book'
  let n = 2
  while (seen.has(slug)) {
    slug = `${base || 'book'}-${n}`
    n += 1
  }
  return slug
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export async function listBooks(): Promise<BookSummary[]> {
  await rebuildIndexIfMissing()
  return sortNewestFirst(readIndex())
}

export async function listPublishedBooks(): Promise<BookSummary[]> {
  const all = await listBooks()
  return all.filter((b) => b.published)
}

export async function getBook(id: string): Promise<Book | null> {
  const book = await idb.get<Book>(RECORD_PREFIX + id)
  return book && typeof book.id === 'string' ? book : null
}

export async function createBook(input: BookDraft): Promise<Book> {
  const index = readIndex()
  const now = new Date().toISOString()
  const book: Book = {
    id: uniqueSlug(slugify(input.title), index),
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim() || undefined,
    author: input.author.trim() || undefined,
    cover: input.cover ?? { url: '', mime: 'image/png' },
    pages: [...input.pages].sort((a, b) => a.pageNumber - b.pageNumber),
    featured: input.featured,
    published: input.published,
    createdAt: now,
    updatedAt: now,
  }
  await idb.set(RECORD_PREFIX + book.id, book)
  await writeCoverRecord(book)
  writeIndex([toSummary(book), ...index])
  return book
}

export async function updateBook(id: string, input: BookDraft): Promise<Book> {
  const existing = await getBook(id)
  if (!existing) throw new Error('Book not found')
  const book: Book = {
    ...existing,
    title: input.title.trim() || existing.title,
    description: input.description.trim(),
    category: input.category.trim() || undefined,
    author: input.author.trim() || undefined,
    cover: input.cover ?? existing.cover,
    pages: [...input.pages].sort((a, b) => a.pageNumber - b.pageNumber),
    featured: input.featured,
    published: input.published,
    updatedAt: new Date().toISOString(),
  }
  await idb.set(RECORD_PREFIX + id, book)
  await writeCoverRecord(book)
  const index = readIndex().filter((b) => b.id !== id)
  writeIndex([toSummary(book), ...index])
  return book
}

export async function deleteBook(id: string): Promise<void> {
  await idb.remove(RECORD_PREFIX + id)
  coverCache.delete(id)
  await idb.remove(COVER_PREFIX + id)
  writeIndex(readIndex().filter((b) => b.id !== id))
}

export async function setBookFeatured(id: string, featured: boolean): Promise<Book> {
  const book = await getBook(id)
  if (!book) throw new Error('Book not found')
  const updated = await updateBook(id, {
    title: book.title,
    description: book.description,
    category: book.category ?? '',
    author: book.author ?? '',
    cover: book.cover,
    pages: book.pages,
    featured,
    published: book.published,
  })
  return updated
}

export async function setBookPublished(id: string, published: boolean): Promise<Book> {
  const book = await getBook(id)
  if (!book) throw new Error('Book not found')
  const updated = await updateBook(id, {
    title: book.title,
    description: book.description,
    category: book.category ?? '',
    author: book.author ?? '',
    cover: book.cover,
    pages: book.pages,
    featured: book.featured,
    published,
  })
  return updated
}

export async function replaceCover(id: string, cover: BookCoverAsset): Promise<void> {
  const book = await getBook(id)
  if (!book) throw new Error('Book not found')
  book.cover = cover
  book.updatedAt = new Date().toISOString()
  await idb.set(RECORD_PREFIX + id, book)
  await writeCoverRecord(book)
}

/** Internal helper used by seeding so sample books keep stable publication dates. */
export async function setBookCreatedAt(id: string, createdAt: string): Promise<void> {
  const book = await getBook(id)
  if (!book) return
  book.createdAt = createdAt
  book.updatedAt = createdAt
  await idb.set(RECORD_PREFIX + id, book)
  await writeCoverRecord(book)
  const index = readIndex()
  const idx = index.findIndex((b) => b.id === id)
  if (idx >= 0) {
    index[idx] = { ...index[idx], createdAt, updatedAt: createdAt }
    writeIndex(index)
  }
}

export type { Book, BookCoverAsset, BookPageAsset, BookDraft }
