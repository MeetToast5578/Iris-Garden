import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { CategoryNav } from '@/components/CategoryNav'
import { ShopResults } from '@/components/ShopResults'
import { getPayloadClient } from '@/lib/payload'
import type { ShopParams } from '@/lib/shop'

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<ShopParams>
}

const findCategory = async (slug: string) => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return result.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await findCategory((await params).category)
  if (!category) return { title: 'Not found' }

  return {
    title: category.title,
    description: category.description ?? `${category.title} from Iris Garden, delivered fresh.`,
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category: slug }, shopParams] = await Promise.all([params, searchParams])
  const category = await findCategory(slug)
  if (!category) notFound()

  return (
    <div className="shell py-12">
      <p className="eyebrow">Shop</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">{category.title}</h1>
      {category.description && (
        <p className="mt-4 max-w-xl text-ink-soft">{category.description}</p>
      )}

      <div className="mt-9">
        <CategoryNav activeSlug={category.slug} />
      </div>

      <div className="mt-8">
        <Suspense fallback={<div className="py-24 text-center text-ink-soft">Loading…</div>}>
          <ShopResults
            basePath={`/shop/${category.slug}`}
            params={shopParams}
            categoryId={category.id}
          />
        </Suspense>
      </div>
    </div>
  )
}
