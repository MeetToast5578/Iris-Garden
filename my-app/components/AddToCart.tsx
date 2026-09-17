'use client'

import { useState } from 'react'

import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/money'

export type SizeOption = { label: string; price: number }

type Props = {
  productId: number
  slug: string
  title: string
  image: string | null
  basePrice: number
  sizes: SizeOption[]
  inStock: boolean
}

export function AddToCart({ productId, slug, title, image, basePrice, sizes, inStock }: Props) {
  const { add } = useCart()
  // Default to the size priced at the base price, so the product card and the
  // selector never disagree about what this bouquet costs.
  const [sizeIndex, setSizeIndex] = useState(() => {
    const index = sizes.findIndex((size) => size.price === basePrice)
    return index >= 0 ? index : 0
  })
  const [quantity, setQuantity] = useState(1)

  const selected = sizes[sizeIndex]
  const unitPrice = selected ? selected.price : basePrice

  if (!inStock) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-paper-dim p-5 text-sm text-ink-soft">
        This bouquet is sold out for now. Call us and we will suggest something close.
      </div>
    )
  }

  return (
    <div className="mt-8">
      {sizes.length > 0 && (
        <fieldset>
          <legend className="label">Size</legend>
          <div className="flex flex-wrap gap-2.5">
            {sizes.map((size, index) => (
              <button
                key={size.label}
                type="button"
                onClick={() => setSizeIndex(index)}
                aria-pressed={index === sizeIndex}
                className={`rounded-full border px-5 py-2.5 text-sm transition-colors ${
                  index === sizeIndex
                    ? 'border-moss bg-moss text-paper'
                    : 'border-line text-ink-soft hover:border-moss hover:text-ink'
                }`}
              >
                {size.label} · {formatPrice(size.price)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <p className="mt-6 font-display text-3xl tabular-nums">{formatPrice(unitPrice * quantity)}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-line">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="px-4 py-2.5 text-ink-soft hover:text-ink"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="min-w-8 text-center tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(99, value + 1))}
            className="px-4 py-2.5 text-ink-soft hover:text-ink"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="btn-primary flex-1 sm:flex-none sm:px-10"
          onClick={() =>
            add(
              {
                productId,
                slug,
                title,
                image,
                size: selected?.label ?? null,
                unitPrice,
              },
              quantity,
            )
          }
        >
          Add to cart
        </button>
      </div>
    </div>
  )
}
