import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const list: (number | "…")[] = [];
  let prev = 0;
  for (const p of [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)) {
    if (p - prev > 1) list.push("…");
    list.push(p);
    prev = p;
  }
  return list;
}

export function Pagination({
  basePath,
  currentPage,
  totalPages,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const href = (page: number) =>
    page === 1 ? basePath : `${basePath}?page=${page}`;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      <Link
        href={href(currentPage - 1)}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
          currentPage === 1
            ? "pointer-events-none text-ink-faint/40"
            : "text-ink-soft hover:bg-ink/5 hover:text-ink"
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft size={18} strokeWidth={2.5} aria-hidden />
      </Link>

      {pageList(currentPage, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-sm text-ink-faint">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-bold transition-colors ${
              p === currentPage
                ? "bg-ink text-white shadow-soft"
                : "text-ink-soft hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={href(currentPage + 1)}
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : undefined}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
          currentPage === totalPages
            ? "pointer-events-none text-ink-faint/40"
            : "text-ink-soft hover:bg-ink/5 hover:text-ink"
        }`}
        aria-label="Next page"
      >
        <ChevronRight size={18} strokeWidth={2.5} aria-hidden />
      </Link>
    </nav>
  );
}
