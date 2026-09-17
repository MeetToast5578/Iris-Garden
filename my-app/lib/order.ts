import type { Payload } from 'payload'

import { toCents } from './money'

export type CheckoutLine = { productId: number; size: string | null; quantity: number }

export type CheckoutInput = {
  lines: CheckoutLine[]
  customer: { name: string; email: string; phone: string }
  delivery: {
    method: 'delivery' | 'pickup'
    recipientName?: string
    recipientPhone?: string
    address?: string
    city?: string
    date?: string
    timeSlot?: string
    giftMessage?: string
    notes?: string
  }
}

type OrderItem = {
  product: number
  title: string
  size: string | null
  unitPrice: number
  quantity: number
}

export type OrderData = {
  status: 'pending'
  paymentMethod: 'cash-on-delivery'
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  customer: { name: string; email: string; phone: string }
  delivery: Record<string, string | null>
}

export type BuildResult = { ok: true; data: OrderData } | { ok: false; error: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Turns whatever the browser posted into an order the studio can trust.
 *
 * The client sends product ids, sizes and quantities and nothing else — every
 * price, the delivery fee and the total are read back out of the database here,
 * so a tampered payload cannot change what the customer pays.
 */
export const buildOrderData = async (
  payload: Payload,
  input: CheckoutInput,
): Promise<BuildResult> => {
  const { lines, customer, delivery } = input

  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: 'Your cart is empty.' }
  }
  if (!customer?.name?.trim()) {
    return { ok: false, error: 'Please tell us your name.' }
  }
  if (!EMAIL.test(customer?.email ?? '')) {
    return { ok: false, error: 'That email does not look right.' }
  }
  if (!customer?.phone?.trim()) {
    return { ok: false, error: 'We need a phone number for the courier.' }
  }
  if (delivery?.method === 'delivery' && !delivery.address?.trim()) {
    return { ok: false, error: 'Please add a delivery address.' }
  }

  const items: OrderItem[] = []

  for (const line of lines) {
    const quantity = Math.floor(Number(line.quantity))
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false, error: 'One of the quantities is not valid.' }
    }

    let product
    try {
      product = await payload.findByID({ collection: 'products', id: line.productId, depth: 0 })
    } catch {
      return { ok: false, error: 'One of the bouquets is no longer available.' }
    }

    if (!product.inStock) {
      return { ok: false, error: `${product.title} just sold out. Please remove it and try again.` }
    }

    let unitPrice = toCents(product.price)

    if (product.sizes?.length) {
      const size = product.sizes.find((option) => option.label === line.size)
      if (!size) {
        return { ok: false, error: `Please choose a size for ${product.title}.` }
      }
      unitPrice += toCents(size.priceDelta ?? 0)
    }

    items.push({ product: product.id, title: product.title, size: line.size, unitPrice, quantity })
  }

  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const threshold = toCents(settings.freeDeliveryThreshold ?? 0)
  const freeDelivery = threshold > 0 && subtotal >= threshold

  const deliveryFee =
    delivery.method === 'pickup' || freeDelivery ? 0 : toCents(settings.deliveryFee ?? 0)

  return {
    ok: true,
    data: {
      status: 'pending',
      paymentMethod: 'cash-on-delivery',
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
      },
      delivery: {
        method: delivery.method,
        recipientName: delivery.recipientName?.trim() || null,
        recipientPhone: delivery.recipientPhone?.trim() || null,
        address: delivery.address?.trim() || null,
        city: delivery.city?.trim() || null,
        date: delivery.date || null,
        timeSlot: delivery.timeSlot || null,
        giftMessage: delivery.giftMessage?.trim() || null,
        notes: delivery.notes?.trim() || null,
      },
    },
  }
}
