"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { api, errorMessage } from "@/lib/admin-client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { formatDate } from "@/lib/site";

interface BookRow {
  id: string;
  slug: string;
  title: string;
  coverThumb: string | null;
  pageCount: number;
  published: boolean;
  topFeature: boolean;
  featureOrder: number;
  displayOrder: number;
  createdAt: string;
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<BookRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ books: BookRow[] }>("/api/admin/books")
      .then((d) => setBooks(d.books))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  useEffect(load, [load]);

  const run = async (action: () => Promise<unknown>, id: string, success?: string) => {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (success) setNotice(success);
      await load();
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const togglePublish = (b: BookRow) =>
    run(
      () =>
        api(`/api/admin/books/${b.id}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !b.published }),
        }),
      b.id,
      b.published ? `"${b.title}" unpublished.` : `"${b.title}" published — it now appears in Latest.`
    );

  const toggleFeature = (b: BookRow) =>
    run(
      () =>
        api(`/api/admin/books/${b.id}/feature`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topFeature: !b.topFeature }),
        }),
      b.id,
      b.topFeature ? `"${b.title}" removed from Top Features.` : `"${b.title}" marked as Top Feature.`
    );

  const moveFeature = (b: BookRow, delta: -1 | 1) => {
    const features = books!.filter((x) => x.topFeature).sort((a, z) => a.featureOrder - z.featureOrder);
    const idx = features.findIndex((x) => x.id === b.id);
    const swap = features[idx + delta];
    if (!swap) return;
    return run(async () => {
      await api(`/api/admin/books/${b.id}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topFeature: true, featureOrder: swap.featureOrder }),
      });
      await api(`/api/admin/books/${swap.id}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topFeature: true, featureOrder: b.featureOrder }),
      });
    }, b.id, "Feature order updated.");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/admin/books/${deleteTarget.id}`, { method: "DELETE" });
      setNotice(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  if (error && !books) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Books</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            Manage your portfolio: publish, feature, reorder, and upload books.
          </p>
        </div>
        <Link
          href="/admin/books/upload"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-coral-deep"
        >
          <Upload size={15} strokeWidth={2.4} aria-hidden />
          Upload New Book
        </Link>
      </div>

      {notice && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      {!books ? (
        <div className="flex items-center justify-center py-24 text-ink-faint">
          <Loader2 size={22} className="animate-spin" aria-hidden />
          <span className="ml-2 text-sm font-semibold">Loading books…</span>
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white/60 px-6 py-16 text-center">
          <p className="text-base font-medium text-ink-soft">No books yet.</p>
          <p className="mt-1 text-sm text-ink-faint">
            Upload your first children&apos;s book to get started.
          </p>
          <Link
            href="/admin/books/upload"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white"
          >
            <Plus size={15} strokeWidth={2.5} aria-hidden />
            Upload a book
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/5 bg-white shadow-card">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-widest text-ink-faint">
                <th className="px-4 py-3.5">Book</th>
                <th className="px-3 py-3.5">Pages</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="px-3 py-3.5">Top Feature</th>
                <th className="px-3 py-3.5">Uploaded</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {books.map((b) => {
                const features = books.filter((x) => x.topFeature).sort((a, z) => a.featureOrder - z.featureOrder);
                const idx = features.findIndex((x) => x.id === b.id);
                const busy = busyId === b.id;
                return (
                  <tr key={b.id} className="align-middle transition-colors hover:bg-cream/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-14 w-11 shrink-0 overflow-hidden rounded-md bg-cream-deep">
                          {b.coverThumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.coverThumb} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-56 truncate font-bold text-ink">{b.title}</p>
                          <p className="text-xs font-semibold text-ink-faint">/{b.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink-soft">{b.pageCount}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => togglePublish(b)}
                        disabled={busy}
                        title={b.published ? "Click to unpublish" : "Click to publish"}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 transition-opacity disabled:opacity-50 ${
                          b.published
                            ? "bg-emerald-100 text-emerald-700 ring-emerald-200 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-500 ring-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {b.published ? "Published" : "Draft"}
                        {busy && <Loader2 size={10} className="animate-spin" aria-hidden />}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleFeature(b)}
                          disabled={busy}
                          title={b.topFeature ? "Remove Top Feature" : "Mark as Top Feature"}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 transition-opacity disabled:opacity-50 ${
                            b.topFeature
                              ? "bg-sun-soft text-amber-700 ring-amber-200 hover:bg-amber-100"
                              : "bg-white text-ink-faint ring-ink/10 hover:bg-sun-soft hover:text-amber-700 hover:ring-amber-200"
                          }`}
                        >
                          <Sparkles size={11} strokeWidth={2.4} aria-hidden />
                          {b.topFeature ? "Feature" : "Add"}
                        </button>
                        {b.topFeature && (
                          <span className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveFeature(b, -1)}
                              disabled={idx <= 0 || busy}
                              aria-label="Move feature up"
                              className="rounded-md p-1 text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                            >
                              <ArrowUp size={13} strokeWidth={2.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveFeature(b, 1)}
                              disabled={idx < 0 || idx >= features.length - 1 || busy}
                              aria-label="Move feature down"
                              className="rounded-md p-1 text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                            >
                              <ArrowDown size={13} strokeWidth={2.5} />
                            </button>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-ink-faint">
                      {formatDate(b.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/books/${b.id}/edit`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                          title="Edit book"
                          aria-label={`Edit ${b.title}`}
                        >
                          <Pencil size={15} strokeWidth={2.3} />
                        </Link>
                        <Link
                          href={`/book/${b.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                          title="Preview book"
                          aria-label={`Preview ${b.title}`}
                        >
                          <Eye size={15} strokeWidth={2.3} />
                        </Link>
                        {b.published && (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-teal-soft">
                            <BookOpen size={15} strokeWidth={2.3} />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(b)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-600"
                          title="Delete book"
                          aria-label={`Delete ${b.title}`}
                        >
                          <Trash2 size={15} strokeWidth={2.3} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this book?"
          message={`"${deleteTarget.title}" and all ${deleteTarget.pageCount} of its pages will be permanently removed. This can't be undone.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
