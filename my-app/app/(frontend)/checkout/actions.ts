'use server'

import { cookies } from 'next/headers'

import { buildOrderData, type CheckoutInput } from '@/lib/order'
import { getPayloadClient } from '@/lib/payload'

export type CheckoutResult = { ok: true; orderNumber: string } | { ok: false; error: string }

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const payload = await getPayloadClient()

  const built = await buildOrderData(payload, input)
  if (!built.ok) return built

  const order = await payload.create({
    collection: 'orders',
    data: built.data as never,
  })

  // The confirmation page is gated on this cookie so order numbers cannot be guessed.
  ;(await cookies()).set('iris-order', order.orderNumber ?? '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return { ok: true, orderNumber: order.orderNumber ?? '' }
}
