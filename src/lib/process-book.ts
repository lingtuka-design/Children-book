import fs from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";
import { bookDir, bookFileUrl, ensureDir, removeDir, writeFile } from "./storage";
import { makeBlankPage, makeThumb, optimizeImage, readImageInfo } from "./images";
import { renderAllPdfPages } from "./pdf";
import { newId } from "./ids";
import { slugify } from "./site";

export interface UploadedFile {
  buffer: Buffer;
  name: string;
  mime: string;
}

export interface ProcessBookInput {
  title: string;
  description?: string;
  author?: string;
  illustrator?: string;
  year?: string;
  tags?: string;
  publish: boolean;
  topFeature: boolean;
  /** Either a single PDF, or one or more JPG/JPEG page images (arranged by the numbers in their file names). */
  files: UploadedFile[];
  /** Optional standalone cover image. Falls back to the first page. */
  cover?: UploadedFile | null;
  /**
   * JPG books only: add a blank page 0 (inside front cover) and a blank page
   * after the last uploaded page (inside back cover). The front cover shown
   * on the book page / reader still comes from the Cover Image field, or the
   * first uploaded file when none is set.
   */
  blankEdges?: boolean;
  onStage?: (stage: string, current: number, total: number, message?: string) => void;
}

export interface ProcessBookResult {
  bookId: string;
  title: string;
  slug: string;
  pageCount: number;
  coverUrl: string;
  published: boolean;
  topFeature: boolean;
}

/**
 * Orders files by the first number found in their name — "page 2.jpg"
 * comes before "page 10.jpg". Files without any number keep their
 * original order (stable).
 */
function numericOrderKey(name: string, index: number) {
  const match = name.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1_000_000 + index;
}

export function sortFilesByNumber(files: UploadedFile[]) {
  return files
    .map((f, i) => ({ f, key: numericOrderKey(f.name, i) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.f);
}

async function uniqueSlug(title: string) {
  const base = slugify(title) || `book-${newId().slice(0, 8)}`;
  let slug = base;
  let n = 2;
  while (await prisma.book.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function isPdf(file: UploadedFile) {
  return file.mime === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Full upload pipeline:
 *   save originals -> detect source -> render/optimize pages -> thumbnails
 *   -> cover -> create Book + BookPage records -> (optionally) publish.
 *
 * Runs server-side, outside the request path, so large books don't block
 * the main application.
 */
export async function processBook(input: ProcessBookInput): Promise<ProcessBookResult> {
  const { files } = input;
  if (!files.length) throw new Error("No book files were provided.");

  const slug = await uniqueSlug(input.title);
  const id = newId();
  const dir = bookDir(id);
  ensureDir(dir);

  const report = (stage: string, current = 0, total = 0, message?: string) =>
    input.onStage?.(stage, current, total, message);

  try {
    report("pages", 0, files.length, "Preparing pages…");

    let pageBuffers: Buffer[];

    if (isPdf(files[0])) {
      if (files.length > 1) {
        throw new Error("A PDF upload should contain exactly one file. Please remove the extra files.");
      }
      // Keep the original PDF for archival.
      writeFile(path.join(dir, "original.pdf"), files[0].buffer);
      pageBuffers = await renderAllPdfPages(files[0].buffer, (done, total) =>
        report("pages", done, total, "Rendering PDF pages…")
      );
    } else {
      // JPG/JPEG pages — each image is one page. Files are arranged by the
      // numbers in their names (page 2 comes before page 10).
      const sorted = sortFilesByNumber(files);
      for (const f of sorted) {
        if (f.mime !== "image/jpeg") {
          throw new Error(
            "JPG books must contain only JPEG (JPG) page images. We found an unsupported file type."
          );
        }
        await readImageInfo(f.buffer); // rejects corrupt/non-image files
      }
      fs.mkdirSync(path.join(dir, "originals"), { recursive: true });
      const content: Buffer[] = [];
      for (let i = 0; i < sorted.length; i++) {
        writeFile(
          path.join(dir, "originals", `${String(i + 1).padStart(2, "0")}.jpg`),
          sorted[i].buffer
        );
        report("pages", i, sorted.length, `Optimizing page ${i + 1} of ${sorted.length}…`);
        content.push(await optimizeImage(sorted[i].buffer));
      }

      // Insert blank pages at the very start and very end of the book:
      // page 0 (inside front cover) and the page after the last uploaded
      // page (inside back cover). With 24 uploaded pages this yields
      // 26 pages total.
      pageBuffers = content;
      if (input.blankEdges) {
        report("pages", content.length, content.length, "Adding blank cover pages…");
        const meta = await readImageInfo(content[0]);
        const blank = await makeBlankPage(meta.width, meta.height);
        pageBuffers = [blank, ...content, blank];
      }
    }

    if (pageBuffers.length === 0) {
      throw new Error("We couldn't extract any pages from this file. Please check the file and try again.");
    }

    report("thumbs", 0, pageBuffers.length, "Generating thumbnails…");
    const thumbs: Buffer[] = [];
    for (let i = 0; i < pageBuffers.length; i++) {
      thumbs.push(await makeThumb(pageBuffers[i]));
      report("thumbs", i + 1, pageBuffers.length);
    }

    // Cover: uploaded cover image; otherwise the first uploaded file for JPG
    // books (their front cover — never the blank page 0), or the rendered
    // first page for PDF books.
    report("cover", 0, 1, "Preparing cover…");
    let coverBuffer: Buffer;
    if (input.cover) {
      await readImageInfo(input.cover.buffer);
      coverBuffer = await optimizeImage(input.cover.buffer, { width: 1800 });
    } else if (isPdf(files[0])) {
      coverBuffer = await optimizeImage(pageBuffers[0], { width: 1800 });
    } else {
      const firstFile = sortFilesByNumber(files)[0];
      coverBuffer = await optimizeImage(firstFile.buffer, { width: 1800 });
    }
    const coverThumb = await makeThumb(coverBuffer, 420);

    const coverUrl = bookFileUrl(id, "cover.jpg");
    const coverThumbUrl = bookFileUrl(id, "cover-thumb.jpg");
    writeFile(path.join(dir, "cover.jpg"), coverBuffer);
    writeFile(path.join(dir, "cover-thumb.jpg"), coverThumb);

    const pagesDir = path.join(dir, "pages");
    ensureDir(pagesDir);

    const pageRows = pageBuffers.map((buf, i) => {
      const n = String(i + 1).padStart(2, "0");
      const image = bookFileUrl(id, `pages/${n}.jpg`);
      const thumb = bookFileUrl(id, `pages/${n}-thumb.jpg`);
      writeFile(path.join(pagesDir, `${n}.jpg`), buf);
      writeFile(path.join(pagesDir, `${n}-thumb.jpg`), thumbs[i]);
      return { pageNumber: i + 1, image, thumb };
    });

    report("finalizing", 0, 1, "Saving book…");
    const source =
      files.length === 1 && isPdf(files[0])
        ? "original.pdf"
        : `originals (${files.length} pages)`;

    // Highest displayOrder lands newest books first in the portfolio.
    const latest = await prisma.book.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });

    const featureOrder = input.topFeature
      ? ((await prisma.book.aggregate({
          where: { topFeature: true },
          _max: { featureOrder: true },
        }))._max.featureOrder ?? 0) + 1
      : 0;

    const book = await prisma.book.create({
      data: {
        id,
        slug,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        author: input.author?.trim() || null,
        illustrator: input.illustrator?.trim() || null,
        year: input.year?.trim() || null,
        tags: input.tags?.trim() || null,
        cover: coverUrl,
        coverThumb: coverThumbUrl,
        originalFile: source,
        originalMime: files[0].mime,
        pageCount: pageBuffers.length,
        published: input.publish,
        topFeature: input.topFeature,
        featureOrder,
        displayOrder: (latest?.displayOrder ?? 0) + 1,
        pages: { create: pageRows },
      },
      include: { pages: true },
    });

    report("done", book.pages.length, book.pages.length, "Book is ready!");
    return {
      bookId: book.id,
      title: book.title,
      slug: book.slug,
      pageCount: book.pages.length,
      coverUrl: book.cover,
      published: book.published,
      topFeature: book.topFeature,
    };
  } catch (err) {
    removeDir(dir);
    throw err;
  }
}

/** Deletes a book's files and database records. */
export async function deleteBookFiles(bookId: string) {
  removeDir(bookDir(bookId));
}
