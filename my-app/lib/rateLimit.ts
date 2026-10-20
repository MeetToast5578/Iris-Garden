import { sql } from '@payloadcms/db-postgres/drizzle'
import { headers } from 'next/headers'

import { getPayloadClient } from './payload'

/**
 * Fixed-window counter in Postgres, so the budget is shared by every serverless
 * instance (an in-memory Map is per instance and resets whenever one is recycled).
 * shortcut: fixed windows allow up to 2x max across a window boundary, upgrade to a
 * sliding window if that ever matters.
 */
const clientKey = async (action: string) => {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || headerList.get('x-real-ip') || 'local'
  return `${action}:${ip}`
}

/** Returns false when the caller has spent its budget for this window. */
export const withinRateLimit = async (
  action: string,
  { max, windowMs }: { max: number; windowMs: number },
) => {
  const key = await clientKey(action)
  const now = Date.now()
  const windowStart = Math.floor(now / windowMs) * windowMs

  try {
    const payload = await getPayloadClient()
    const db = payload.db.drizzle as { execute: (query: unknown) => Promise<{ rows: { count: string }[] }> }

    // One atomic statement, so concurrent requests cannot both read the same count.
    const { rows } = await db.execute(sql`
      INSERT INTO rate_limits (key, window_start, count)
      VALUES (${key}, ${windowStart}, 1)
      ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
      RETURNING count`)

    // Old windows are never read again; sweep them on roughly 1 call in 100.
    if (Math.random() < 0.01) {
      await db.execute(sql`DELETE FROM rate_limits WHERE window_start < ${now - 24 * 60 * 60 * 1000}`)
    }

    return Number(rows[0].count) <= max
  } catch (error) {
    // A broken limiter must not stop people ordering flowers; the failure is logged instead.
    console.error('Rate limiter failed, allowing the request', error)
    return true
  }
}
