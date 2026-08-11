"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpenText,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
    ShoppingBag,
  Upload,
  X,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    href: "/admin/books",
    label: "Books",
    icon: LibraryBig,
    section: "Books",
  },
  {
    href: "/admin/books/upload",
    label: "Upload Book",
    icon: Upload,
    section: "Books",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingBag,
    section: "Orders",
  },
];

export function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (item: (typeof nav)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const navItems = (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-white/12 text-white"
                : "text-white/65 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Icon size={17} strokeWidth={2.2} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-[#f6f3ec]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-night-deep p-4 lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-2 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral text-white">
            <BookOpenText size={18} strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold text-white">
              Tiny Tales
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-white/45">
              Admin Console
            </span>
          </span>
        </Link>

        <div className="mt-6 flex-1">{navItems}</div>

        <div className="mt-4 rounded-xl bg-white/6 p-3">
          <p className="truncate text-xs font-bold text-white">{username}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={13} strokeWidth={2.4} aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink/5 bg-[#f6f3ec]/90 px-4 backdrop-blur lg:hidden">
          <span className="font-display text-sm font-semibold text-ink">
            Admin Console
          </span>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle admin menu"
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </header>
        {open && (
          <div className="border-b border-ink/5 bg-night-deep p-3 lg:hidden">
            {navItems}
            <div className="mt-3 flex items-center justify-between border-t border-white/10 px-2 pt-3">
              <span className="text-xs font-bold text-white/70">{username}</span>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white"
              >
                <LogOut size={13} aria-hidden />
                Sign out
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
