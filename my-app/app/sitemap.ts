import type { MetadataRoute } from 'next'

import { getPayloadClient } from '@/lib/payload'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const [products, categories] = await Promise.all([
    payload.find({ collection: 'products', limit: 1000, depth: 0 }),
    payload.find({ collection: 'categories', limit: 100, depth: 0 }),
  ])

  return [
    ...['', '/shop', '/delivery', '/about', '/contact'].map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
    })),
    ...categories.docs.map((category) => ({
      url: `${siteUrl}/shop/${category.slug}`,
      lastModified: new Date(category.updatedAt),
    })),
    ...products.docs.map((product) => ({
      url: `${siteUrl}/product/${product.slug}`,
      lastModified: new Date(product.updatedAt),
    })),
  ]
}
