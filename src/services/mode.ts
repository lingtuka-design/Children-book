import { kv } from './storage'

export type StorageMode = 'remote' | 'local'

const MODE_KEY = 'storage-mode'

let mode: StorageMode | null = null
let checking: Promise<StorageMode> | null = null

let readyResolve: () => void = () => {}
/** Resolves once the active storage has been detected and seeded. */
export const storageReady: Promise<void> = new Promise((resolve) => {
  readyResolve = resolve
})

export function resolveStorageReady(): void {
  readyResolve()
}

export function storageMode(): StorageMode {
  if (mode) return mode
  return (kv.get<StorageMode>(MODE_KEY) ?? 'local') === 'remote' ? 'remote' : 'local'
}

/**
 * Probe the Cloudflare API (same-origin Pages Functions). When reachable the
 * app stores data in R2 + D1 via the API; otherwise it falls back to the
 * browser-local implementation (IndexedDB/localStorage) so dev works offline.
 */
export function detectStorageMode(): Promise<StorageMode> {
  if (mode) return Promise.resolve(mode)
  if (checking) return checking

  checking = (async () => {
    try {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 6000)
      const res = await fetch('/api/health', { signal: controller.signal })
      window.clearTimeout(timer)
      // The probe must be a real API response (JSON with ok: true) — a dev
      // server's SPA fallback also answers 200, so a content check matters.
      const text = await res.text()
      const data: unknown = JSON.parse(text)
      if (typeof data === 'object' && data !== null && (data as { ok?: boolean }).ok === true) {
        mode = 'remote'
        kv.set(MODE_KEY, 'remote')
        return mode
      }
    } catch {
      // API unreachable or not JSON — use local storage
    }
    mode = 'local'
    kv.set(MODE_KEY, 'local')
    return mode
  })()

  return checking
}
