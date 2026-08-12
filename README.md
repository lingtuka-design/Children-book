# Wonder Pages — Children's Book Portfolio & Custom Book Ordering

A production-quality, static-first website for showcasing children's picture books and
ordering personalized storybooks. Deployed to **Cloudflare Pages + Pages Functions**, with
**R2** storing every uploaded asset and **D1** storing all data — no Node.js server required.

## Tech stack

- **Vite** (build) · **React 19 + TypeScript** · **TanStack Router** (file-based routing) · **Tailwind CSS v4**
- **pdfjs-dist** — client-side PDF → image rendering, lazy-loaded
- **Cloudflare Pages Functions** — the API layer (R2 + D1 bindings)
- Browser-native APIs for image processing (canvas, File API)

## Live site

- Production: https://children-book.pages.dev
- Admin console: https://children-book.pages.dev/admin

## Getting started

```bash
npm install
npm run dev        # local dev server (falls back to browser-local storage)
npm run build      # typecheck + production build → dist/
npm run preview    # preview the production build
npm run lint       # oxlint
npm run typecheck  # tsc -b
```

## Architecture

```
src/
├── routes/                  # TanStack Router file-based routes
│   ├── index.tsx            # home (hero + latest books + pagination)
│   ├── books/               # catalog + book detail ("Read" / "Make one like this")
│   ├── order/               # guest ordering flow (4 steps)
│   └── admin/               # login + guarded console (books, styles, orders)
├── components/
│   ├── reader/BookReader.tsx    # 3D page-flip reader (spread/single, keyboard, swipe)
│   ├── reader/ReadOverlay.tsx   # immersive near-fullscreen reading mode
│   ├── admin/BookEditor.tsx     # upload → auto-number → validate → preview → publish
│   └── ui/                      # buttons, fields, modals, spinners, badges
├── services/
│   ├── books.ts / orders.ts / styles.ts   # dispatchers: remote (R2+D1) ↔ local fallback
│   ├── remote/                           # Cloudflare API implementations
│   ├── api.ts                            # /api client + R2 asset uploads
│   ├── mode.ts                           # storage-mode detection (probe /api/health)
│   ├── init.ts                           # boot: detect mode → seed active storage
│   └── storage.ts                        # local fallback (IndexedDB/localStorage)
└── lib/                    # images, pdf, page-processing, sample artwork, seo
functions/
└── api/                    # Cloudflare Pages Functions (the API)
    ├── assets/[[key]].ts   # POST upload → R2 · GET serve from R2
    ├── books/[[id]].ts     # GET list/detail · POST upsert · DELETE (D1)
    ├── orders.ts + orders/[[id]].ts      # guest checkout · status updates (D1)
    ├── styles.ts + styles/[[id]].ts      # illustration styles (D1)
    ├── health.ts / seed.ts
migrations/                 # D1 SQL migrations
```

### Book model

```
Book { id, title, description, category, author, cover, pages[1..24], featured, published, createdAt, updatedAt }
```

Every book is exactly **26 reader pages**: page 0 and page 25 are always blank (inside
covers) and generated automatically. The reader renders `[blank, page 1 … page 24, blank]`.

### Storage: R2 + D1

- **Uploads** (covers, pages, order photos, style images) are POSTed to
  `/api/assets` with a validated key (`books/{slug}/…`, `orders/{orderId}/…`,
  `styles/{styleId}/…`) and stored in the `children-book-assets` R2 bucket; the API
  serves them back at `/api/assets/{key}` with immutable caching.
- **Metadata** (books, orders, styles, settings) lives in the `children-book-db`
  D1 database as JSON documents with indexed columns (`status`, `created_at`).
- Admin writes require the admin bearer digest (mirrors the client-side login gate —
  swap for a real Workers auth/session for production hardening).
- Order photos are the only guest-uploadable assets; book/style uploads require auth
  (or the one-time bootstrap window before the sample library is seeded).
- **Local fallback:** when `/api/health` is unreachable (e.g. `npm run dev`), the app
  transparently falls back to IndexedDB/localStorage so development works offline.

### Upload behaviour

- Covers: PNG / JPG / PDF · Pages: PNG / JPG / PDF, select all files at once
- Page numbers are parsed from file names (`page-03.jpg` → 3) and sorted
  **numerically**; a multi-page PDF expands into consecutive pages
- Publishing is blocked until pages 1–24 are all present (missing pages listed)

### Reading experience

- Clicking a book cover opens its page with a **Read** button and a
  **Make one like this** button
- **Read** opens the immersive near-fullscreen reader:
  - Desktop: realistic page-flipping effect (CSS 3D), arrow-key navigation
  - Mobile/tablet: single pages with labelled **Previous / Next** buttons + swipe
  - Page counter, first/last jump, blank inside covers preserved

### Deploying to Cloudflare

The project is configured for Pages + Functions with R2/D1 bindings in `wrangler.jsonc`.

```bash
npm run build
npx wrangler pages deploy dist --project-name children-book --branch main
```

Notes:
- `public/_redirects` routes bare `/admin` → `/admin/` (301) — the pages.dev
  platform redirects a bare `/admin` to `/` when a project uses Functions, and an
  explicit redirect rule is required to win over it.
- `public/_routes.json` limits Functions to `/api/*`.
- D1 migrations: `npx wrangler d1 execute children-book-db --file=migrations/0001_init.sql --remote`
- Admin credentials are configured in `src/services/auth.ts` (digest-stored, never
  plain text; session expires after 12 h) and mirrored in `functions/api/_lib.ts`.
