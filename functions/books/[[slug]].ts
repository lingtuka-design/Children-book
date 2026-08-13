import type { Env } from '../api/_lib'

/**
 * Serves book pages with server-rendered Open Graph tags so social platforms
 * (WhatsApp, Facebook, Telegram…) pick up the book cover thumbnail even when
 * they don't execute JavaScript. Unknown paths fall through to the normal
 * SPA flow via ASSETS.
 */
export const onRequestGet: PagesFunction<Env> = async ({ env, params, request }) => {
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug
  if (!slug) return env.ASSETS.fetch(request)

  const row = await env.DB.prepare('SELECT data FROM books WHERE id = ?').bind(slug).first<{ data: string }>()
  if (!row) return env.ASSETS.fetch(request)

  const book = JSON.parse(row.data) as {
    title?: string
    description?: string
    ogUrl?: string
  }
  const origin = new URL(request.url).origin
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const title = escape((book.title ?? 'Book').trim())
  const description = escape((book.description ?? 'A personalised children\u2019s storybook.').trim().slice(0, 200))
  const ogImage = book.ogUrl ? origin + book.ogUrl : null

  const html = await (await env.ASSETS.fetch(new URL('/', request.url))).text()
  const injected = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title} · Wonder Pages</title>`)
    .replace(
      '</head>',
      [
        `<meta property="og:title" content="${title}" />`,
        `<meta property="og:description" content="${description}" />`,
        ogImage ? `<meta property="og:image" content="${ogImage}" />` : '',
        ogImage ? '<meta property="og:image:width" content="1080" />' : '',
        ogImage ? '<meta property="og:image:height" content="1440" />' : '',
        '<meta property="og:type" content="website" />',
      ].join('') + '</head>',
    )

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
