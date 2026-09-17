'use client'

import Image from 'next/image'
import Link from 'next/link'

import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/money'
import type { CardProduct } from '@/lib/product'

export function ProductCard({ product, priority }: { product: CardProduct; priority?: boolean }) {
  const { add } = useCart()

  return (
    <article className="group flex flex-col">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-paper-dim"
      >
        {product.image ? (
          <Image
            src={product.image.src}
            alt={product.image.alt || product.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            placeholder={product.image.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={product.image.blurDataURL}
            className="object-cover transition-transform duration-700 ease-soft group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-soft">
            No photo yet
          </div>
        )}

        {!product.inStock && (
          <span className="absolute top-3 left-3 rounded-full bg-paper/90 px-3 py-1 text-xs text-ink-soft">
            Sold out
          </span>
        )}
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-lg leading-snug">
          <Link href={`/product/${product.slug}`} className="hover:text-moss">
            {product.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{product.shortDescription}</p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-display text-lg tabular-nums">{formatPrice(product.price)}</span>

          {!product.inStock ? (
            <span className="text-xs text-ink-soft">Unavailable</span>
          ) : product.hasSizes ? (
            <Link
              href={`/product/${product.slug}`}
              className="rounded-full border border-line px-4 py-1.5 text-xs transition-colors hover:border-moss hover:bg-moss hover:text-paper"
            >
              Choose size
            </Link>
          ) : (
            <button
              type="button"
              onClick={() =>
                add({
                  productId: product.id,
                  slug: product.slug,
                  title: product.title,
                  image: product.image?.src ?? null,
                  size: null,
                  unitPrice: product.price,
                })
              }
              className="rounded-full border border-line px-4 py-1.5 text-xs transition-colors hover:border-moss hover:bg-moss hover:text-paper"
            >
              Add to cart
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
