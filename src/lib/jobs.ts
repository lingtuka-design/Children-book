import { newId } from "./ids";

/**
 * In-memory upload job store. A book upload has two phases:
 *   1. the request saves the original files (fast), then
 *   2. a background job processes pages/cover/thumbnails (can take seconds
 *      for large PDFs) while the admin UI polls for progress.
 *
 * For v1 this runs in the same Node process (fine for a single instance).
 */
export type JobStatus = "uploading" | "processing" | "ready" | "error";

export interface UploadJob {
  id: string;
  status: JobStatus;
  stage: string; // uploading | pages | thumbs | cover | finalizing | done
  current: number;
  total: number;
  message?: string;
  error?: string;
  bookId?: string;
  bookSlug?: string;
}

const jobs = new Map<string, UploadJob>();

export function createUploadJob() {
  const id = newId();
  const job: UploadJob = {
    id,
    status: "uploading",
    stage: "uploading",
    current: 0,
    total: 0,
    message: "Uploading…",
  };
  jobs.set(id, job);
  return job;
}

export function updateUploadJob(id: string, patch: Partial<UploadJob>) {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, patch);
}

export function getUploadJob(id: string) {
  const job = jobs.get(id);
  if (!job) return null;
  // Drop any internals not meant for the client.
  return {
    id: job.id,
    status: job.status,
    stage: job.stage,
    current: job.current,
    total: job.total,
    message: job.message,
    error: job.error,
    bookId: job.bookId,
    bookSlug: job.bookSlug,
  } satisfies UploadJob;
}

export function removeUploadJob(id: string) {
  jobs.delete(id);
}
