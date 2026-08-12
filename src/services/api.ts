import { AUTH_DIGEST } from './auth'
import { auth } from './auth'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function adminHeaders(headers: HeadersInit = {}): HeadersInit {
  const out: Record<string, string> = { ...(headers as Record<string, string>) }
  if (auth.isAuthed()) out['Authorization'] = `Bearer ${AUTH_DIGEST}`
  return out
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: adminHeaders(init?.headers),
  })
  if (!res.ok) {
    let message = `${init?.method ?? 'GET'} ${path} failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = `${message}: ${body.error}`
    } catch {
      // keep default message
    }
    throw new ApiError(message, res.status)
  }
  return (await res.json()) as T
}

/** Convert a data URL (base64 or percent-encoded, e.g. SVG) into a Blob. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',')
  const meta = dataUrl.slice(0, comma)
  const payload = dataUrl.slice(comma + 1)
  const mime = /data:([^;,]+)/.exec(meta)?.[1] ?? 'application/octet-stream'
  let bytes: Uint8Array<ArrayBuffer>
  if (meta.includes(';base64')) {
    const bin = atob(payload)
    const out = new Uint8Array(new ArrayBuffer(bin.length))
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    bytes = out
  } else {
    bytes = new TextEncoder().encode(decodeURIComponent(payload))
  }
  return new Blob([bytes], { type: mime })
}

export interface UploadedAsset {
  key: string
  url: string
}

/** Upload one processed image to R2 and return its public URL. */
export async function uploadAsset(key: string, dataUrl: string): Promise<UploadedAsset> {
  const form = new FormData()
  const blob = dataUrlToBlob(dataUrl)
  form.append('key', key)
  form.append('file', blob, key.split('/').pop())
  const res = await fetch('/api/assets', {
    method: 'POST',
    headers: adminHeaders(),
    body: form,
  })
  if (!res.ok) {
    throw new ApiError(`Upload failed (${res.status})`, res.status)
  }
  return (await res.json()) as UploadedAsset
}

/** True when the given URL is already a stored remote asset. */
export function isRemoteAssetUrl(url: string): boolean {
  return url.startsWith('/api/assets/') || url.startsWith('http')
}
