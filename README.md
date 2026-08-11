# Tiny Tales Studio — Children's Book Portfolio & Custom Book Ordering

A premium children's-book design studio website: a public portfolio with an
interactive page-flipping reader, plus a guest ordering system for fully
personalized children's books (24 pages · 4:3 · Rs. 1,500) — and a secure
admin console to manage books, features, and orders.

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** (custom design tokens)
- **Prisma + SQLite** (relational; switchable to PostgreSQL by changing one line)
- **pdfjs-dist + @napi-rs/canvas** — server-side PDF → page-image rendering
- **sharp** — image optimization, thumbnails, validation
- **jose + bcryptjs** — JWT session auth + password hashing
- **zod** — server & client validation

## Getting Started

```bash
npm install
npm run db:setup      # creates the database + seeds admin user, product, and 3 sample books
npm run dev           # http://localhost:3000
```

### Environment

Copy `.env.example` to `.env` and set:

| Variable            | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `DATABASE_URL`      | `file:./dev.db` (SQLite). For Postgres: `postgresql://user:pass@host:5432/db` and set `provider = "postgresql"` in `prisma/schema.prisma` |
| `AUTH_SECRET`       | JWT signing secret. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_USERNAME`    | Admin login (default `admin`)                       |
| `ADMIN_PASSWORD`    | Admin password (default `admin123`) — **change in production** |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for SEO                        |

**Admin console:** `http://localhost:3000/admin`

> ⚠️ Change `ADMIN_PASSWORD` and `AUTH_SECRET` before going live.

## What's Included

### Public website
- **Homepage** — hero with the custom-book message + **Place Order** button,
  then a **Latest** grid of 6 published books per page with pagination.
  Published books appear automatically; **Top Features** are highlighted with
  a badge and featured position.
- **/books** — full portfolio with pagination.
- **/book/[slug]** — book detail with SEO metadata (unique title, description,
  Open Graph) and the **Read Book** reader.
- **Interactive flipbook** — real 3D page-turn animation: desktop shows a
  two-page spread with a cover-closed opening; mobile uses single-page mode.
  Includes prev/next, first/last, page indicator, fullscreen, keyboard
  (← → Home End Esc F), touch swipe, progressive page loading (thumbnail →
  full image), and loading indicators.
- **/order** — guest order form: name, address, phone, exactly two child
  photos (JPG/PNG/WebP, previews + replace), story box with a live `0 / 500`
  character counter, and a sticky order summary (24 pages · 4:3 · Rs. 1,500).
  The product config comes from the database — not hard-coded.
- **/order/success** — confirmation with the unique order number
  (`CB-YYMMDD-XXXXXX`), details, and status. No account required.

### Admin console (`/admin` — protected)
- **Login** — credentials in DB, bcrypt-hashed, JWT in an httpOnly cookie,
  CSRF double-submit protection on every mutation.
- **Dashboard** — total/published books, top features, orders by status,
  recent orders, recently uploaded books.
- **Books** — table with cover thumb, pages, publish toggle, Top Feature
  toggle + ordering arrows, upload date, edit / preview / delete (with
  confirmation).
- **Upload Book** — PDF **or** JPG/JPEG page images (one per page). The
  system automatically renders every PDF page, generates optimized page
  images + thumbnails, builds the cover (or uses page 1), and creates all
  page records. Progress is shown live: *Uploading → Processing pages →
  Generating thumbnails → Cover → Ready*, with clear error messages.
  **JPG books:** files are arranged by the numbers in their names
  (`page 2.jpg` before `page 10.jpg`), and a blank **page 0** (inside front
  cover) plus a blank page after the last uploaded page (inside back cover)
  are inserted automatically — uploading 24 pages produces 26 pages in the
  reader, exactly like the physical book.
- **Orders** — filterable (status), sortable (newest/oldest/name/status),
  searchable list; detail page shows customer info, both private photos
  (open/download, admin-only routes), the story, product snapshot, and a
  status control (New / In Progress / Awaiting Customer / Completed /
  Cancelled).

### Sample data
`npm run db:setup` seeds:
- admin user (`admin` / `admin123`)
- product config: **Custom Children's Book — 24 pages · 4:3 · Rs. 1,500**
- three sample books generated through the **real upload pipeline** —
  *Vena and His Friend T-Rex* (PDF), *The Little Cloud Who Couldn't Rain*
  (JPG pages, Top Feature), *Luna's Night Adventure* (JPG pages, Top Feature)

## Architecture Notes

### File storage
- **Public** book files → `public/storage/books/<bookId>/` (covers, pages,
  thumbnails, original PDF).
- **Private** customer photos → `storage/orders/<orderNumber>/` — outside the
  public folder, served only through authenticated admin API routes.

### Upload processing
Admin upload → request saves the originals → an in-memory background job
renders pages / optimizes images / writes records → the admin UI polls
`/api/admin/upload/status/:jobId`. Large PDFs never block the app.

### Security
- Admin routes guarded by middleware + server-side session checks.
- Passwords bcrypt-hashed; JWT sessions (7 days) in httpOnly, SameSite=Strict
  cookies; CSRF tokens on all admin mutations.
- Uploads validated server-side: MIME allow-lists (PDF / JPG / PNG / WebP),
  magic-byte image verification via sharp, size limits, sanitized text, and
  generated filenames (no user-controlled paths).
- Customer photos are never served by public routes.

### Future-ready
Product/page-count/aspect/price live in a `Product` table, order statuses are
extensible, and the schema allows payment, tracking, and customer
notifications to be added later.

## Project Structure

```
prisma/               schema + seed (sample books, admin, product)
src/
  app/                routes: public (site) + admin (shell) + API routes
  components/
    public/           Header, Footer, BookCard/Grid, Pagination, Flipbook, OrderForm…
    admin/            AdminShell, UploadWizard, tables, dialogs, badges
  lib/                prisma, auth, validation, storage, pdf, images,
                      process-book (pipeline), jobs (progress), site config
  proxy.ts            /admin* + /api/admin* protection
```

## Deployment Notes

- Requires a persistent filesystem (uploads are written to disk), so use a
  VPS/self-hosted Node server — `npm run build && npm run start`.
- For PostgreSQL: change `provider` in `prisma/schema.prisma`, set
  `DATABASE_URL`, then `npx prisma db push` (and reseed if needed).
- In production, set `AUTH_SECRET` and a strong `ADMIN_PASSWORD`, and use
  HTTPS so session cookies stay secure.
