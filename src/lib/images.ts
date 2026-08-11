import sharp from "sharp";
import { createCanvas } from "@napi-rs/canvas";

/**
 * Optimized web version of an image. Preserves quality (children's book
 * artwork matters) — never aggressively compressed; originals are kept
 * separately for archival.
 */
export async function optimizeImage(
  buffer: Buffer,
  opts: { width?: number; quality?: number } = {}
) {
  const { width = 1600, quality = 90 } = opts;
  return sharp(buffer, { failOn: "error" })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality, chromaSubsampling: "4:2:0" })
    .toBuffer();
}

/**
 * A blank book page (soft paper tone, subtle vignette) sized to match the
 * rest of the book. Used for the first and last pages of JPG-based uploads.
 */
export function makeBlankPage(width: number, height: number) {
  const w = Math.max(2, Math.round(width));
  const h = Math.max(2, Math.round(height));
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  const base = ctx.createRadialGradient(
    w * 0.5,
    h * 0.42,
    0,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.75
  );
  base.addColorStop(0, "#fbf6ee");
  base.addColorStop(1, "#f1e7d3");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const vignette = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.25,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.9
  );
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(1, "rgba(45,42,61,0.07)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  return canvas.toBuffer("image/jpeg", 88);
}

export async function makeThumb(buffer: Buffer, width = 280) {
  return sharp(buffer, { failOn: "error" })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();
}

/** Verifies the buffer is a real image and returns its info (magic-byte validation). */
export async function readImageInfo(buffer: Buffer) {
  const meta = await sharp(buffer, { failOn: "error" }).metadata();
  if (!meta.width || !meta.height || !meta.format) {
    throw new Error("Not a readable image.");
  }
  return { width: meta.width, height: meta.height, format: meta.format };
}

export function isSupportedImage(mime: string) {
  return ["image/jpeg", "image/png", "image/webp"].includes(mime);
}

export function extForMime(mime: string) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}
