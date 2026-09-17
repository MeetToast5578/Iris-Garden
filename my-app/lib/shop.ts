import type { Where } from 'payload'

export const PAGE_SIZE = 12

export const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest', sort: '-createdAt' },
  { label: 'Price: low to high', value: 'price-asc', sort: 'price' },
  { label: 'Price: high to low', value: 'price-desc', sort: '-price' },
  { label: 'Name A–Z', value: 'name', sort: 'title' },
] as const

export type PriceBand = { label: string; value: string }

export type ShopParams = {
  q?: string
  occasion?: string
  price?: string
  sort?: string
  page?: string
}

/**
 * Sold-out bouquets sink to the bottom of every sort, so the first thing a
 * visitor sees is always something they can actually buy.
 */
export const sortFor = (value?: string) => [
  '-inStock',
  SORT_OPTIONS.find((option) => option.value === value)?.sort ?? '-createdAt',
]

export const pageFor = (value?: string) => {
  const page = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

const BAND_PATTERN = /^(\d+(?:\.\d+)?)?-(\d+(?:\.\d+)?)?$/

/** "50-100" → { min: 50, max: 100 }; "150-" → { min: 150 }; "-50" → { max: 50 }. */
export const parsePriceBand = (value?: string) => {
  const match = value?.match(BAND_PATTERN)
  if (!match || (!match[1] && !match[2])) return null

  return {
    min: match[1] ? Number(match[1]) : undefined,
    max: match[2] ? Number(match[2]) : undefined,
  }
}

const money = (amount: number) => `$${amount}`

/**
 * Bands derived from what is actually in the catalogue, so there is never a
 * chip that cannot match anything.
 */
export const buildPriceBands = (min: number, max: number): PriceBand[] => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return []

  const round = (value: number) => Math.max(5, Math.round(value / 5) * 5)
  const lower = round(min + (max - min) / 3)
  const upper = round(min + ((max - min) * 2) / 3)

  if (lower <= min || upper <= lower) {
    const single = round(min + (max - min) / 2)
    if (single <= min || single >= max) return []
    return [
      { label: `Under ${money(single)}`, value: `-${single}` },
      { label: `${money(single)} and up`, value: `${single}-` },
    ]
  }

  return [
    { label: `Under ${money(lower)}`, value: `-${lower}` },
    { label: `${money(lower)} – ${money(upper)}`, value: `${lower}-${upper}` },
    { label: `${money(upper)} and up`, value: `${upper}-` },
  ]
}

export const whereFor = (params: ShopParams, categoryId?: number): Where => {
  const and: Where[] = []

  if (categoryId) and.push({ category: { equals: categoryId } })

  const q = params.q?.trim()
  if (q) {
    and.push({
      or: [
        { title: { like: q } },
        { shortDescription: { like: q } },
        { composition: { like: q } },
      ],
    })
  }

  if (params.occasion) and.push({ occasions: { in: [params.occasion] } })

  const band = parsePriceBand(params.price)
  if (band) {
    const price: Record<string, number> = {}
    if (band.min !== undefined) price.greater_than_equal = band.min
    if (band.max !== undefined) price.less_than_equal = band.max
    and.push({ price })
  }

  return and.length ? { and } : {}
}
