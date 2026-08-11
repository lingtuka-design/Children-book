import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink/5 bg-cream-deep/60">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral text-white">
                <BookOpenText size={16} strokeWidth={2.2} />
              </span>
              <span className="font-display text-base font-semibold text-ink">
                Tiny Tales<span className="text-coral"> Studio</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {SITE.tagline} Beautiful picture books to read online, and fully
              personalized stories starring your own child.
            </p>
          </div>
          <div className="flex gap-16">
            <nav aria-label="Footer">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-faint">
                Explore
              </h3>
              <ul className="mt-3 space-y-2 text-sm font-medium text-ink-soft">
                <li>
                  <Link href="/" className="hover:text-coral-deep">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/books" className="hover:text-coral-deep">
                    All Books
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Footer services">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-faint">
                Order
              </h3>
              <ul className="mt-3 space-y-2 text-sm font-medium text-ink-soft">
                <li>
                  <Link href="/order" className="hover:text-coral-deep">
                    Order a Custom Book
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="mt-10 border-t border-ink/5 pt-5 text-xs text-ink-faint">
          © {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
