import { getSetting } from './_lib'
import type { Env } from './_lib'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const seeded = (await getSetting(env, 'seeded')) === '1'
  return Response.json({ ok: true, seeded })
}

