export const SITE = {
  name: "Tiny Tales Studio",
  tagline: "Children's books, lovingly designed.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
} as const;

export const HERO_MESSAGE =
  "Order a custom children's book featuring your child's face, with a completely personalized story of your choice.";

export const BOOKS_PER_PAGE_HOME = 6;
export const BOOKS_PER_PAGE_ALL = 12;

export const MAX_STORY_CHARS = 500;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB per photo
export const ALLOWED_PHOTO_MIMES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_BYTES = 150 * 1024 * 1024; // 150 MB per book upload

export const ORDER_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "AWAITING_CUSTOMER",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  AWAITING_CUSTOMER: "Awaiting Customer",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  NEW: "bg-sky-100 text-sky-700 ring-sky-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 ring-amber-200",
  AWAITING_CUSTOMER: "bg-violet-100 text-violet-700 ring-violet-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-700 ring-rose-200",
};

export const DEFAULT_PRODUCT_SLUG = "custom-childrens-book-24pg";

export function formatPrice(amount: number, currency = "Rs.") {
  return `${currency} ${amount.toLocaleString("en-IN")}`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
