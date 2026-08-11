"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText } from "lucide-react";
import { SITE } from "@/lib/site";

const links = [
  { href: "/", label: "Home" },
  { href: "/books", label: "Books" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label={`${SITE.name} — home`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral text-white shadow-soft transition-transform group-hover:-rotate-6">
            <BookOpenText size={19} strokeWidth={2.2} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Tiny Tales<span className="text-coral"> Studio</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-ink text-white"
                    : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/order"
            className="ml-1 rounded-full bg-coral px-4 py-2 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-coral-deep hover:shadow-lift sm:ml-2 sm:px-5"
          >
            Place Order
          </Link>
        </nav>
      </div>
    </header>
  );
}
