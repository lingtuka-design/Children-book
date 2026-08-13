import { assetUrl, bootstrapOpen, deleteAssetsWithPrefix, isAssetUrl, isAuthed, json } from '../_lib'
import type { Env } from '../_lib'

interface BookRecord {
  id: string
  title: string
  description: string
  category?: string
  author?: string
  cover: { url: string; mime: string }
  pages: Array<{ pageNumber: number; url: string; mime: string }>
  featured: boolean
  published: boolean
  createdAt: string
  updatedAt: string
  ogUrl?: string
}

interface BookDraft extends Omit<BookRecord, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string
}

function toSummary(book: BookRecord) {
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
    coverUrl: book.cover.url,
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id

  if (rawId) {
    const row = await env.DB.prepare('SELECT data FROM books WHERE id = ?').bind(rawId).first<{ data: string }>()
    if (!row) return json({ error: 'Book not found' }, 404)
    return json({ book: JSON.parse(row.data) as BookRecord })
  }

  const rows = await env.DB.prepare('SELECT data FROM books ORDER BY created_at DESC').all<{ data: string }>()
  const books = (rows.results ?? []).map((r) => JSON.parse(r.data) as BookRecord)
  return json({ books: books.map(toSummary) })
}

/**
 * Upsert a book (create or update). Assets must already be uploaded to R2.
 * Create is allowed without the admin digest only while the database is
 * unseeded (first-visit bootstrap); every other write requires auth.
 */
export const onRequestPost: PagesFunction<Env> = async ({ env, request, params }) => {
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id
  const isUpdate = Boolean(rawId)

  if (!isAuthed(request)) {
    if (isUpdate) return json({ error: 'Unauthorized' }, 401)
    if (!(await bootstrapOpen(env))) return json({ error: 'Unauthorized' }, 401)
  }

  let draft: BookDraft
  try {
    draft = (await request.json()) as BookDraft
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!draft.title || typeof draft.title !== 'string' || draft.title.trim().length === 0) {
    return json({ error: 'Title is required' }, 400)
  }
  if (!draft.cover || !isAssetUrl(draft.cover.url)) {
    return json({ error: 'Cover must be uploaded to the asset store first' }, 400)
  }
  if (!Array.isArray(draft.pages) || draft.pages.some((p) => !isAssetUrl(p.url))) {
    return json({ error: 'Pages must be uploaded to the asset store first' }, 400)
  }

  const now = new Date().toISOString()
  const requestedId = typeof draft.id === 'string' && /^[a-z0-9-]{1,60}$/.test(draft.id) ? draft.id : undefined
  const book: BookRecord = {
    id: rawId ?? requestedId ?? slugify(draft.title),
    title: draft.title.trim(),
    description: (draft.description ?? '').trim(),
    category: draft.category?.trim() || undefined,
    author: draft.author?.trim() || undefined,
    cover: draft.cover,
    pages: [...draft.pages].sort((a, b) => a.pageNumber - b.pageNumber),
    featured: Boolean(draft.featured),
    published: Boolean(draft.published),
    ogUrl: typeof draft.ogUrl === 'string' ? draft.ogUrl : undefined,
    createdAt: now,
    updatedAt: now,
  }

  if (isUpdate) {
    const existing = await env.DB.prepare('SELECT data FROM books WHERE id = ?').bind(book.id).first<{ data: string }>()
    if (existing) {
      const prev = JSON.parse(existing.data) as BookRecord
      book.createdAt = prev.createdAt
    }
  }

  await env.DB.prepare(
    'INSERT INTO books (id, data, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
  )
    .bind(book.id, JSON.stringify(book), book.createdAt, book.updatedAt)
    .run()

  return json({ book })
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, request, params }) => {
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id
  if (!rawId) return json({ error: 'Missing book id' }, 400)
  if (!isAuthed(request)) return json({ error: 'Unauthorized' }, 401)

  await env.DB.prepare('DELETE FROM books WHERE id = ?').bind(rawId).run()
  await deleteAssetsWithPrefix(env, `books/${rawId}/`)
  return json({ ok: true })
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'book'
  )
}
