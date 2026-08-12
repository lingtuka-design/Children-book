import { useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  CheckCircle2,
  Eye,
  ImagePlus,
  Loader2,
  Save,
  Send,
  Star,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, ErrorBanner } from '@/components/ui/Fields'
import { FileUpload } from '@/components/ui/FileUpload'
import { Modal } from '@/components/ui/Modal'
import { BookReader } from '@/components/reader/BookReader'
import { ACCEPTED_BOOK_TYPES } from '@/lib/constants'
import { missingPages, processCoverFile, processPageFiles } from '@/lib/pages'
import { buildReaderPages, type Book, type BookCoverAsset, type BookPageAsset } from '@/services/types'
import * as bookService from '@/services/books'
import { cn } from '@/lib/utils'

interface BookEditorProps {
  initialBook?: Book
}

interface Draft {
  title: string
  description: string
  category: string
  author: string
  cover: BookCoverAsset | null
  pages: BookPageAsset[]
  featured: boolean
  published: boolean
}

export function BookEditor({ initialBook }: BookEditorProps) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Draft>({
    title: initialBook?.title ?? '',
    description: initialBook?.description ?? '',
    category: initialBook?.category ?? '',
    author: initialBook?.author ?? '',
    cover: initialBook?.cover ?? null,
    pages: initialBook ? [...initialBook.pages].sort((a, b) => a.pageNumber - b.pageNumber) : [],
    featured: initialBook?.featured ?? false,
    published: initialBook?.published ?? false,
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [processingPages, setProcessingPages] = useState(false)
  const [processingCover, setProcessingCover] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const replaceRef = useRef<HTMLInputElement>(null)
  const [replaceTarget, setReplaceTarget] = useState<number | null>(null)

  const missing = useMemo(() => missingPages(draft.pages), [draft.pages])
  const complete = missing.length === 0

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    if (key === 'title') setFieldErrors((e) => ({ ...e, title: undefined }))
  }

  async function handlePageFiles(files: File[]) {
    setProcessingPages(true)
    setUploadErrors([])
    const result = await processPageFiles(files, draft.pages)
    setUploadErrors(result.errors)
    setDraft((d) => ({ ...d, pages: result.pages }))
    setProcessingPages(false)
  }

  async function handleCoverFile(files: File[]) {
    const file = files[0]
    if (!file) return
    setProcessingCover(true)
    setUploadErrors([])
    try {
      const cover = await processCoverFile(file)
      setDraft((d) => ({ ...d, cover }))
    } catch (err) {
      setUploadErrors([err instanceof Error ? err.message : 'Could not process cover'])
    } finally {
      setProcessingCover(false)
    }
  }

  function removePage(num: number) {
    setDraft((d) => ({ ...d, pages: d.pages.filter((p) => p.pageNumber !== num) }))
  }

  async function handleReplace(file: File) {
    if (replaceTarget === null) return
    const result = await processPageFiles([file], draft.pages.filter((p) => p.pageNumber !== replaceTarget))
    setUploadErrors(result.errors)
    setDraft((d) => ({ ...d, pages: result.pages }))
    setReplaceTarget(null)
  }

  async function save(publish: boolean) {
    if (!draft.title.trim()) {
      setFieldErrors((e) => ({ ...e, title: 'Title is required' }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (publish && !draft.cover) {
      setFieldErrors((e) => ({ ...e, cover: 'A cover is required before publishing' }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (publish && !complete) {
      setFieldErrors((e) => ({ ...e, pages: 'All 24 pages are required before publishing' }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      const input = {
        title: draft.title,
        description: draft.description,
        category: draft.category,
        author: draft.author,
        cover: draft.cover,
        pages: draft.pages,
        featured: draft.featured,
        published: publish,
      }
      if (initialBook) {
        await bookService.updateBook(initialBook.id, input)
      } else {
        await bookService.createBook(input)
      }
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
      if (publish) {
        window.setTimeout(() => void navigate({ to: '/admin/books' }), 700)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save the book')
    } finally {
      setSaving(false)
    }
  }

  const previewBook: Book = {
    id: initialBook?.id ?? 'preview',
    title: draft.title || 'Untitled book',
    description: draft.description,
    category: draft.category || undefined,
    author: draft.author || undefined,
    cover: draft.cover ?? { url: '', mime: 'image/png' },
    pages: draft.pages,
    featured: draft.featured,
    published: draft.published,
    createdAt: initialBook?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const readerPages = buildReaderPages(previewBook)

  return (
    <div className="space-y-8">
      {saveError && <ErrorBanner message={saveError} />}

      {/* Details */}
      <section className="rounded-3xl border border-paper-200 bg-white p-6 shadow-card">
        <h2 className="font-display text-xl font-semibold">Book details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Input
            label="Book title"
            required
            value={draft.title}
            error={fieldErrors.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Vena and Her Friend T-Rex"
            className="sm:col-span-2"
          />
          <Input
            label="Category"
            value={draft.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="e.g. Adventure"
          />
          <Input
            label="Author / creator"
            value={draft.author}
            onChange={(e) => set('author', e.target.value)}
            placeholder="e.g. Wonder Pages Studio"
          />
          <Textarea
            label="Short description"
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="A one or two sentence summary shown on the book card."
            className="sm:col-span-2"
            rows={3}
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-6">
          <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-bold text-ink-700">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) => set('featured', e.target.checked)}
              className="size-4.5 accent-coral-500"
            />
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 text-sun-500" aria-hidden="true" />
              Top Feature — appears first in the Latest section
            </span>
          </label>
        </div>
      </section>

      {/* Cover */}
      <section className="rounded-3xl border border-paper-200 bg-white p-6 shadow-card">
        <h2 className="font-display text-xl font-semibold">
          Front cover <span className="text-sm font-semibold text-ink-500">(separate from the 26 reader pages · 3:4)</span>
        </h2>
        <div className="mt-5 flex flex-wrap items-start gap-6">
          {draft.cover ? (
            <div className="relative">
              <img
                src={draft.cover.url}
                alt="Cover preview"
                className="aspect-[3/4] w-44 rounded-2xl border border-paper-200 object-cover shadow-md"
              />
              <button
                type="button"
                onClick={() => set('cover', null)}
                aria-label="Remove cover"
                className="absolute -right-2.5 -top-2.5 grid size-8 place-items-center rounded-full bg-ink-900/70 text-white backdrop-blur hover:bg-ink-900"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className={cn('w-full max-w-md', fieldErrors.cover && 'opacity-90')}>
              <FileUpload
                accept={ACCEPTED_BOOK_TYPES.join(',')}
                label="Upload front cover"
                hint="PNG, JPG/JPEG or PDF (PDFs are converted to an image automatically)"
                disabled={processingCover}
                error={fieldErrors.cover}
                onFiles={(f) => void handleCoverFile(f)}
                icon={
                  processingCover ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <ImagePlus className="size-6" />
                  )
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* Pages */}
      <section className="rounded-3xl border border-paper-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">
            Interior pages <span className="text-sm font-semibold text-ink-500">(24 pages · 4:3)</span>
          </h2>
          <p
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-extrabold',
              complete ? 'bg-leaf-100 text-leaf-700' : 'bg-sun-100 text-amber-700',
            )}
            role="status"
          >
            {complete ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4" /> {draft.pages.length}/24 pages uploaded ✓
              </span>
            ) : (
              `${draft.pages.length}/24 pages uploaded`
            )}
          </p>
        </div>

        <div className="mt-2">
          <FileUpload
            accept={ACCEPTED_BOOK_TYPES.join(',')}
            multiple
            label="Select all page files at once"
            hint="Name files page-01.jpg … page-24.jpg (or any number you like) — pages are sorted automatically. PDF files expand to one page each."
            disabled={processingPages}
            error={fieldErrors.pages}
            onFiles={(f) => void handlePageFiles(f)}
            icon={processingPages ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}
          />
        </div>

        {missing.length > 0 && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
            Missing pages: {missing.join(', ')}
          </p>
        )}
        {uploadErrors.length > 0 && (
          <ul role="alert" className="mt-3 space-y-1 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
        {!complete && draft.pages.length > 0 && (
          <p className="mt-3 text-xs text-ink-500">
            Page 0 and page 25 (blank inside covers) are added automatically — no need to upload them. A book can&rsquo;t
            be published until pages 1–24 are all present.
          </p>
        )}

        {draft.pages.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold text-ink-700">Uploaded pages — sorted by page number</h3>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {draft.pages.map((page) => (
                <div key={page.pageNumber} className="group relative">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-paper-200 bg-paper-100 shadow-sm">
                    <img src={page.url} alt={`Page ${page.pageNumber}`} className="h-full w-full object-cover" loading="lazy" />
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-ink-900/70 px-1.5 py-0.5 text-[11px] font-extrabold text-white">
                      {page.pageNumber}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-900/0 opacity-0 transition-all group-hover:bg-ink-900/40 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setReplaceTarget(page.pageNumber)}
                        aria-label={`Replace page ${page.pageNumber}`}
                        title="Replace"
                        className="grid size-8 place-items-center rounded-full bg-white/90 text-ink-900 hover:bg-white"
                      >
                        <ImagePlus className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePage(page.pageNumber)}
                        aria-label={`Remove page ${page.pageNumber}`}
                        title="Remove"
                        className="grid size-8 place-items-center rounded-full bg-white/90 text-red-600 hover:bg-white"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-center text-xs font-bold text-ink-500">Page {page.pageNumber}</p>
                </div>
              ))}
            </div>
            <input
              ref={replaceRef}
              type="file"
              accept={ACCEPTED_BOOK_TYPES.join(',')}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void handleReplace(f)
              }}
            />
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-paper-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" icon={<Eye className="size-4" />} onClick={() => setPreviewOpen(true)}>
            Preview book
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-leaf-700">
              <CheckCircle2 className="size-4" /> Saved
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" loading={saving} onClick={() => void save(false)}>
            <Save className="size-4" /> Save draft
          </Button>
          <Button
            loading={saving}
            disabled={!draft.title.trim()}
            onClick={() => void save(true)}
            title={complete && draft.cover ? 'Publish' : 'All 24 pages and a cover are required to publish'}
          >
            <Send className="size-4" /> {initialBook?.published ? 'Save & publish' : 'Publish book'}
          </Button>
        </div>
      </section>

      {/* Preview modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview — same reader as the website" size="xl">
        <BookReader pages={readerPages} />
      </Modal>
    </div>
  )
}
