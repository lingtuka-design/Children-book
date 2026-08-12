import { useState, type FormEvent } from 'react'
import { useNavigate, createFileRoute } from '@tanstack/react-router'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { AdminLoginShell } from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { usePageMeta } from '@/lib/seo'
import { auth } from '@/services/auth'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/login')({ component: AdminLoginRoute })

function AdminLoginRoute() {
  usePageMeta({ title: 'Admin Login' })
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const result = await auth.login(username, password)
      if (result.ok) {
        void navigate({ to: '/admin' })
      } else {
        setError(result.reason ?? 'Invalid credentials')
        setPassword('')
      }
    } catch {
      setError('Login is unavailable in this browser')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLoginShell>
      <form
        onSubmit={handleSubmit}
        className="animate-pop space-y-5 rounded-3xl border border-paper-200 bg-white p-8 shadow-card"
      >
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-coral-500 text-white shadow-md">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="heading-display mt-4 text-2xl">Sign in to the console</h1>
          <p className="mt-1 text-sm text-ink-500">Authorised studio staff only.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-sm font-bold text-ink-700">
            Username
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500/60" aria-hidden="true" />
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-xl border border-paper-300 bg-white py-2.5 pl-10 pr-4 text-ink-900 focus:border-coral-400 focus:outline-none focus:ring-4 focus:ring-coral-100"
              placeholder="Username"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-bold text-ink-700">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500/60" aria-hidden="true" />
            <input
              id="password"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-paper-300 bg-white py-2.5 pl-10 pr-12 text-ink-900 focus:border-coral-400 focus:outline-none focus:ring-4 focus:ring-coral-100"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-500 hover:bg-paper-100"
            >
              {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
            </button>
          </div>
        </div>

        <div aria-live="polite">
          {error && (
            <p
              role="alert"
              className={cn('rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700')}
            >
              {error}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Login
        </Button>
      </form>
    </AdminLoginShell>
  )
}
