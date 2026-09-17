import { headers } from 'next/headers'

/**
 * ponytail: in-process fixed window, so the budget is per server instance and
 * resets on deploy. Move to Redis or the platform's edge limiter if this ever
 * runs on more than one box.
 */
const hits = new Map<string, number[]>()

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
  const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs)

  if (recent.length >= max) return false

  recent.push(now)
  hits.set(key, recent)

  if (hits.size > 5000) {
    for (const [existing, times] of hits) {
      if (times.every((at) => now - at > windowMs)) hits.delete(existing)
    }
  }

  return true
}
