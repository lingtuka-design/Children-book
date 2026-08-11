"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  FileText,
  ImagePlus,
  Loader2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { api, errorMessage } from "@/lib/admin-client";

interface JobState {
  status: string;
  stage: string;
  current: number;
  total: number;
  message?: string;
  error?: string;
  bookId?: string;
  bookSlug?: string;
}

const STAGES: Record<string, string> = {
  uploading: "Uploading file",
  pages: "Processing pages",
  thumbs: "Generating thumbnails",
  cover: "Preparing cover",
  finalizing: "Saving book",
  done: "Book ready",
};

export default function UploadWizard() {
  const filesRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [illustrator, setIllustrator] = useState("");
  const [year, setYear] = useState("");
  const [tags, setTags] = useState("");
  const [publish, setPublish] = useState(true);
  const [topFeature, setTopFeature] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [cover, setCover] = useState<{ file: File; preview: string } | null>(null);

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [job, setJob] = useState<JobState | null>(null);
  const [busy, setBusy] = useState(false);

  const pickFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const arr = Array.from(list);
    const isPdf = arr.some((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (isPdf) {
      if (arr.length > 1) {
        setFieldError("A PDF book upload should contain exactly one file. Please select only the PDF.");
        return;
      }
      if (arr[0].type !== "application/pdf" && !arr[0].name.toLowerCase().endsWith(".pdf")) {
        setFieldError("That file doesn't look like a PDF. For image books, select JPG/JPEG page images.");
        return;
      }
      setFiles(arr);
    } else {
      if (arr.some((f) => !f.type.startsWith("image/") && !/\.(jpe?g|png|webp)$/i.test(f.name))) {
        setFieldError("Image books accept PNG, JPG, JPEG, or WebP files — one image per page, in order.");
        return;
      }
      // Arrange by the numbers in the file names (page 2 before page 10).
      const combined = [...files, ...arr];
      combined.sort((a, b) => {
        const ka = a.name.match(/\d+/);
        const kb = b.name.match(/\d+/);
        if (ka && kb) return parseInt(ka[0], 10) - parseInt(kb[0], 10);
        return 0;
      });
      setFiles(combined.slice(0, 200));
    }
    setFieldError(null);
  };

  const pickCover = (f: File | null | undefined) => {
    if (!f) return;
    if (!/\.(jpe?g|png|webp)$/i.test(f.name) && !f.type.startsWith("image/")) {
      setFieldError("Cover image must be a JPG, PNG, or WebP file.");
      return;
    }
    if (cover) URL.revokeObjectURL(cover.preview);
    setCover({ file: f, preview: URL.createObjectURL(f) });
    setFieldError(null);
  };

  const validate = () => {
    if (title.trim().length < 1) return "Please enter a book title.";
    if (files.length === 0) return "Please choose a PDF or JPG page images.";
    return null;
  };

  const start = async () => {
    const err = validate();
    setFieldError(err);
    if (err) return;

    setBusy(true);
    setJob({ status: "uploading", stage: "uploading", current: 0, total: 0, message: "Uploading…" });
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("author", author);
      fd.append("illustrator", illustrator);
      fd.append("year", year);
      fd.append("tags", tags);
      fd.append("publish", publish ? "true" : "false");
      fd.append("topFeature", topFeature ? "true" : "false");
      for (const f of files) fd.append("bookFiles", f);
      if (cover) fd.append("cover", cover.file);

      const res = await api<{ jobId: string }>("/api/admin/upload", { method: "POST", body: fd });

      const poll = async () => {
        const data = await api<{ job: JobState }>(`/api/admin/upload/status/${res.jobId}`);
        setJob(data.job);
        if (data.job.status === "processing" || data.job.status === "uploading") {
          setTimeout(poll, 1200);
        }
      };
      await poll();
    } catch (e: unknown) {
      setJob({
        status: "error",
        stage: "error",
        current: 0,
        total: 0,
        message: errorMessage(e),
        error: errorMessage(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const progress = job && job.total > 0 ? Math.round((job.current / job.total) * 100) : null;
  const stageLabel = job ? STAGES[job.stage] ?? job.stage : "";

  const inputCls =
    "w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink shadow-sm placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6 rounded-2xl border border-ink/5 bg-white p-6 shadow-card">
        <div>
          <label htmlFor="title" className="text-sm font-bold text-ink">
            Book Title <span className="text-coral-deep">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Vena and His Friend T-Rex"
            className={`mt-1.5 ${inputCls}`}
          />
        </div>

        <div>
          <label htmlFor="description" className="text-sm font-bold text-ink">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short blurb shown on the book's page…"
            className={`mt-1.5 ${inputCls}`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="author" className="text-sm font-bold text-ink">
              Author
            </label>
            <input id="author" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className={`mt-1.5 ${inputCls}`} />
          </div>
          <div>
            <label htmlFor="illustrator" className="text-sm font-bold text-ink">
              Illustrator
            </label>
            <input id="illustrator" type="text" value={illustrator} onChange={(e) => setIllustrator(e.target.value)} className={`mt-1.5 ${inputCls}`} />
          </div>
          <div>
            <label htmlFor="year" className="text-sm font-bold text-ink">
              Year
            </label>
            <input id="year" type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" className={`mt-1.5 ${inputCls}`} />
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="text-sm font-bold text-ink">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="comma separated, e.g. dinosaurs, friendship"
            className={`mt-1.5 ${inputCls}`}
          />
        </div>

        {/* Book files */}
        <div>
          <p className="text-sm font-bold text-ink">
            Book File <span className="text-coral-deep">*</span>
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">
            Upload a single PDF — or PNG, JPG, JPEG, or WebP page images, one per
            page. Files are arranged by the numbers in their names. For image
            books a blank page 0 (inside front cover) and a blank page after the
            last page (inside back cover) are added automatically — upload 24
            pages and the book has 26 pages in total.
          </p>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFiles(e.dataTransfer.files);
            }}
            className="mt-2"
          >
            <button
              type="button"
              onClick={() => filesRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-cream/60 px-4 py-10 transition-colors hover:border-coral hover:bg-coral-soft/40"
            >
              <UploadCloud size={26} strokeWidth={1.8} className="text-coral-deep" aria-hidden />
              <span className="text-sm font-bold text-ink">Choose PDF, PNG, JPG, or WebP pages</span>
              <span className="text-xs text-ink-faint">or drop them here</span>
            </button>
          </div>
          <input
            ref={filesRef}
            type="file"
            accept=".pdf,application/pdf,image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            className="sr-only"
            onChange={(e) => pickFiles(e.target.files)}
          />

          {files.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg bg-cream px-3 py-2 text-xs font-semibold text-ink">
                  {f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf") ? (
                    <FileText size={14} className="shrink-0 text-coral-deep" aria-hidden />
                  ) : (
                    <FileImage size={14} className="shrink-0 text-teal-deep" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="shrink-0 text-ink-faint">
                    {i + 1}/{files.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    className="shrink-0 rounded px-1.5 text-ink-faint hover:text-rose-600"
                    aria-label={`Remove ${f.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cover image */}
        <div>
          <p className="text-sm font-bold text-ink">
            Cover Image <span className="text-xs font-semibold text-ink-faint">(optional — uses first page if empty)</span>
          </p>
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-cream/60 px-4 py-7 transition-colors hover:border-coral hover:bg-coral-soft/40 sm:w-56"
            >
              {cover?.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover.preview} alt="Cover preview" className="h-24 w-20 rounded-lg object-cover shadow-soft" />
              ) : (
                <>
                  <ImagePlus size={22} strokeWidth={1.8} className="text-coral-deep" aria-hidden />
                  <span className="text-xs font-bold text-ink">Choose cover image</span>
                </>
              )}
            </button>
            <input
              ref={coverRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => pickCover(e.target.files?.[0])}
            />
            {cover && (
              <button
                type="button"
                onClick={() => { if (cover) URL.revokeObjectURL(cover.preview); setCover(null); }}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Remove cover
              </button>
            )}
          </div>
        </div>

        {fieldError && (
          <p role="alert" className="rounded-xl bg-coral-soft px-4 py-3 text-xs font-semibold text-coral-deep">
            {fieldError}
          </p>
        )}

        {/* Processing progress */}
        {job && job.status !== "error" && (
          <div className="rounded-2xl border border-teal/20 bg-teal-soft/50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-teal-deep">
              <Loader2 size={16} className="animate-spin" aria-hidden />
              {stageLabel}
              {progress !== null && <span className="tabular-nums">· {progress}%</span>}
            </div>
            {job.message && <p className="mt-1 text-xs font-semibold text-teal-deep/80">{job.message}</p>}
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-teal transition-all duration-500"
                style={{ width: `${job.status === "ready" ? 100 : progress ?? 8}%` }}
              />
            </div>
            {job.status === "ready" && job.bookSlug && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 size={13} strokeWidth={2.4} aria-hidden />
                  Ready — {job.total} pages
                </span>
                <Link
                  href={`/book/${job.bookSlug}`}
                  className="text-xs font-bold text-teal-deep underline"
                >
                  View book →
                </Link>
                <Link href="/admin/books" className="text-xs font-bold text-ink-soft underline">
                  Manage books
                </Link>
              </div>
            )}
          </div>
        )}

        {job?.status === "error" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5" role="alert">
            <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
              <AlertTriangle size={16} strokeWidth={2.4} aria-hidden />
              Upload failed
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-rose-700">
              {job.error ?? "We couldn't process this file. Please check the file format and try again."}
            </p>
            <button
              type="button"
              onClick={() => setJob(null)}
              className="mt-3 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Publish options */}
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-semibold text-ink">Publishing</h2>

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-coral"
            />
            <span>
              <span className="block text-sm font-bold text-ink">Publish immediately</span>
              <span className="block text-xs text-ink-soft">
                Published books appear automatically in the Latest section.
              </span>
            </span>
          </label>

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={topFeature}
              onChange={(e) => setTopFeature(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-amber-500"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <Sparkles size={14} strokeWidth={2.4} className="text-amber-500" aria-hidden />
                Top Feature
              </span>
              <span className="block text-xs text-ink-soft">
                Gets a highlighted card and featured position in Latest.
              </span>
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={start}
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-coral px-6 py-3.5 text-base font-bold text-white shadow-lift transition-all hover:-translate-y-0.5 hover:bg-coral-deep disabled:pointer-events-none disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 size={17} className="animate-spin" aria-hidden />
              Uploading &amp; processing…
            </>
          ) : (
            <>
              <UploadCloud size={17} strokeWidth={2.3} aria-hidden />
              Upload Book
            </>
          )}
        </button>

        <p className="rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-ink-soft">
          <strong className="text-ink">How it works:</strong> your file is
          uploaded securely, every page is rendered into a web-friendly image,
          a cover and thumbnails are created, and the book record is built
          automatically. Large PDFs are processed in the background.
        </p>
      </div>
    </div>
  );
}
