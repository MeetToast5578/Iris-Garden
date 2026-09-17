import type { Metadata } from 'next'
import { Suspense } from 'react'

import { CategoryNav } from '@/components/CategoryNav'
import { ShopResults } from '@/components/ShopResults'
import { occasionLabel } from '@/lib/occasions'
import type { ShopParams } from '@/lib/shop'

export const metadata: Metadata = {
  title: 'All bouquets',
  description: 'Every hand-tied bouquet currently in the studio, ready for same-day delivery.',
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopParams>
}) {
  const params = await searchParams

  const heading = params.q
    ? `Results for “${params.q}”`
    : params.occasion
      ? `Flowers for ${occasionLabel(params.occasion).toLowerCase()}`
      : 'All bouquets'

  return (
    <div className="shell py-12">
      <p className="eyebrow">Shop</p>
      <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl">{heading}</h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Arranged the morning they go out. Pick a style, we will take care of the rest.
      </p>

      <div className="mt-9">
        <CategoryNav />
      </div>

      <div className="mt-8">
        <Suspense fallback={<div className="py-24 text-center text-ink-soft">Loading…</div>}>
          <ShopResults basePath="/shop" params={params} />
        </Suspense>
      </div>
    </div>
  )
}
