import type { Media } from '@/payload-types'

type Sized = { src: string; alt: string; width: number; height: number }

/**
 * Relationship fields come back as an id when the query depth is 0, so anything
 * that is not a populated object is treated as "no image".
 */
export const imageOf = (
  value: unknown,
  size: 'thumbnail' | 'card' | 'hero' | 'full' = 'card',
): Sized | null => {
  if (!value || typeof value !== 'object') return null

  const media = value as Media
  const variant = size === 'full' ? null : media.sizes?.[size]
  const src = variant?.url ?? media.url

  if (!src) return null

  return {
    src,
    alt: media.alt ?? '',
    width: variant?.width ?? media.width ?? 1200,
    height: variant?.height ?? media.height ?? 1600,
  }
}

export const firstImage = (images: unknown, size: 'thumbnail' | 'card' | 'hero' = 'card') =>
  Array.isArray(images) ? imageOf(images[0], size) : null
