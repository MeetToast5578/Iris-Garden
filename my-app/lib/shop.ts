import type { Where } from 'payload'

export const PAGE_SIZE = 12

export const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest', sort: '-createdAt' },
  { label: 'Price: low to high', value: 'price-asc', sort: 'price' },
  { label: 'Price: high to low', value: 'price-desc', sort: '-price' },
  { label: 'Name A–Z', value: 'name', sort: 'title' },
] as const

export const PRICE_BANDS = [
  { label: 'Under $50', value: 'under-50', max: 50 },
  { label: '$50 – $100', value: '50-100', min: 50, max: 100 },
  { label: '$100 – $150', value: '100-150', min: 100, max: 150 },
  { label: '$150 and up', value: 'over-150', min: 150 },
] as const

export type ShopParams = {
  q?: string
  occasion?: string
  price?: string
  sort?: string
  page?: string
}

export const sortFor = (value?: string) =>
  SORT_OPTIONS.find((option) => option.value === value)?.sort ?? '-createdAt'

export const pageFor = (value?: string) => {
  const page = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(page) && page > 0 ? page : 1
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

  const band = PRICE_BANDS.find((option) => option.value === params.price)
  if (band) {
    const price: Record<string, number> = {}
    if ('min' in band && band.min !== undefined) price.greater_than_equal = band.min
    if ('max' in band && band.max !== undefined) price.less_than_equal = band.max
    and.push({ price })
  }

  return and.length ? { and } : {}
}
