'use server'

import { cookies } from 'next/headers'

import { getCurrentCustomer } from '@/lib/auth'
import { buildOrderData, type CheckoutInput, type RepricedLine } from '@/lib/order'
import { ORDER_COOKIE } from '@/lib/orderCookie'
import { getPayloadClient } from '@/lib/payload'
import { withinRateLimit } from '@/lib/rateLimit'

export type CheckoutResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string; repriced?: RepricedLine[] }

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  if (!(await withinRateLimit('order', { max: 10, windowMs: 60 * 60 * 1000 }))) {
    return { ok: false, error: 'That is a lot of orders at once. Please call us instead.' }
  }

  const payload = await getPayloadClient()
  const customer = await getCurrentCustomer()

  const built = await buildOrderData(payload, {
    ...input,
    // Never trust a user id from the browser — take it from the session.
    userId: customer?.id,
  })

  if (!built.ok) return built

  const order = await payload.create({
    collection: 'orders',
    data: built.data as never,
    overrideAccess: true,
  })

  // The confirmation page is gated on this cookie so order numbers cannot be guessed.
  ;(await cookies()).set(ORDER_COOKIE, order.orderNumber ?? '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return { ok: true, orderNumber: order.orderNumber ?? '' }
}
