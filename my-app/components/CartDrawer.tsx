'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/money'


/** Native <dialog> gives us the focus trap, the Escape key and the backdrop for free. */
export function CartDrawer({ freeDeliveryThreshold = 0 }: { freeDeliveryThreshold?: number }) {
  const { items, isOpen, close, setQuantity, remove, subtotal } = useCart()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onClick={(event) => {
        if (event.target === dialogRef.current) close()
      }}
      aria-label="Shopping cart"
      className="fixed inset-y-0 right-0 m-0 h-dvh max-h-dvh w-full max-w-[26rem] flex-col
                 bg-paper text-ink shadow-2xl backdrop:bg-ink/40 open:flex"
    >
      <header className="flex items-center justify-between border-b border-line px-6 py-5">
        <h2 className="text-xl">Your cart</h2>
        <button
          type="button"
          onClick={close}
          className="rounded-full p-2 text-ink-soft transition-colors hover:bg-paper-dim hover:text-ink"
          aria-label="Close cart"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-ink-soft">Nothing picked yet.</p>
          <Link href="/shop" onClick={close} className="btn-primary">
            Browse bouquets
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
            {items.map((line) => (
              <li key={line.key} className="flex gap-4 py-5">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-paper-dim">
                  {line.image && (
                    <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/product/${line.slug}`}
                    onClick={close}
                    className="truncate text-sm font-medium hover:text-moss"
                  >
                    {line.title}
                  </Link>
                  {line.size && <p className="mt-0.5 text-xs text-ink-soft">{line.size}</p>}

                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-line">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.key, line.quantity - 1)}
                        className="px-3 py-1 text-ink-soft hover:text-ink"
                        aria-label={`Decrease quantity of ${line.title}`}
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.key, line.quantity + 1)}
                        className="px-3 py-1 text-ink-soft hover:text-ink"
                        aria-label={`Increase quantity of ${line.title}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatPrice(line.unitPrice * line.quantity)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(line.key)}
                  className="self-start text-xs text-ink-soft underline-offset-4 hover:text-blush hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <footer className="border-t border-line px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-ink-soft">Subtotal</span>
              <span className="font-display text-2xl tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            {freeDeliveryThreshold > 0 && subtotal < freeDeliveryThreshold ? (
              <p className="mt-1 text-xs text-ink-soft">
                {formatPrice(freeDeliveryThreshold - subtotal)} more for free delivery.
              </p>
            ) : freeDeliveryThreshold > 0 ? (
              <p className="mt-1 text-xs text-moss">Delivery is free on this order.</p>
            ) : (
              <p className="mt-1 text-xs text-ink-soft">Delivery is calculated at checkout.</p>
            )}
            <Link href="/checkout" onClick={close} className="btn-primary mt-4 w-full">
              Checkout
            </Link>
          </footer>
        </>
      )}
    </dialog>
  )
}
