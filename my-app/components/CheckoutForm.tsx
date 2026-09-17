'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { placeOrder } from '@/app/(frontend)/checkout/actions'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/money'

const TIME_SLOTS = ['09:00 – 12:00', '12:00 – 15:00', '15:00 – 18:00', '18:00 – 21:00']

type Props = {
  deliveryFee: number
  freeDeliveryThreshold: number
  zones: string[]
  pickupAddress?: string
}

export function CheckoutForm({ deliveryFee, freeDeliveryThreshold, zones, pickupAddress }: Props) {
  const { items, subtotal, clear } = useCart()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [method, setMethod] = useState<'delivery' | 'pickup'>('delivery')

  const freeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold
  const fee = method === 'pickup' || freeDelivery ? 0 : deliveryFee
  const total = subtotal + fee
  const today = new Date().toISOString().slice(0, 10)

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-2xl">Your cart is empty</p>
        <p className="mt-2 text-ink-soft">Pick a bouquet and it will show up here.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Browse bouquets
        </Link>
      </div>
    )
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) ?? '').trim()

    startTransition(async () => {
      const result = await placeOrder({
        lines: items.map((line) => ({
          productId: line.productId,
          size: line.size,
          quantity: line.quantity,
        })),
        customer: {
          name: value('name'),
          email: value('email'),
          phone: value('phone'),
        },
        delivery: {
          method,
          recipientName: value('recipientName'),
          recipientPhone: value('recipientPhone'),
          address: value('address'),
          city: value('city'),
          date: value('date'),
          timeSlot: value('timeSlot'),
          giftMessage: value('giftMessage'),
          notes: value('notes'),
        },
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      clear()
      router.push(`/order/${result.orderNumber}`)
    })
  }

  const methodOptions = [
    { value: 'delivery' as const, title: 'Courier delivery', body: 'To any address in our zones' },
    {
      value: 'pickup' as const,
      title: 'Pick up in store',
      body: pickupAddress ?? 'From the studio',
    },
  ]

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
      <div className="space-y-10">
        <fieldset>
          <legend className="font-display text-2xl">Your details</legend>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input id="name" name="name" required autoComplete="name" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                className="field"
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl">How should it arrive?</legend>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {methodOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                  method === option.value
                    ? 'border-moss bg-petal/40'
                    : 'border-line hover:border-moss'
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={option.value}
                  checked={method === option.value}
                  onChange={() => setMethod(option.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-medium">{option.title}</span>
                <span className="mt-1 block text-xs text-ink-soft">{option.body}</span>
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {method === 'delivery' && (
              <>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="address">
                    Delivery address
                  </label>
                  <input
                    id="address"
                    name="address"
                    required
                    autoComplete="street-address"
                    placeholder="Street, building, apartment"
                    className="field"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="city">
                    City
                  </label>
                  {zones.length > 0 ? (
                    <select id="city" name="city" className="field" defaultValue={zones[0]}>
                      {zones.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input id="city" name="city" className="field" autoComplete="address-level2" />
                  )}
                </div>
              </>
            )}

            <div>
              <label className="label" htmlFor="date">
                Preferred date
              </label>
              <input id="date" name="date" type="date" min={today} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="timeSlot">
                Time
              </label>
              <select id="timeSlot" name="timeSlot" className="field" defaultValue="">
                <option value="">Any time</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl">Is it a gift?</legend>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="recipientName">
                Recipient name
              </label>
              <input id="recipientName" name="recipientName" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="recipientPhone">
                Recipient phone
              </label>
              <input id="recipientPhone" name="recipientPhone" type="tel" className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="giftMessage">
                Card message
              </label>
              <textarea id="giftMessage" name="giftMessage" rows={3} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="notes">
                Anything else we should know?
              </label>
              <textarea id="notes" name="notes" rows={2} className="field" />
            </div>
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[1.75rem] border border-line bg-paper-dim p-6">
          <h2 className="font-display text-2xl">Order summary</h2>

          <ul className="mt-5 space-y-4">
            {items.map((line) => (
              <li key={line.key} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-paper">
                  {line.image && (
                    <Image src={line.image} alt="" fill sizes="56px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate">{line.title}</p>
                  <p className="text-xs text-ink-soft">
                    {line.size ? `${line.size} · ` : ''}Qty {line.quantity}
                  </p>
                </div>
                <span className="text-sm tabular-nums">
                  {formatPrice(line.unitPrice * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Delivery</dt>
              <dd className="tabular-nums">{fee === 0 ? 'Free' : formatPrice(fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt>Total</dt>
              <dd className="font-display text-xl tabular-nums">{formatPrice(total)}</dd>
            </div>
          </dl>

          {!freeDelivery && freeDeliveryThreshold > 0 && method === 'delivery' && (
            <p className="mt-3 text-xs text-ink-soft">
              Spend {formatPrice(freeDeliveryThreshold - subtotal)} more for free delivery.
            </p>
          )}

          <p className="mt-5 rounded-xl bg-paper p-3 text-xs text-ink-soft">
            Payment is cash or card to the courier on delivery. We call to confirm before we set
            off.
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-petal p-3 text-sm text-moss">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary mt-5 w-full">
            {pending ? 'Placing order…' : 'Place order'}
          </button>
        </div>
      </aside>
    </form>
  )
}
