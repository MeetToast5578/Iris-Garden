'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { ORDER_COOKIE } from '@/lib/orderCookie'
import { getPayloadClient } from '@/lib/payload'
import { withinRateLimit } from '@/lib/rateLimit'
import { isValidEmail } from '@/lib/validate'

export type LookupResult = { error: string } | null

/**
 * Order number plus the email it was placed with. Both must match, and the
 * attempt is rate limited, so this cannot be used to walk order numbers.
 */
export async function lookupOrder(_state: LookupResult, form: FormData): Promise<LookupResult> {
  if (!(await withinRateLimit('order-lookup', { max: 10, windowMs: 15 * 60 * 1000 }))) {
    return { error: 'Too many attempts. Please try again in a few minutes.' }
  }

  const orderNumber = String(form.get('orderNumber') ?? '')
    .trim()
    .toUpperCase()
  const email = String(form.get('email') ?? '')
    .trim()
    .toLowerCase()

  if (!orderNumber || !isValidEmail(email)) {
    return { error: 'Enter your order number and the email you ordered with.' }
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'orders',
    where: {
      and: [{ orderNumber: { equals: orderNumber } }, { 'customer.email': { equals: email } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (result.docs.length === 0) {
    return { error: 'We could not find an order with those details.' }
  }

  ;(await cookies()).set(ORDER_COOKIE, orderNumber, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  redirect(`/order/${orderNumber}`)
}
