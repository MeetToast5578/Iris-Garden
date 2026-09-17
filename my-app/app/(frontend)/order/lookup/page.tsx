import type { Metadata } from 'next'
import Link from 'next/link'

import { OrderLookupForm } from '@/components/OrderLookupForm'

export const metadata: Metadata = { title: 'Find your order', robots: { index: false } }

export default function OrderLookupPage() {
  return (
    <div className="shell max-w-md py-16">
      <p className="eyebrow">Order status</p>
      <h1 className="mt-3 text-4xl">Find your order</h1>
      <p className="mt-3 text-sm text-ink-soft">
        The order number is in your confirmation email and starts with IG-.
      </p>

      <OrderLookupForm />

      <p className="mt-6 text-sm text-ink-soft">
        Have an account?{' '}
        <Link href="/account/orders" className="text-moss underline underline-offset-4">
          See all your orders
        </Link>
      </p>
    </div>
  )
}
