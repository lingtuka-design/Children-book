import { json } from './_lib'
import type { Env } from './_lib'

interface StyleRecord {
  id: string
  name: string
  description: string
  imageUrl: string | null
  enabled: boolean
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const rows = await env.DB.prepare('SELECT data FROM styles').all<{ data: string }>()
  const styles = (rows.results ?? []).map((r) => JSON.parse(r.data) as StyleRecord)
  return json({ styles })
}
