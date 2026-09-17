import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AddToCart } from '@/components/AddToCart'
import { ProductCard } from '@/components/ProductCard'
import { ProductGallery } from '@/components/ProductGallery'
import { firstImage, imageOf } from '@/lib/media'
import { occasionLabel } from '@/lib/occasions'
import { getPayloadClient } from '@/lib/payload'
import { toCents } from '@/lib/money'
import { toCard } from '@/lib/product'

type Props = { params: Promise<{ slug: string }> }

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/** Prerender every product; Payload hooks purge them when an admin saves. */
export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'products', limit: 500, depth: 0 })
  return docs.map((product) => ({ slug: product.slug }))
}

export const revalidate = 3600

const findProduct = async (slug: string) => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return result.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await findProduct((await params).slug)
  if (!product) return { title: 'Not found' }

  const image = firstImage(product.images, 'hero')

  return {
    title: product.title,
    description: product.shortDescription,
    openGraph: {
      title: product.title,
      description: product.shortDescription,
      images: image ? [{ url: image.src }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const product = await findProduct((await params).slug)
  if (!product) notFound()

  const payload = await getPayloadClient()
  const category = typeof product.category === 'object' ? product.category : null

  const related = await payload.find({
    collection: 'products',
    where: {
      and: [
        { id: { not_equals: product.id } },
        ...(category ? [{ category: { equals: category.id } }] : []),
      ],
    },
    limit: 4,
    depth: 1,
  })

  const images = (Array.isArray(product.images) ? product.images : [])
    .map((image) => imageOf(image, 'hero'))
    .filter((image): image is NonNullable<typeof image> => Boolean(image))

  const basePrice = toCents(product.price)
  const sizes = (product.sizes ?? []).map((size) => ({
    label: size.label,
    price: basePrice + toCents(size.priceDelta ?? 0),
  }))

  // Structured data is what puts the price and the in-stock badge on the
  // Google result rather than a bare blue link.
  const offer =
    sizes.length > 0
      ? {
          '@type': 'AggregateOffer',
          lowPrice: (Math.min(...sizes.map((size) => size.price)) / 100).toFixed(2),
          highPrice: (Math.max(...sizes.map((size) => size.price)) / 100).toFixed(2),
          offerCount: sizes.length,
        }
      : { '@type': 'Offer', price: (basePrice / 100).toFixed(2) }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.shortDescription,
    image: images.map((image) => new URL(image.src, siteUrl).toString()),
    brand: { '@type': 'Brand', name: 'Iris Garden' },
    ...(category ? { category: category.title } : {}),
    offers: {
      ...offer,
      priceCurrency: 'USD',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/product/${product.slug}`,
    },
  }

  return (
    <div className="shell py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
        <Link href="/shop" className="hover:text-moss">
          Shop
        </Link>
        {category && (
          <>
            <span aria-hidden="true"> / </span>
            <Link href={`/shop/${category.slug}`} className="hover:text-moss">
              {category.title}
            </Link>
          </>
        )}
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{product.title}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={images} title={product.title} />

        <div className="lg:pt-6">
          {category && <p className="eyebrow">{category.title}</p>}
          <h1 className="mt-3 text-4xl sm:text-5xl">{product.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">{product.shortDescription}</p>

          <AddToCart
            productId={product.id}
            slug={product.slug}
            title={product.title}
            image={firstImage(product.images, 'card')?.src ?? null}
            basePrice={basePrice}
            sizes={sizes}
            inStock={Boolean(product.inStock)}
          />

          {product.composition && (
            <div className="mt-10 border-t border-line pt-6">
              <h2 className="eyebrow font-sans">In this bouquet</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{product.composition}</p>
            </div>
          )}

          {product.description && (
            <div className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft [&_a]:text-moss [&_a]:underline [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:text-ink [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
              <RichText data={product.description} />
            </div>
          )}

          {product.occasions && product.occasions.length > 0 && (
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="eyebrow font-sans">Good for</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.occasions.map((occasion) => (
                  <li key={occasion}>
                    <Link
                      href={`/shop?occasion=${occasion}`}
                      className="inline-block rounded-full border border-line px-4 py-1.5 text-xs text-ink-soft transition-colors hover:border-moss hover:text-ink"
                    >
                      {occasionLabel(occasion)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {related.docs.length > 0 && (
        <section className="mt-24">
          <h2 className="text-3xl">You might also like</h2>
          <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.docs.map((item) => (
              <ProductCard key={item.id} product={toCard(item)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
