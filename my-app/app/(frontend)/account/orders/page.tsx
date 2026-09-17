import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getCurrentCustomer } from '@/lib/auth'
import { formatPrice } from '@/lib/money'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Your orders', robots: { index: false } }

export default async function OrdersPage() {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/account/login?redirectTo=/account/orders')

  const payload = await getPayloadClient()
  const orders = await payload.find({
    collection: 'orders',
    where: { user: { equals: customer.id } },
    sort: '-createdAt',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  return (
    <div className="shell max-w-3xl py-14">
      <p className="eyebrow">
        <Link href="/account" className="hover:text-moss">
          Your account
        </Link>
      </p>
      <h1 className="mt-3 text-4xl">Orders</h1>

      {orders.docs.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          You have not ordered anything yet.{' '}
          <Link href="/shop" className="text-moss underline underline-offset-4">
            Browse bouquets
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-10 space-y-5">
          {orders.docs.map((order) => (
            <li key={order.id} className="rounded-2xl border border-line p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="font-display text-lg">{order.orderNumber}</p>
                  <p className="text-xs text-ink-soft">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="rounded-full bg-paper-dim px-3 py-1 text-xs capitalize">
                  {order.status.replace(/-/g, ' ')}
                </span>
              </div>

              <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between gap-4">
                    <span>
                      {item.title}
                      {item.size ? ` · ${item.size}` : ''} × {item.quantity}
                    </span>
                    <span className="tabular-nums">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 flex justify-between border-t border-line pt-3 text-sm">
                <span className="text-ink-soft">Total</span>
                <span className="font-display text-lg tabular-nums">
                  {formatPrice(order.total)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
