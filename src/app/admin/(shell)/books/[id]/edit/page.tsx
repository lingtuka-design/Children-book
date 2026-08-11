"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { api, errorMessage } from "@/lib/admin-client";

interface BookData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  author: string | null;
  illustrator: string | null;
  year: string | null;
  tags: string | null;
  cover: string;
  pageCount: number;
  published: boolean;
  topFeature: boolean;
}

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<BookData | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    author: "",
    illustrator: "",
    year: "",
    tags: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ book: BookData }>(`/api/admin/books/${id}`).then((d) => {
      setBook(d.book);
      setForm({
        title: d.book.title,
        description: d.book.description ?? "",
        author: d.book.author ?? "",
        illustrator: d.book.illustrator ?? "",
        year: d.book.year ?? "",
        tags: d.book.tags ?? "",
      });
    }).catch((e) => setError(errorMessage(e)));
  }, [id]);

  const save = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api(`/api/admin/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setNotice("Book updated.");
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink shadow-sm placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25";

  if (error && !book) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/books"
          className="inline-flex items-center gap-1 text-xs font-bold text-ink-faint hover:text-ink"
        >
          <ArrowLeft size={13} strokeWidth={2.5} aria-hidden />
          Back to books
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Edit Book</h1>
      </div>

      {!book ? (
        <div className="flex items-center justify-center py-20 text-ink-faint">
          <Loader2 size={22} className="animate-spin" aria-hidden />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-5 rounded-2xl border border-ink/5 bg-white p-5 shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={book.cover}
              alt=""
              className="h-28 w-21 shrink-0 rounded-lg object-cover shadow-soft"
              style={{ width: 84 }}
            />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-ink">{book.title}</p>
              <p className="text-xs font-semibold text-ink-faint">/{book.slug}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-bold text-ink">
                  {book.pageCount} pages
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${book.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {book.published ? "Published" : "Draft"}
                </span>
                {book.topFeature && (
                  <span className="rounded-full bg-sun-soft px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                    Top Feature
                  </span>
                )}
              </div>
              <Link
                href={`/book/${book.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-bold text-teal-deep underline"
              >
                Preview book →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-card">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="text-sm font-bold text-ink">Title</label>
                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>
              <div>
                <label htmlFor="description" className="text-sm font-bold text-ink">Description</label>
                <textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="author" className="text-sm font-bold text-ink">Author</label>
                  <input
                    id="author"
                    type="text"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className={`mt-1.5 ${inputCls}`}
                  />
                </div>
                <div>
                  <label htmlFor="illustrator" className="text-sm font-bold text-ink">Illustrator</label>
                  <input
                    id="illustrator"
                    type="text"
                    value={form.illustrator}
                    onChange={(e) => setForm({ ...form, illustrator: e.target.value })}
                    className={`mt-1.5 ${inputCls}`}
                  />
                </div>
                <div>
                  <label htmlFor="year" className="text-sm font-bold text-ink">Year</label>
                  <input
                    id="year"
                    type="text"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className={`mt-1.5 ${inputCls}`}
                  />
                </div>
                <div>
                  <label htmlFor="tags" className="text-sm font-bold text-ink">Tags</label>
                  <input
                    id="tags"
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className={`mt-1.5 ${inputCls}`}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-coral-soft px-4 py-3 text-xs font-semibold text-coral-deep">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                {notice}
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden />
                ) : (
                  <Save size={15} strokeWidth={2.3} aria-hidden />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
