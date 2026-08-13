export interface BookPageAsset {
  /** 1–24, the uploaded content page number. */
  pageNumber: number
  /** Data URL of the rendered page image. */
  url: string
  mime: string
}

export interface BookCoverAsset {
  url: string
  mime: string
}

export interface Book {
  id: string
  title: string
  description: string
  category?: string
  author?: string
  cover: BookCoverAsset
  pages: BookPageAsset[]
  featured: boolean
  published: boolean
  createdAt: string
  updatedAt: string
  /** 1200×630 PNG social card (cover + excerpt) stored in R2. */
  ogUrl?: string
}

/** Lightweight book record without heavy image assets — used for listings. */
export interface BookSummary {
  id: string
  title: string
  description: string
  category?: string
  author?: string
  pageCount: number
  featured: boolean
  published: boolean
  createdAt: string
  updatedAt: string
  /** Populated by the remote API so listing pages can render covers quickly. */
  coverUrl?: string
}

export type OrderStatus = 'new' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'

export interface OrderCustomer {
  name: string
  city: string
  locality: string
  address: string
  phone: string
}

export interface OrderProduct {
  id: string
  name: string
  contentPages: number
  totalPages: number
  price: number
}

export interface Order {
  id: string
  status: OrderStatus
  customer: OrderCustomer
  childName?: string
  childAge: number
  photos: string[]
  styleId: string
  styleName: string
  story: string
  product: OrderProduct
  createdAt: string
}

export interface BookStyle {
  id: string
  name: string
  description: string
  imageUrl: string | null
  enabled: boolean
}

export interface BookDraft {
  title: string
  description: string
  category: string
  author: string
  cover: BookCoverAsset | null
  pages: BookPageAsset[]
  featured: boolean
  published: boolean
  ogUrl?: string
}

export const BLANK_PAGE = Symbol('blank-page')

/** The reader's 26-page layout: page 0 and 25 are always blank. */
export interface ReaderPage {
  index: number
  blank: boolean
  url?: string
  mime?: string
}

export function buildReaderPages(book: Book): ReaderPage[] {
  const reader: ReaderPage[] = []
  for (let i = 0; i < 26; i++) {
    if (i === 0 || i === 25) {
      reader.push({ index: i, blank: true })
    } else {
      const page = book.pages.find((p) => p.pageNumber === i)
      reader.push(page ? { index: i, blank: false, url: page.url, mime: page.mime } : { index: i, blank: true })
    }
  }
  return reader
}
