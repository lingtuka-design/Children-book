import { api, uploadAsset } from '../api'
import type { BookPageAsset } from '../types'
import { SAMPLE_BOOKS, generateSampleAssets } from '@/lib/sampleArt'
import { generateOgCover } from '@/lib/og'
import { svgDataUrl } from '@/lib/images'
import { defaultRemoteStyles } from './styles'

async function pool<T>(items: T[], worker: (item: T, index: number) => Promise<void>, limit: number): Promise<void> {
  let cursor = 0
  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++
      await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
}

/**
 * Seeds the remote database (R2 + D1) with sample content on the very first
 * visit. The API only accepts unauthenticated writes while unseeded, so this
 * must run exactly once — afterwards every write requires the admin digest.
 */
export async function remoteSeedIfEmpty(): Promise<void> {
  const { seeded } = await api<{ ok: boolean; seeded: boolean }>('/api/health')
  if (seeded) return

  // 1. Illustration styles
  const defaults = defaultRemoteStyles()
  for (let i = 0; i < defaults.length; i++) {
    const style = defaults[i]
    const imageUrl = style.imageUrl ?? ''
    const { url } = await uploadAsset(`styles/${style.id}/ref.svg`, imageUrl)
    await api(`/api/styles/${style.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...style, imageUrl: url }),
    })
  }

  // 2. Sample books (assets → R2, metadata → D1)
  for (const spec of SAMPLE_BOOKS) {
    const { cover, pages } = generateSampleAssets(spec)
    const slug = spec.slug
    const coverUpload = await uploadAsset(`books/${slug}/cover.svg`, cover)

    const uploadedPages: BookPageAsset[] = []
    await pool(
      pages.map((pageUrl, i) => ({ pageUrl, num: i + 1 })),
      async ({ pageUrl, num }) => {
        const { url } = await uploadAsset(`books/${slug}/pages/p${num}.svg`, pageUrl)
        uploadedPages.push({ pageNumber: num, url, mime: 'image/svg+xml' })
      },
      4,
    )
    uploadedPages.sort((a, b) => a.pageNumber - b.pageNumber)

    let ogUrl: string | undefined
    try {
      const png = await generateOgCover({ coverUrl: coverUpload.url })
      const uploaded = await uploadAsset(`og/${slug}-cover.jpg`, png)
      ogUrl = uploaded.url
    } catch (err) {
      console.warn('[seed] og cover failed for', slug, err)
    }

    await api('/api/books', {
      method: 'POST',
      body: JSON.stringify({
        id: slug,
        title: spec.title,
        description: spec.description,
        category: spec.category,
        author: spec.author,
        cover: { url: coverUpload.url, mime: 'image/svg+xml' },
        pages: uploadedPages,
        featured: spec.featured,
        published: spec.published,
        ogUrl,
      }),
    })
  }

  // 3. Sample orders
  const samples = [
    {
      customer: { name: 'Aarav Mehta', city: 'Mumbai', locality: 'Andheri West', address: '12, Palm Grove, J.P. Road, Andheri West', phone: '+91 98200 11223' },
      childAge: 6,
      photos: [svgDataUrl(photoSvg(0, 'Photo 1')), svgDataUrl(photoSvg(1, 'Photo 2'))],
      styleId: 'style-1',
      styleName: 'Watercolour Wonder',
      story: 'Aarav loves dinosaurs and dreams of flying with them. Please make a story about a little boy who befriends a friendly T-Rex and they go on an adventure through a jungle.',
    },
    {
      customer: { name: 'Sneha Reddy', city: 'Bengaluru', locality: 'Indiranagar', address: '44, 100 Feet Road, Indiranagar 2nd Stage', phone: '98450 66778' },
      childAge: 4,
      photos: [svgDataUrl(photoSvg(2, 'Photo 1'))],
      styleId: 'style-2',
      styleName: 'Storybook Classic',
      story: 'My daughter loves baking with her grandma. A story about baking a magic cake that grants wishes would be perfect for bedtime.',
    },
  ]

  for (const sample of samples) {
    const id = `CB-SEED-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const photos: string[] = []
    for (let i = 0; i < sample.photos.length; i++) {
      const { url } = await uploadAsset(`orders/${id}/photo-${i + 1}.svg`, sample.photos[i])
      photos.push(url)
    }
    await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        id,
        customer: sample.customer,
        childAge: sample.childAge,
        photos,
        styleId: sample.styleId,
        styleName: sample.styleName,
        story: sample.story,
        product: { id: 'book-24', name: "24-Page Children's Book", contentPages: 24, totalPages: 26, price: 1500 },
        createdAt: new Date().toISOString(),
      }),
    })
  }

  // 4. Lock the database — all further writes require the admin digest
  await api('/api/seed', { method: 'POST' })
}

function photoSvg(seed: number, label: string): string {
  const hue = [16, 200, 45, 260, 330][seed % 5]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="hsl(${hue} 45% 90%)"/>
      <circle cx="300" cy="240" r="110" fill="hsl(${hue} 40% 78%)"/>
      <path d="M120,600 Q180,420 300,420 Q420,420 480,600 Z" fill="hsl(${hue} 40% 70%)"/>
      <text x="300" y="560" font-family="'Segoe UI', sans-serif" font-size="26" font-weight="600" fill="hsl(${hue} 45% 40%)" text-anchor="middle">${label}</text>
    </svg>`
}
