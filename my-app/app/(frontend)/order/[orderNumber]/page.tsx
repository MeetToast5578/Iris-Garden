import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { formatPrice } from '@/lib/money'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Order placed',
  robots: { index: false },
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params

  // Only the browser that placed the order holds this cookie, so order
  // numbers cannot be walked to read someone else's delivery address.
  const cookie = (await cookies()).get('iris-order')?.value
  if (cookie !== orderNumber) notFound()

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: orderNumber } },
    limit: 1,
    depth: 0,
  })

  const order = result.docs[0]
  if (!order) notFound()

  return (
    <div className="shell max-w-2xl py-20">
      <div className="rounded-[2rem] bg-petal px-6 py-12 text-center sm:px-12">
        <p className="eyebrow">Order {order.orderNumber}</p>
        <h1 className="mt-4 text-4xl sm:text-5xl">Thank you</h1>
        <p className="mt-4 text-ink-soft">
          We have your order and will call {order.customer.phone} shortly to confirm the details.
        </p>
      </div>

      <dl className="mt-10 divide-y divide-line border-y border-line">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between gap-4 py-4">
            <dt className="text-sm">
              {item.title}
              <span className="block text-xs text-ink-soft">
                {item.size ? `${item.size} · ` : ''}Qty {item.quantity}
              </span>
            </dt>
            <dd className="text-sm tabular-nums">
              {formatPrice(item.unitPrice * item.quantity)}
            </dd>
          </div>
        ))}
      </dl>

      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">Delivery</dt>
          <dd className="tabular-nums">
            {order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base">
          <dt>Total, due on delivery</dt>
          <dd className="font-display text-xl tabular-nums">{formatPrice(order.total)}</dd>
        </div>
      </dl>

      {order.delivery?.method === 'delivery' && order.delivery.address && (
        <p className="mt-8 text-sm text-ink-soft">
          Delivering to {order.delivery.address}
          {order.delivery.city ? `, ${order.delivery.city}` : ''}
          {order.delivery.date
            ? ` on ${new Date(order.delivery.date).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
              })}`
            : ''}
          {order.delivery.timeSlot ? `, ${order.delivery.timeSlot}` : ''}.
        </p>
      )}

      <Link href="/shop" className="btn-secondary mt-10">
        Keep browsing
      </Link>
    </div>
  )
}
