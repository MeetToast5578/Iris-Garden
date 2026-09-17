import type { Product } from '@/payload-types'

import { firstImage } from './media'
import { toCents } from './money'

export type CardProduct = {
  id: number
  slug: string
  title: string
  shortDescription: string
  /** cents */
  price: number
  image: { src: string; alt: string; width: number; height: number } | null
  inStock: boolean
  /** cards with sizes send you to the product page instead of quick-adding */
  hasSizes: boolean
}

export const toCard = (product: Product): CardProduct => ({
  id: product.id,
  slug: product.slug,
  title: product.title,
  shortDescription: product.shortDescription,
  price: toCents(product.price),
  image: firstImage(product.images),
  inStock: Boolean(product.inStock),
  hasSizes: Boolean(product.sizes?.length),
})
