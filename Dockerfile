# Tiny Tales Studio — Children's Book Platform
# Multi-stage build for any Node host (Railway, Render, Fly.io, VPS, ...).
#
# Required environment variables at runtime:
#   DATABASE_URL   e.g. file:/app/prisma/dev.db  (SQLite) or a PostgreSQL URL
#   AUTH_SECRET    random 64-char hex
#   ADMIN_USERNAME default "admin"
#   ADMIN_PASSWORD change in production!
#   PORT           optional, defaults to 3000

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json
RUN mkdir -p /app/storage/orders /app/public/storage/books
EXPOSE 3000
# Create/update the database, ensure the admin user + product exist, then serve.
CMD ["sh", "-c", "npx prisma db push --skip-generate && SEED_DEMO_BOOKS=false npx tsx prisma/seed.ts && npx next start -p ${PORT:-3000}"]
