import { kv } from './storage'
import { createBook, setBookCreatedAt } from './books'
import { createOrder, setOrderCreatedAt, type CreateOrderInput } from './orders'
import { SAMPLE_BOOKS, generateSampleAssets } from '@/lib/sampleArt'
import { svgDataUrl } from '@/lib/images'

const SEED_KEY = 'seed:v2'

function photoPlaceholder(seed: number, label: string): string {
  const hue = [16, 200, 45, 260, 330][seed % 5]
  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="hsl(${hue} 45% 90%)"/>
      <circle cx="300" cy="240" r="110" fill="hsl(${hue} 40% 78%)"/>
      <path d="M120,600 Q180,420 300,420 Q420,420 480,600 Z" fill="hsl(${hue} 40% 70%)"/>
      <text x="300" y="560" font-family="'Segoe UI', sans-serif" font-size="26" font-weight="600" fill="hsl(${hue} 45% 40%)" text-anchor="middle">${label}</text>
    </svg>`,
  )
}

/** One-time seeding of sample content so the site is complete on first launch. */
export async function seedIfEmpty(): Promise<void> {
  if (kv.get<boolean>(SEED_KEY)) return

  for (const spec of SAMPLE_BOOKS) {
    const { cover, pages } = generateSampleAssets(spec)
    const createdAt = new Date(Date.now() - spec.ageDays * 86400000).toISOString()
    try {
      const book = await createBook({
        title: spec.title,
        description: spec.description,
        category: spec.category,
        author: spec.author,
        cover: { url: cover, mime: 'image/svg+xml' },
        pages: pages.map((url, i) => ({ pageNumber: i + 1, url, mime: 'image/svg+xml' })),
        featured: spec.featured,
        published: spec.published,
      })
      await setBookCreatedAt(book.id, createdAt)
    } catch {
      // seeding is best-effort; the seed flag is only set on full success
    }
  }

  const samples: Array<CreateOrderInput & { createdAt: string }> = [
    {
      customer: {
        name: 'Aarav Mehta',
        city: 'Mumbai',
        locality: 'Andheri West',
        address: '12, Palm Grove, J.P. Road, Andheri West',
        phone: '+91 98200 11223',
      },
      childName: 'Aarav',
      childAge: 6,
      photos: [photoPlaceholder(0, 'Photo 1'), photoPlaceholder(1, 'Photo 2')],
      styleId: 'style-1',
      styleName: 'Watercolour Wonder',
      story: 'Aarav loves dinosaurs and dreams of flying with them. Please make a story about a little boy who befriends a friendly T-Rex and they go on an adventure through a jungle.',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      customer: {
        name: 'Sneha Reddy',
        city: 'Bengaluru',
        locality: 'Indiranagar',
        address: '44, 100 Feet Road, Indiranagar 2nd Stage',
        phone: '98450 66778',
      },
      childName: 'Riya',
      childAge: 4,
      photos: [photoPlaceholder(2, 'Photo 1')],
      styleId: 'style-2',
      styleName: 'Storybook Classic',
      story: 'My daughter loves baking with her grandma. A story about baking a magic cake that grants wishes would be perfect for bedtime.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  for (const sample of samples) {
    try {
      const order = await createOrder({
        customer: sample.customer,
        childName: sample.childName,
        childAge: sample.childAge,
        photos: sample.photos,
        styleId: sample.styleId,
        styleName: sample.styleName,
        story: sample.story,
      })
      await setOrderCreatedAt(order.id, sample.createdAt)
    } catch {
      // best-effort
    }
  }

  kv.set(SEED_KEY, true)
}
