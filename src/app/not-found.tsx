import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sun-soft text-amber-600">
        <BookOpen size={30} strokeWidth={2} aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">
        Page not found
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        This page seems to have wandered off on its own adventure. Let&apos;s get
        you back to the stories.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex h-11 items-center justify-center rounded-full bg-coral px-7 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-coral-deep"
      >
        Back to home
      </Link>
    </div>
  );
}
