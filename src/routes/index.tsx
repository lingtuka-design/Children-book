import { Link } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, BookHeart, Sparkles, Users } from 'lucide-react'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { BookGrid } from '@/components/books/BookCard'
import { Pagination } from '@/components/books/Pagination'
import { CardSkeletonGrid } from '@/components/ui/Spinner'
import { ErrorBanner } from '@/components/ui/Fields'
import { useBooks } from '@/services/hooks'
import { usePageMeta } from '@/lib/seo'
import { HERO_MESSAGE, PAGE_SIZE } from '@/lib/constants'
import { useState } from 'react'

export const Route = createFileRoute('/')({ component: HomeRoute })

function HomeRoute() {
  usePageMeta({
    title: 'Custom Children\u2019s Books',
    description: HERO_MESSAGE,
  })
  const { data: books, loading, error, reload } = useBooks()
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil((books?.length ?? 0) / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visible = books?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) ?? []

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 80% at 20% 10%, rgb(250 224 211 / 0.7) 0%, transparent 60%), radial-gradient(50% 70% at 85% 20%, rgb(247 214 121 / 0.35) 0%, transparent 55%), radial-gradient(70% 80% at 50% 110%, rgb(226 239 231 / 0.6) 0%, transparent 60%)',
          }}
        />
        <div className="container-site relative py-16 text-center sm:py-24">
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-coral-100 bg-coral-50 px-4 py-1.5 text-sm font-bold text-coral-600">
            <Sparkles className="size-4" aria-hidden="true" />
            Hand-illustrated personalised storybooks
          </span>
          <h1 className="heading-display animate-fade-up mx-auto mt-6 max-w-3xl text-4xl leading-tight sm:text-5xl" style={{ animationDelay: '80ms' }}>
            {HERO_MESSAGE}
          </h1>
          <p className="animate-fade-up mx-auto mt-5 max-w-xl text-lg text-ink-500" style={{ animationDelay: '160ms' }}>
            Your child becomes the hero of their very own picture book â€” written, illustrated, and printed just for them.
          </p>
          <div className="animate-fade-up mt-9" style={{ animationDelay: '240ms' }}>
            <Link
              to="/order"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-coral-500 px-9 py-4 text-lg font-extrabold text-white shadow-[0_16px_36px_-12px_rgba(197,84,47,0.7)] transition-all hover:-translate-y-1 hover:bg-coral-600"
            >
              Place Order <ArrowRight className="size-5" />
            </Link>
          </div>
          <div className="animate-fade-up mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-bold text-ink-500" style={{ animationDelay: '320ms' }}>
            <span className="inline-flex items-center gap-2">
              <Users className="size-4 text-leaf-500" aria-hidden="true" /> No account needed
            </span>
            <span className="inline-flex items-center gap-2">
              <BookHeart className="size-4 text-sun-500" aria-hidden="true" /> 24 illustrated pages
            </span>
          </div>
        </div>
      </section>

      {/* Latest books */}
      <section className="container-site py-12" aria-labelledby="latest-heading">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="latest-heading" className="heading-display text-3xl">Latest Children&rsquo;s Books</h2>
            <p className="mt-1 text-ink-500">Fresh from the studio â€” tap a cover to read it page by page.</p>
          </div>
          <Link to="/books" className="inline-flex items-center gap-1.5 font-bold text-coral-600 hover:underline">
            Browse all books <ArrowRight className="size-4" />
          </Link>
        </div>

        {loading && <CardSkeletonGrid />}
        {error && <ErrorBanner message={error} onRetry={reload} />}
        {!loading && !error && books && books.length === 0 && (
          <p className="rounded-2xl bg-paper-100 px-6 py-12 text-center text-ink-500">
            Books are being illustrated â€” check back soon!
          </p>
        )}
        {visible.length > 0 && (
          <>
            <BookGrid books={visible} />
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </section>
    </PublicLayout>
  )
}
