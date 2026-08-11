/**
 * Client-side Store & Fallback for Admin Features & File Uploads.
 * Works seamlessly whether running on Node.js server or static Cloudflare Pages export.
 */

export interface StoredBook {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  author?: string | null;
  illustrator?: string | null;
  year?: string | null;
  tags?: string | null;
  cover: string;
  coverThumb: string;
  originalFile?: string;
  originalMime?: string;
  pageCount: number;
  published: boolean;
  topFeature: boolean;
  featureOrder: number;
  displayOrder: number;
  createdAt: string;
  pages?: { pageNumber: number; image: string; thumb: string }[];
}

export interface StoredOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  phone: string;
  story?: string | null;
  pageCount: number;
  aspectRatio: string;
  price: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "PRINTING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  photos?: string[];
}

const BOOKS_KEY = "tiny_tales_books_v1";
const ORDERS_KEY = "tiny_tales_orders_v1";

const INITIAL_BOOKS: StoredBook[] = [
  {
    id: "vena-dino-01",
    slug: "vena-and-his-friend-t-rex",
    title: "Vena and His Friend T-Rex",
    description:
      "Vena loves stomping through the tall grass — until a rumble shakes the meadow and she meets the friendliest T-Rex in the world.",
    author: "Tiny Tales Studio",
    illustrator: "Tiny Tales Studio",
    year: "2026",
    tags: "dinosaurs, friendship, adventure",
    cover: "/storage/books/vena-dino-01/cover.jpg",
    coverThumb: "/storage/books/vena-dino-01/cover-thumb.jpg",
    pageCount: 8,
    published: true,
    topFeature: false,
    featureOrder: 0,
    displayOrder: 1,
    createdAt: new Date("2026-01-15").toISOString(),
  },
  {
    id: "cloud-rain-02",
    slug: "the-little-cloud-who-couldnt-rain",
    title: "The Little Cloud Who Couldn't Rain",
    description:
      "Every cloud in the sky can rain — except little Claude. With a nudge from the sun and a push from the wind, he discovers that a small cloud can make the most beautiful rain of all.",
    author: "Tiny Tales Studio",
    illustrator: "Tiny Tales Studio",
    year: "2026",
    tags: "weather, perseverance, nature",
    cover: "/storage/books/cloud-rain-02/cover.jpg",
    coverThumb: "/storage/books/cloud-rain-02/cover-thumb.jpg",
    pageCount: 7,
    published: true,
    topFeature: true,
    featureOrder: 1,
    displayOrder: 2,
    createdAt: new Date("2026-02-01").toISOString(),
  },
  {
    id: "luna-night-03",
    slug: "lunas-night-adventure",
    title: "Luna's Night Adventure",
    description:
      "Luna lay in bed, watching the moon shine through her window. A silver kite danced down from the moon to take her and her cat Miso on a celestial journey.",
    author: "Tiny Tales Studio",
    illustrator: "Tiny Tales Studio",
    year: "2026",
    tags: "bedtime, moon, adventure",
    cover: "/storage/books/luna-night-03/cover.jpg",
    coverThumb: "/storage/books/luna-night-03/cover-thumb.jpg",
    pageCount: 6,
    published: true,
    topFeature: true,
    featureOrder: 2,
    displayOrder: 3,
    createdAt: new Date("2026-02-10").toISOString(),
  },
];

const INITIAL_ORDERS: StoredOrder[] = [
  {
    id: "ord-sample-1",
    orderNumber: "TT-2026-001",
    customerName: "Lalthanpuii",
    address: "Zarkawt, Aizawl, Mizoram - 796001",
    phone: "+91 98623 00000",
    story: "My daughter loves T-Rex and playing outside in the garden.",
    pageCount: 24,
    aspectRatio: "4:3",
    price: 1500,
    currency: "Rs.",
    status: "PROCESSING",
    createdAt: new Date().toISOString(),
  },
];

export function getLocalBooks(): StoredBook[] {
  if (typeof window === "undefined") return INITIAL_BOOKS;
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    if (!raw) {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(INITIAL_BOOKS));
      return INITIAL_BOOKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKS;
  }
}

export function saveLocalBooks(books: StoredBook[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  } catch {
    /* quota exceeded or storage error */
  }
}

export function getLocalOrders(): StoredOrder[] {
  if (typeof window === "undefined") return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveLocalOrders(orders: StoredOrder[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    /* storage error */
  }
}

/** Utility to read a File object into a base64 Data URL */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
