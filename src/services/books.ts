import type { Book, BookCoverAsset, BookDraft, BookPageAsset, BookSummary } from './types'
import { idb, kv } from './storage'
import { slugify } from '@/lib/utils'
import { storageMode } from './mode'
import * as remote from './remote/books'

const INDEX_KEY = 'books:index'
const RECORD_PREFIX = 'book:'
const COVER_PREFIX = 'cover:'

const coverCache = new Map<string, string>()

/* ------------------------------------------------------------------ */
/* Local (IndexedDB + localStorage) implementation                     */
/* ------------------------------------------------------------------ */

async function writeCoverRecord(book: Book): Promise<void> {
  coverCache.set(book.id, book.cover.url)
  await idb.set(COVER_PREFIX + book.id, { url: book.cover.url, mime: book.cover.mime })
}

/** Small, fast cover lookup for listings (avoids loading full book records). */
export async function localGetCoverUrl(id: string): Promise<string | null> {
  const cached = coverCache.get(id)
  if (cached !== undefined) return cached
  const cover = await idb.get<{ url: string; mime: string }>(COVER_PREFIX + id)
  if (!cover || !cover.url) return null
  coverCache.set(id, cover.url)
  return cover.url
}

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

async function localListBooks(): Promise<BookSummary[]> {
  await rebuildIndexIfMissing()
  return sortNewestFirst(readIndex())
}

async function localGetBook(id: string): Promise<Book | null> {
  const book = await idb.get<Book>(RECORD_PREFIX + id)
  return book && typeof book.id === 'string' ? book : null
}

async function localCreateBook(input: BookDraft): Promise<Book> {
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

async function localUpdateBook(id: string, input: BookDraft): Promise<Book> {
  const existing = await localGetBook(id)
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

async function localDeleteBook(id: string): Promise<void> {
  await idb.remove(RECORD_PREFIX + id)
  coverCache.delete(id)
  await idb.remove(COVER_PREFIX + id)
  writeIndex(readIndex().filter((b) => b.id !== id))
}

async function localSetBookFeatured(id: string, featured: boolean): Promise<Book> {
  const book = await localGetBook(id)
  if (!book) throw new Error('Book not found')
  return localUpdateBook(id, {
    title: book.title,
    description: book.description,
    category: book.category ?? '',
    author: book.author ?? '',
    cover: book.cover,
    pages: book.pages,
    featured,
    published: book.published,
  })
}

async function localSetBookPublished(id: string, published: boolean): Promise<Book> {
  const book = await localGetBook(id)
  if (!book) throw new Error('Book not found')
  return localUpdateBook(id, {
    title: book.title,
    description: book.description,
    category: book.category ?? '',
    author: book.author ?? '',
    cover: book.cover,
    pages: book.pages,
    featured: book.featured,
    published,
  })
}

/** Internal helper used by seeding so sample books keep stable publication dates. */
export async function setBookCreatedAt(id: string, createdAt: string): Promise<void> {
  const book = await localGetBook(id)
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

/* ------------------------------------------------------------------ */
/* Public API — dispatches to remote (R2 + D1) or local storage        */
/* ------------------------------------------------------------------ */

export async function listBooks(): Promise<BookSummary[]> {
  return storageMode() === 'remote' ? remote.remoteListBooks() : localListBooks()
}

export async function listPublishedBooks(): Promise<BookSummary[]> {
  const all = await listBooks()
  return all.filter((b) => b.published)
}

export async function getBook(id: string): Promise<Book | null> {
  return storageMode() === 'remote' ? remote.remoteGetBook(id) : localGetBook(id)
}

export async function getCoverUrl(id: string): Promise<string | null> {
  if (storageMode() === 'remote') return remote.remoteGetCoverUrl(id)
  return localGetCoverUrl(id)
}

export async function createBook(input: BookDraft): Promise<Book> {
  return storageMode() === 'remote' ? remote.remoteCreateBook(input) : localCreateBook(input)
}

export async function updateBook(id: string, input: BookDraft): Promise<Book> {
  return storageMode() === 'remote' ? remote.remoteUpdateBook(id, input) : localUpdateBook(id, input)
}

export async function deleteBook(id: string): Promise<void> {
  if (storageMode() === 'remote') return remote.remoteDeleteBook(id)
  return localDeleteBook(id)
}

export async function setBookFeatured(id: string, featured: boolean): Promise<Book> {
  return storageMode() === 'remote' ? remote.remoteSetBookFeatured(id, featured) : localSetBookFeatured(id, featured)
}

export async function setBookPublished(id: string, published: boolean): Promise<Book> {
  return storageMode() === 'remote' ? remote.remoteSetBookPublished(id, published) : localSetBookPublished(id, published)
}

export type { Book, BookCoverAsset, BookPageAsset, BookDraft }
