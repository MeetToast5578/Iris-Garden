import Link from 'next/link'

import { getPayloadClient } from '@/lib/payload'
import { toCard } from '@/lib/product'
import { PAGE_SIZE, pageFor, sortFor, whereFor, type ShopParams } from '@/lib/shop'

import { ProductCard } from './ProductCard'
import { ShopFilters } from './ShopFilters'

const hrefFor = (basePath: string, params: ShopParams, page: number) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== 'page') query.set(key, value)
  })
  if (page > 1) query.set('page', String(page))
  const search = query.toString()
  return search ? `${basePath}?${search}` : basePath
}

export async function ShopResults({
  basePath,
  params,
  categoryId,
}: {
  basePath: string
  params: ShopParams
  categoryId?: number
}) {
  const payload = await getPayloadClient()
  const page = pageFor(params.page)

  const results = await payload.find({
    collection: 'products',
    where: whereFor(params, categoryId),
    sort: sortFor(params.sort),
    limit: PAGE_SIZE,
    page,
    depth: 1,
  })

  return (
    <>
      <ShopFilters resultCount={results.totalDocs} />

      {results.docs.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-2xl">Nothing matches that yet</p>
          <p className="mt-2 text-ink-soft">Try a wider price range or a different occasion.</p>
          <Link href={basePath} className="btn-secondary mt-6">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.docs.map((product, index) => (
            <ProductCard key={product.id} product={toCard(product)} priority={index < 4} />
          ))}
        </div>
      )}

      {results.totalPages > 1 && (
        <nav className="mt-16 flex items-center justify-center gap-2" aria-label="Pagination">
          {results.hasPrevPage && (
            <Link href={hrefFor(basePath, params, page - 1)} className="btn-secondary">
              Previous
            </Link>
          )}
          {Array.from({ length: results.totalPages }, (_, index) => index + 1).map((number) => (
            <Link
              key={number}
              href={hrefFor(basePath, params, number)}
              aria-current={number === page ? 'page' : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors ${
                number === page
                  ? 'bg-moss text-paper'
                  : 'text-ink-soft hover:bg-paper-dim hover:text-ink'
              }`}
            >
              {number}
            </Link>
          ))}
          {results.hasNextPage && (
            <Link href={hrefFor(basePath, params, page + 1)} className="btn-secondary">
              Next
            </Link>
          )}
        </nav>
      )}
    </>
  )
}
