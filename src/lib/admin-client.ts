import {
  getLocalBooks,
  saveLocalBooks,
  getLocalOrders,
  saveLocalOrders,
  readFileAsDataURL,
  type StoredBook,
} from "./admin-store";

/** Extracts a readable message from an unknown error. */
export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again.") {
  return e instanceof Error ? e.message : fallback;
}

/** CSRF token from the double-submit cookie set at login. */
export function csrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf_token="));
  return match ? match.slice("csrf_token=".length) : "";
}

let lastUploadedBook: StoredBook | null = null;

/**
 * Admin API helper: calls backend Node.js API when available,
 * or falls back seamlessly to client-side localStorage on static exports.
 */
export async function api<T = unknown>(
  url: string,
  opts: RequestInit = {}
): Promise<T> {
  try {
    const headers = new Headers(opts.headers);
    headers.set("x-csrf-token", csrfToken());

    const res = await fetch(url, { ...opts, headers });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data) return data as T;
    }
  } catch {
    /* Network or 404 static host fallback */
  }

  // Client-side fallback for static export hosts
  return handleLocalFallback<T>(url, opts);
}

async function handleLocalFallback<T>(url: string, opts: RequestInit): Promise<T> {
  const method = (opts.method || "GET").toUpperCase();

  // Admin Dashboard
  if (url === "/api/admin/dashboard") {
    const books = getLocalBooks();
    const orders = getLocalOrders();
    const stats = {
      totalBooks: books.length,
      publishedBooks: books.filter((b) => b.published).length,
      topFeatures: books.filter((b) => b.topFeature).length,
      totalOrders: orders.length,
      newOrders: orders.filter((o) => o.status === "PENDING").length,
      inProgress: orders.filter((o) => o.status === "PROCESSING" || o.status === "PRINTING").length,
      awaiting: 0,
      completed: orders.filter((o) => o.status === "COMPLETED").length,
      cancelled: orders.filter((o) => o.status === "CANCELLED").length,
    };
    return {
      stats,
      recentOrders: orders.slice(0, 5),
      recentBooks: books.slice(0, 5),
    } as unknown as T;
  }

  // Admin Books List
  if (url === "/api/admin/books" && method === "GET") {
    return { books: getLocalBooks() } as unknown as T;
  }

  // Admin Book Upload
  if (url === "/api/admin/upload" && method === "POST") {
    const formData = opts.body as FormData;
    const title = (formData.get("title") as string) || "Untitled Book";
    const description = (formData.get("description") as string) || "";
    const author = (formData.get("author") as string) || "";
    const illustrator = (formData.get("illustrator") as string) || "";
    const year = (formData.get("year") as string) || "";
    const tags = (formData.get("tags") as string) || "";
    const publish = formData.get("publish") === "true";
    const topFeature = formData.get("topFeature") === "true";

    const coverFile = formData.get("cover") as File | null;
    const bookFiles = formData.getAll("bookFiles") as File[];

    let coverDataUrl = "/storage/books/vena-dino-01/cover.jpg";
    let coverThumbDataUrl = "/storage/books/vena-dino-01/cover-thumb.jpg";

    if (coverFile) {
      coverDataUrl = await readFileAsDataURL(coverFile);
      coverThumbDataUrl = coverDataUrl;
    } else if (bookFiles.length > 0 && bookFiles[0].type.startsWith("image/")) {
      coverDataUrl = await readFileAsDataURL(bookFiles[0]);
      coverThumbDataUrl = coverDataUrl;
    }

    const pagesData: { pageNumber: number; image: string; thumb: string }[] = [];
    let pageCount = Math.max(1, bookFiles.length);

    for (let i = 0; i < bookFiles.length; i++) {
      const f = bookFiles[i];
      if (f.type.startsWith("image/")) {
        const url = await readFileAsDataURL(f);
        pagesData.push({ pageNumber: i + 1, image: url, thumb: url });
      }
    }

    if (pagesData.length > 0) {
      pageCount = pagesData.length;
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "new-book";
    const books = getLocalBooks();

    const newBook: StoredBook = {
      id: "local-" + Date.now(),
      slug,
      title,
      description,
      author,
      illustrator,
      year,
      tags,
      cover: coverDataUrl,
      coverThumb: coverThumbDataUrl,
      pageCount,
      published: publish,
      topFeature,
      featureOrder: topFeature ? books.filter((b) => b.topFeature).length + 1 : 0,
      displayOrder: books.length + 1,
      createdAt: new Date().toISOString(),
      pages: pagesData,
    };

    lastUploadedBook = newBook;
    saveLocalBooks([newBook, ...books]);

    return { jobId: "local-job-" + Date.now() } as unknown as T;
  }

  // Upload status polling
  if (url.startsWith("/api/admin/upload/status/")) {
    const book = lastUploadedBook || getLocalBooks()[0];
    return {
      job: {
        status: "ready",
        stage: "done",
        current: book.pageCount,
        total: book.pageCount,
        bookId: book.id,
        bookSlug: book.slug,
      },
    } as unknown as T;
  }

  // Publish toggle
  if (url.match(/\/api\/admin\/books\/[^/]+\/publish/)) {
    const id = url.split("/")[4];
    const body = JSON.parse((opts.body as string) || "{}");
    const books = getLocalBooks().map((b) =>
      b.id === id ? { ...b, published: Boolean(body.published) } : b
    );
    saveLocalBooks(books);
    return { ok: true } as unknown as T;
  }

  // Feature toggle
  if (url.match(/\/api\/admin\/books\/[^/]+\/feature/)) {
    const id = url.split("/")[4];
    const body = JSON.parse((opts.body as string) || "{}");
    const books = getLocalBooks().map((b) =>
      b.id === id
        ? {
            ...b,
            topFeature: Boolean(body.topFeature),
            featureOrder: typeof body.featureOrder === "number" ? body.featureOrder : b.featureOrder,
          }
        : b
    );
    saveLocalBooks(books);
    return { ok: true } as unknown as T;
  }

  // Book Delete
  if (url.match(/\/api\/admin\/books\/[^/]+$/) && method === "DELETE") {
    const id = url.split("/")[4];
    const books = getLocalBooks().filter((b) => b.id !== id);
    saveLocalBooks(books);
    return { ok: true } as unknown as T;
  }

  // Single Book GET / EDIT
  if (url.match(/\/api\/admin\/books\/[^/]+$/) && method === "GET") {
    const id = url.split("/")[4];
    const book = getLocalBooks().find((b) => b.id === id) || getLocalBooks()[0];
    return { book } as unknown as T;
  }

  // Admin Orders List
  if (url === "/api/admin/orders") {
    return { orders: getLocalOrders() } as unknown as T;
  }

  // Order Details
  if (url.match(/\/api\/admin\/orders\/[^/]+$/)) {
    const id = url.split("/")[4];
    const orders = getLocalOrders();
    const order = orders.find((o) => o.id === id) || orders[0];
    return { order } as unknown as T;
  }

  return { ok: true } as unknown as T;
}
