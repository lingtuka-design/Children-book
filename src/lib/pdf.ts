import path from "node:path";
import { pathToFileURL } from "node:url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";

let options: Record<string, unknown> | null = null;

function pdfOptions(): Record<string, unknown> {
  if (options) return options;
  // Note: do NOT use require.resolve() here — Turbopack statically replaces
  // it with a numeric module id, which breaks path.dirname() at runtime.
  const standardFontsDir = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "standard_fonts"
  );
  options = {
    useSystemFonts: true,
    isEvalSupported: false,
    standardFontDataUrl: pathToFileURL(standardFontsDir + path.sep).href,
    canvasFactory: {
      create: (width: number, height: number) => createCanvas(width, height),
      reset: (canvas: { width: number; height: number }, width: number, height: number) => {
        canvas.width = width;
        canvas.height = height;
      },
      destroy: () => {},
    },
  };
  return options;
}

async function openDocument(pdf: Buffer) {
  const task = pdfjsLib.getDocument({
    data: new Uint8Array(pdf),
    ...pdfOptions(),
  } as Parameters<typeof pdfjsLib.getDocument>[0]);
  try {
    const doc = await task.promise;
    return { doc, task };
  } catch (err: unknown) {
    throw new Error(
      `We couldn't read this PDF. Please make sure it is a valid PDF file. (${err instanceof Error ? err.message : "unknown error"})`
    );
  }
}

export async function pdfPageCount(pdf: Buffer) {
  const { doc, task } = await openDocument(pdf);
  try {
    return doc.numPages;
  } finally {
    await task.destroy();
  }
}

/**
 * Renders one PDF page to a JPEG buffer at the requested width (~1600px for
 * children's book quality). The original artwork is never recompressed
 * aggressively.
 */
export async function renderPdfPage(
  pdf: Buffer,
  pageNumber: number,
  targetWidth = 1600
): Promise<Buffer> {
  const { doc, task } = await openDocument(pdf);
  try {
    const page = await doc.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(1.5, targetWidth / base.width);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height)
    );
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({
      canvasContext: ctx,
      viewport,
      canvasFactory: pdfOptions().canvasFactory,
    } as unknown as Parameters<typeof page.render>[0]).promise;
    return canvas.toBuffer("image/jpeg", 90);
  } catch (err: unknown) {
    throw new Error(
      `We couldn't render page ${pageNumber} of this PDF. Please check the file and try again. (${err instanceof Error ? err.message : "unknown error"})`
    );
  } finally {
    await task.destroy();
  }
}

/** Renders every page of a PDF as JPEG buffers, reporting progress. */
export async function renderAllPdfPages(
  pdf: Buffer,
  onProgress?: (done: number, total: number) => void
) {
  const { doc, task } = await openDocument(pdf);
  try {
    const total = doc.numPages;
    const pages: Buffer[] = [];
    for (let i = 1; i <= total; i++) {
      onProgress?.(i - 1, total);
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(1.5, 1600 / base.width);
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height)
      );
      const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({
        canvasContext: ctx,
        viewport,
        canvasFactory: pdfOptions().canvasFactory,
      } as unknown as Parameters<typeof page.render>[0]).promise;
      pages.push(canvas.toBuffer("image/jpeg", 90));
    }
    onProgress?.(total, total);
    return pages;
  } catch (err: unknown) {
    throw new Error(
      `We couldn't process this PDF into book pages. Please check the file and try again. (${err instanceof Error ? err.message : "unknown error"})`
    );
  } finally {
    await task.destroy();
  }
}
