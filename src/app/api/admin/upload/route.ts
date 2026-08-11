import { NextRequest, NextResponse } from "next/server";
import { createUploadJob, updateUploadJob } from "@/lib/jobs";
import { processBook, type UploadedFile } from "@/lib/process-book";
import { MAX_UPLOAD_BYTES } from "@/lib/site";
import { requireAdminMutation } from "@/lib/auth";

/**
 * Accepts a book upload (multipart form):
 *   title, description, author, illustrator, year, tags (strings)
 *   publish, topFeature ("true"/"false")
 *   bookFiles[]  — a single PDF, or one or more JPG/JPEG page images
 *   cover        — optional cover image (falls back to page 1)
 *
 * The request only saves the original files and starts a background job;
 * the admin UI polls GET /api/admin/upload/status/:jobId for progress.
 */
export const revalidate = false;

export async function POST(req: NextRequest) {
  const blocked = await requireAdminMutation(req);
  if (blocked) return blocked;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "We couldn't read the upload. Please try again." },
      { status: 400 }
    );
  }

  const title = String(form.get("title") ?? "").trim();
  if (title.length < 1 || title.length > 200) {
    return NextResponse.json(
      { error: "Please enter a book title (up to 200 characters)." },
      { status: 400 }
    );
  }

  const rawFiles = form.getAll("bookFiles").filter((v): v is File => v instanceof File);
  const cover = form.get("cover");
  const coverFile = cover instanceof File && cover.size > 0 ? cover : null;

  if (rawFiles.length === 0) {
    return NextResponse.json(
      { error: "Please choose a PDF or JPG page images to upload." },
      { status: 400 }
    );
  }

  const totalBytes = rawFiles.reduce((sum, f) => sum + f.size, 0) + (coverFile?.size ?? 0);
  if (totalBytes > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "That upload is too large (150 MB maximum). Please try smaller files." },
      { status: 400 }
    );
  }

  const mimes = rawFiles.map((f) => f.type);
  const isPdf = rawFiles.length === 1 && (mimes[0] === "application/pdf" || rawFiles[0].name.toLowerCase().endsWith(".pdf"));
  const areJpgs = mimes.every((m) => m === "image/jpeg") || rawFiles.every((f) => /\.jpe?g$/i.test(f.name));
  if (!isPdf && !areJpgs) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Upload a single PDF, or JPG/JPEG images — one per book page, in order.",
      },
      { status: 400 }
    );
  }
  if (isPdf && rawFiles.length > 1) {
    return NextResponse.json(
      { error: "A PDF upload should contain exactly one file." },
      { status: 400 }
    );
  }

  const job = createUploadJob();

  const files: UploadedFile[] = [];
  for (const f of rawFiles) {
    files.push({ buffer: Buffer.from(await f.arrayBuffer()), name: f.name, mime: f.type });
  }
  let coverUpload: UploadedFile | null = null;
  if (coverFile) {
    coverUpload = {
      buffer: Buffer.from(await coverFile.arrayBuffer()),
      name: coverFile.name,
      mime: coverFile.type,
    };
  }

  void runUploadJob(job.id, {
    title,
    description: String(form.get("description") ?? ""),
    author: String(form.get("author") ?? ""),
    illustrator: String(form.get("illustrator") ?? ""),
    year: String(form.get("year") ?? ""),
    tags: String(form.get("tags") ?? ""),
    publish: form.get("publish") === "true",
    topFeature: form.get("topFeature") === "true",
    files,
    cover: coverUpload,
    blankEdges: true,
  });

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}

async function runUploadJob(
  jobId: string,
  input: Parameters<typeof processBook>[0]
) {
  updateUploadJob(jobId, {
    status: "processing",
    stage: "uploading",
    message: "Upload complete — processing…",
  });
  try {
    const result = await processBook({
      ...input,
      onStage: (stage, current, total, message) => {
        updateUploadJob(jobId, { stage, current, total, message });
      },
    });
    updateUploadJob(jobId, {
      status: "ready",
      stage: "done",
      current: result.pageCount,
      total: result.pageCount,
      message: "Book is ready!",
      bookId: result.bookId,
      bookSlug: result.slug,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    const stack = err instanceof Error ? err.stack : "";
    updateUploadJob(jobId, {
      status: "error",
      message: message ?? "We couldn't process this file. Please try again.",
      error: `${message}\n${stack}`,
    });
  }
}
