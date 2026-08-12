/**
 * Persistence primitives.
 *
 * The application is a pure static site: metadata + small records live in
 * localStorage, heavier binary assets (book pages, covers, photos) live in
 * IndexedDB. Everything is wrapped behind these tiny primitives so a
 * Cloudflare D1 + R2 implementation can be swapped in later without touching
 * the UI (see services/). Nothing here requires a Node.js runtime.
 */

const DB_NAME = 'wonder-pages-db'
const STORE_NAME = 'records'
const PREFIX = 'wp:'

/* ------------------------------------------------------------------ */
/* localStorage key/value with safe fallbacks                          */
/* ------------------------------------------------------------------ */

export const kv = {
  get<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(PREFIX + key)
      return raw === null ? null : (JSON.parse(raw) as T)
    } catch {
      return null
    }
  },
  set(key: string, value: unknown): void {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // storage full or unavailable — the UI surfaces this as an error
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(PREFIX + key)
    } catch {
      // ignore
    }
  },
}

/* ------------------------------------------------------------------ */
/* IndexedDB record store                                              */
/* ------------------------------------------------------------------ */

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = window.indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error ?? new Error('IndexedDB unavailable'))
    })
  }
  return dbPromise
}

export const idb = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await openDb()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).get(key)
        req.onsuccess = () => resolve((req.result as T | undefined) ?? null)
        req.onerror = () => reject(req.error)
      })
    } catch {
      return null
    }
  },
  async set(key: string, value: unknown): Promise<void> {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },
  async remove(key: string): Promise<void> {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },
  async keys(prefix: string): Promise<string[]> {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.openCursor()
      const keys: string[] = []
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) {
          if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) keys.push(cursor.key)
          cursor.continue()
        } else {
          resolve(keys)
        }
      }
      req.onerror = () => reject(req.error)
    })
  },
}

export function isStorageAvailable(): boolean {
  try {
    const k = `__wp_test__`
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}
