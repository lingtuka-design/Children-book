export const APP_NAME = 'Wonder Pages'
export const APP_TAGLINE = 'Custom children\u2019s books, made with love'

export const CONTENT_PAGES = 24
export const TOTAL_PAGES = 26
export const PAGE_SIZE = 6
export const STYLE_SLOTS = 4

export const INTERIOR_RATIO = '4 / 3'
export const COVER_RATIO = '3 / 4'

export const BOOK_PRICE = 1500
export const PRICE_LABEL = '₹1,500'

export const HERO_MESSAGE =
  'I fanu/fapa hmel ngei mai lanna naupang thawnthu bu, a thawnthu pawh i duh dan thlapa i thlan leh duan theih chu Order ve rawh le.'

export const PRODUCT = {
  id: 'book-24',
  name: "24-Page Children's Book",
  contentPages: CONTENT_PAGES,
  totalPages: TOTAL_PAGES,
  interiorRatio: INTERIOR_RATIO,
  coverRatio: COVER_RATIO,
  price: BOOK_PRICE,
} as const

export const STORY_MAX = 500

export const ORDER_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export type OrderStatusValue = (typeof ORDER_STATUSES)[number]['value']

export function statusLabel(value: OrderStatusValue): string {
  return ORDER_STATUSES.find((s) => s.value === value)?.label ?? value
}

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ACCEPTED_BOOK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
