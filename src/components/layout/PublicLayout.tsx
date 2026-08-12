import { Link } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import type { ReactNode } from 'react'

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-10 place-items-center rounded-2xl bg-coral-500 text-paper-50 shadow-[0_6px_14px_-6px_rgba(197,84,47,0.7)]">
        <BookOpen className="size-5" />
      </span>
      <span className={dark ? 'font-display text-xl font-bold text-paper-50' : 'font-display text-xl font-bold text-ink-900'}>
        {APP_NAME}
      </span>
    </span>
  )
}

const navLink =
  'rounded-xl px-3.5 py-2 text-sm font-bold text-ink-700 transition-colors hover:bg-paper-100 hover:text-ink-900'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-paper-200/80 bg-paper-50/85 backdrop-blur-md">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label={`${APP_NAME} home`}>
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <Link to="/" className={navLink} activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/books" className={navLink}>
            Books
          </Link>
          <Link
            to="/order"
            className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-coral-500 px-4 py-2 text-sm font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(197,84,47,0.7)] transition-all hover:-translate-y-0.5 hover:bg-coral-600"
          >
            Place Order
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-paper-200 bg-paper-100/60">
      <div className="container-site flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <Logo />
          <p className="mt-1.5 text-sm text-ink-500">
            A children&rsquo;s book portfolio &amp; custom storybook service.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col items-center gap-2 text-sm font-bold text-ink-700 sm:items-end">
          <Link to="/order" className="hover:text-coral-600">
            Order a custom book
          </Link>
          <Link to="/books" className="hover:text-coral-600">
            Browse the library
          </Link>
        </nav>
      </div>
      <div className="border-t border-paper-200 py-4 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} {APP_NAME}. Made with love for little readers.
      </div>
    </footer>
  )
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
