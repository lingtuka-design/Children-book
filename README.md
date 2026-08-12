# Wonder Pages — Children's Book Portfolio & Custom Book Ordering

A production-quality, static-first website for showcasing children's picture books and
ordering personalized storybooks. Built to deploy directly to **Cloudflare Pages** — no
Node.js server required at runtime.

## Tech stack

- **Vite** (build)
- **React 19 + TypeScript**
- **TanStack Router** (file-based client routing)
- **Tailwind CSS v4**
- **pdfjs-dist** (client-side PDF → image rendering, lazy-loaded)
- Browser-native APIs only (IndexedDB, localStorage, File API, canvas)

## Getting started

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build → dist/
npm run preview    # preview the production build
npm run lint       # oxlint
npm run typecheck  # tsc -b
```

## Deploying to Cloudflare Pages

The app is fully static — `dist/` contains everything needed.

1. `npm run build`
2. **Dashboard route:** New project → Pages → upload `dist/` (build command `npm run build`,
   output directory `dist`, framework preset **Vite**), or
   **Wrangler CLI:** `npx wrangler pages deploy dist`
3. SPA fallback, security headers and asset caching are already provided via
   `public/_redirects` and `public/_headers` — no extra configuration needed.

## Architecture

```
src/
├── routes/          # TanStack Router file-based routes
│   ├── index.tsx            # home (hero + latest books + pagination)
│   ├── books/               # catalog + interactive reader
│   ├── order/               # guest ordering flow (4 steps)
│   └── admin/               # login + guarded console
├── components/
│   ├── reader/BookReader.tsx   # 3D page-flip reader (spread/single, keyboard,
│   │                            # swipe, fullscreen, blank page 0 & 25)
│   ├── admin/BookEditor.tsx    # upload → auto-number → validate → preview → publish
│   └── ui/                      # buttons, fields, modals, spinners, badges
├── services/        # repository/service abstraction (UI never touches storage directly)
│   ├── books.ts / orders.ts / styles.ts
│   ├── storage.ts   # localStorage (indexes) + IndexedDB (records/assets)
│   └── auth.ts      # admin gate (digest-verified credentials, session expiry)
└── lib/             # images, pdf, page-processing, sample artwork, seo
```

### Book model

```
Book { id, title, description, category, author, cover, pages[1..24], featured, published, createdAt, updatedAt }
```

Every book is exactly **26 reader pages**: page 0 and page 25 are always blank (inside
covers) and generated automatically. The reader renders
`[blank, page 1 … page 24, blank]`.

### Upload behaviour

- Covers: PNG / JPG / PDF (PDFs are rendered to an image in the browser)
- Pages: PNG / JPG / PDF, select all files at once
- Page numbers are parsed from file names (`page-03.jpg` → 3) and sorted
  **numerically**; a multi-page PDF expands into consecutive pages
- Publishing is blocked until pages 1–24 are all present (missing pages listed)

### Storage & the Cloudflare path

Data currently lives in the browser (IndexedDB for records/assets, localStorage for
indexes) behind a clean service boundary. To go fully server-backed later, swap the
services for Cloudflare-native implementations without touching the UI:

- **Cloudflare R2** → book assets / order photos
- **Cloudflare D1** → book/order/style metadata
- **Cloudflare Workers** → API + auth + order submission

### Admin access

Admin credentials are configured in `src/services/auth.ts` (stored as a digest, never
plain text; session expires after 12 h). This is a client-side gate — for real-world
deployment route it through Cloudflare Workers auth as described above.

## Key conventions

- 6 books per listing page, client-side pagination, no reloads
- Newest books appear first in "Latest"; **Top Feature** pins a book to the front
- Covers are 3:4 portrait; interior pages are 4:3; fixed product: 24-page book, ₹1,500
- Order form: guest checkout, 500-character story limit with live counter, two photo
  uploads (second optional), four admin-managed illustration styles
- Customer data (phone, address, photos, story) is only visible in the admin console
