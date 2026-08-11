import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";

export interface BookCardData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  author: string | null;
  coverThumb: string | null;
  cover: string | null;
  pageCount: number;
  topFeature: boolean;
}

export function BookCard({
  book,
  priority = false,
}: {
  book: BookCardData;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/book/${book.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/5 bg-paper shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
      aria-label={`Read ${book.title}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-cream-deep">
        {book.coverThumb || book.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverThumb ?? book.cover!}
            alt={`Cover of ${book.title}`}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-faint">
            No cover
          </div>
        )}

        {book.topFeature && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-sun px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink shadow-soft">
            <Sparkles size={12} strokeWidth={2.5} aria-hidden />
            Top Feature
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/45 to-transparent p-3 pt-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-ink shadow-soft">
            <BookOpen size={15} strokeWidth={2.4} aria-hidden />
            Read Book
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-display text-base font-semibold leading-snug text-ink line-clamp-2">
          {book.title}
        </h3>
        {book.author && (
          <p className="text-xs font-semibold text-ink-faint">
            {book.author}
          </p>
        )}
        {book.description && (
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft line-clamp-2">
            {book.description}
          </p>
        )}
        <p className="mt-auto pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          {book.pageCount} pages
        </p>
      </div>
    </Link>
  );
}
