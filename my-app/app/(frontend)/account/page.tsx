import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PasswordForm, ProfileForm } from '@/components/AccountForms'
import { getCurrentCustomer } from '@/lib/auth'
import { formatPrice } from '@/lib/money'
import { getPayloadClient } from '@/lib/payload'

import { signOut } from './actions'

export const metadata: Metadata = { title: 'Your account', robots: { index: false } }

export default async function AccountPage() {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/account/login?redirectTo=/account')

  const payload = await getPayloadClient()
  const orders = await payload.find({
    collection: 'orders',
    where: { user: { equals: customer.id } },
    sort: '-createdAt',
    limit: 3,
    depth: 0,
    overrideAccess: true,
  })

  return (
    <div className="shell max-w-3xl py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-3 text-4xl">{customer.name}</h1>
          <p className="mt-2 text-sm text-ink-soft">{customer.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="btn-secondary">
            Sign out
          </button>
        </form>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Details</h2>
        <p className="mt-1 mb-5 text-sm text-ink-soft">
          These prefill the checkout, so you only type them once.
        </p>
        <ProfileForm
          defaults={{
            name: customer.name ?? '',
            phone: customer.phone ?? '',
            address: customer.address ?? '',
            city: customer.city ?? '',
          }}
        />
      </section>

      <section className="mt-14 border-t border-line pt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">Recent orders</h2>
          {orders.totalDocs > 3 && (
            <Link href="/account/orders" className="text-sm text-moss underline underline-offset-4">
              See all {orders.totalDocs}
            </Link>
          )}
        </div>

        {orders.docs.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            Nothing yet.{' '}
            <Link href="/shop" className="text-moss underline underline-offset-4">
              Pick a bouquet
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {orders.docs.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-ink-soft capitalize">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {' · '}
                    {order.status.replace(/-/g, ' ')}
                  </p>
                </div>
                <span className="text-sm tabular-nums">{formatPrice(order.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14 border-t border-line pt-10">
        <h2 className="font-display text-2xl">Password</h2>
        <p className="mt-1 mb-5 text-sm text-ink-soft">
          If you signed up through Google you can set a password here to sign in either way.
        </p>
        <PasswordForm />
      </section>
    </div>
  )
}
