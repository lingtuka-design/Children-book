import fs from "node:fs";
import path from "node:path";

/**
 * Public book files live under <app>/public/storage/books/<bookId>/...
 * (served statically by Next.js — book covers/pages are public by design).
 *
 * Private customer uploads live under <app>/storage/orders/<orderNumber>/...
 * and are ONLY served through authenticated admin API routes.
 */
const APP_ROOT = process.cwd();

export const PUBLIC_STORAGE_ROOT = path.join(
  APP_ROOT,
  "public",
  "storage",
  "books"
);
export const PRIVATE_STORAGE_ROOT = path.join(APP_ROOT, "storage", "orders");

export function bookDir(bookId: string) {
  return path.join(PUBLIC_STORAGE_ROOT, bookId);
}

export function orderDir(orderNumber: string) {
  return path.join(PRIVATE_STORAGE_ROOT, orderNumber);
}

/** Public URL for a file stored under public/storage/books/<bookId>. */
export function bookFileUrl(bookId: string, fileName: string) {
  return `/storage/books/${bookId}/${fileName}`;
}

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function removeDir(dir: string) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

export function writeFile(filePath: string, data: Buffer) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, data);
}

export function exists(filePath: string) {
  return fs.existsSync(filePath);
}
