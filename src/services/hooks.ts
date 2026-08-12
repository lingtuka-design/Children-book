import { useCallback, useEffect, useState } from 'react'
import type { Book, BookStyle, Order } from './types'
import * as bookService from './books'
import * as orderService from './orders'
import * as styleService from './styles'
import { auth } from './auth'
import { storageReady } from './mode'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    storageReady
      .then(fn)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}

export function useBooks() {
  return useAsync<Awaited<ReturnType<typeof bookService.listPublishedBooks>>>(() => bookService.listPublishedBooks(), [])
}

export function useAllBooks() {
  return useAsync<Awaited<ReturnType<typeof bookService.listBooks>>>(() => bookService.listBooks(), [])
}

export function useBook(id: string | undefined) {
  return useAsync<Book | null>(() => (id ? bookService.getBook(id) : Promise.resolve(null)), [id])
}

const coverCache = new Map<string, string>()

export function useCover(id: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => (id ? coverCache.get(id) ?? null : null))
  useEffect(() => {
    if (!id) return
    const cached = coverCache.get(id)
    if (cached !== undefined) {
      setUrl(cached)
      return
    }
    let cancelled = false
    bookService
      .getCoverUrl(id)
      .then((u) => {
        if (u) coverCache.set(id, u)
        if (!cancelled) setUrl(u)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [id])
  return url
}

export function useStyles() {
  return useAsync<BookStyle[]>(() => styleService.getStyles(), [])
}

export function useOrders() {
  return useAsync<Order[]>(() => orderService.listOrders(), [])
}

export function useAuth(): boolean {
  const [authed, setAuthed] = useState(auth.isAuthed())
  useEffect(() => auth.subscribe(setAuthed), [])
  return authed
}
