'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { OCCASIONS } from '@/lib/occasions'
import { SORT_OPTIONS, type PriceBand } from '@/lib/shop'

const chipBase =
  'inline-block rounded-full border px-4 py-2 text-sm transition-colors cursor-pointer'

export function ShopFilters({
  resultCount,
  priceBands,
}: {
  resultCount: number
  priceBands: PriceBand[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /** Toggling a filter always resets pagination, otherwise you land on an empty page 3. */
  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString())
    if (value === null || next.get(key) === value) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    const query = next.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const occasion = searchParams.get('occasion')
  const price = searchParams.get('price')
  const hasFilters = Boolean(occasion || price || searchParams.get('q'))

  const chip = (active: boolean) =>
    `${chipBase} ${
      active
        ? 'border-moss bg-moss text-paper'
        : 'border-line bg-paper text-ink-soft hover:border-moss hover:text-ink'
    }`

  return (
    <div className="border-y border-line py-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-2">Occasion</span>
        {OCCASIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => update('occasion', option.value)}
            aria-pressed={occasion === option.value}
            className={chip(occasion === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {priceBands.length > 0 && (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-2">Price</span>
        {priceBands.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => update('price', option.value)}
            aria-pressed={price === option.value}
            className={chip(price === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink-soft">
          {resultCount} {resultCount === 1 ? 'bouquet' : 'bouquets'}
          {hasFilters && (
            <button
              type="button"
              onClick={() => router.push(pathname, { scroll: false })}
              className="ml-3 text-moss underline underline-offset-4 hover:text-ink"
            >
              Clear filters
            </button>
          )}
        </p>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Sort
          <select
            value={searchParams.get('sort') ?? 'newest'}
            onChange={(event) => update('sort', event.target.value)}
            className="rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink focus:border-moss focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
