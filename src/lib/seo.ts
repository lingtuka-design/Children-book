import { useEffect } from 'react'

export interface PageMeta {
  title: string
  description?: string
  ogImage?: string
}

const SITE_NAME = 'Wonder Pages'

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function usePageMeta(meta: PageMeta): void {
  useEffect(() => {
    const prevTitle = document.title
    document.title = meta.title ? `${meta.title} · ${SITE_NAME}` : SITE_NAME
    if (meta.description) {
      setMeta('name', 'description', meta.description)
      setMeta('property', 'og:description', meta.description)
      setMeta('name', 'twitter:description', meta.description)
    }
    setMeta('property', 'og:title', meta.title)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:type', 'website')
    if (meta.ogImage) setMeta('property', 'og:image', meta.ogImage)
    return () => {
      document.title = prevTitle
    }
  }, [meta.title, meta.description, meta.ogImage])
}
