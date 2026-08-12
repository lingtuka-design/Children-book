import { detectStorageMode, resolveStorageReady } from './mode'
import { seedIfEmpty } from './seed'
import { remoteSeedIfEmpty } from './remote/seed'

/**
 * Boot sequence: probe the Cloudflare API, then seed the active storage
 * (R2 + D1 when remote, IndexedDB/localStorage otherwise). `storageReady`
 * resolves afterwards so data hooks never render empty data prematurely.
 */
export async function initStorage(): Promise<void> {
  try {
    const mode = await detectStorageMode()
    if (mode === 'remote') {
      await remoteSeedIfEmpty()
    } else {
      await seedIfEmpty()
    }
  } catch (err) {
    // never block the app boot on seeding problems, but surface for diagnosis
    console.error('[storage] init failed:', err)
  } finally {
    resolveStorageReady()
  }
}
