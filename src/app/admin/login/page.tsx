"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { BookOpenText, Loader2, Lock, User } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok && res.status !== 404) {
        setError(data?.error ?? "We couldn't sign you in. Please try again.");
        return;
      }
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      router.push("/admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-night via-night-deep to-[#120f1d] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral text-white shadow-lift">
            <BookOpenText size={26} strokeWidth={2.2} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-white">
            Tiny Tales Studio
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/40">
            Admin Console
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-8 rounded-3xl bg-white p-7 shadow-lift"
          noValidate
        >
          <div>
            <label
              htmlFor="username"
              className="flex items-center gap-1.5 text-sm font-bold text-ink"
            >
              <User size={14} strokeWidth={2.4} aria-hidden />
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-[15px] text-ink shadow-sm placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25"
              placeholder="admin"
            />
          </div>
          <div className="mt-4">
            <label
              htmlFor="password"
              className="flex items-center gap-1.5 text-sm font-bold text-ink"
            >
              <Lock size={14} strokeWidth={2.4} aria-hidden />
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-[15px] text-ink shadow-sm placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-coral-soft px-4 py-3 text-xs font-semibold text-coral-deep"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-white/45 transition-colors hover:text-white"
          >
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
