import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { BookOpen, ClipboardList, LayoutDashboard, LogOut, Palette, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { auth } from '@/services/auth'
import { Logo } from './PublicLayout'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/books', label: 'Books', icon: BookOpen },
  { to: '/admin/styles', label: 'Styles', icon: Palette },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
] as const

type NavItem = (typeof navItems)[number]

function isActive(item: NavItem, pathname: string): boolean {
  if ('exact' in item && item.exact) return pathname === item.to
  return pathname.startsWith(item.to)
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-paper-100/60">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-paper-200 bg-paper-50 lg:w-60">
        <div className="flex h-16 items-center justify-center border-b border-paper-200">
          <Link to="/admin" aria-label="Admin home">
            <span className="hidden lg:block"><Logo /></span>
            <span className="grid size-10 place-items-center rounded-xl bg-coral-500 text-paper-50 lg:hidden">
              <ShieldCheck className="size-5" />
            </span>
          </Link>
        </div>
        <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 p-2 lg:p-3">
          {navItems.map((item) => {
            const active = isActive(item, location.pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors',
                  'justify-center lg:justify-start',
                  active ? 'bg-coral-500 text-white shadow-md' : 'text-ink-700 hover:bg-paper-100',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon className="size-5 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="flex flex-col gap-1 border-t border-paper-200 p-2 lg:p-3">
          <Link
            to="/"
            className="flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-700 hover:bg-paper-100 lg:justify-start"
          >
            <span aria-hidden="true">→</span>
            <span className="hidden lg:inline">View website</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              auth.logout()
              void router.navigate({ to: '/admin/login' })
            }}
            className="flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 lg:justify-start"
          >
            <LogOut className="size-5 shrink-0" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>
      <main className="ml-16 flex-1 lg:ml-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  )
}

export function AdminLoginShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-50 px-4">
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="size-8 text-coral-500" aria-hidden="true" />
        <span className="heading-display text-2xl">Admin</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
