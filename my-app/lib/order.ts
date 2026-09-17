import type { Payload } from 'payload'

import { toCents } from './money'
import { isValidEmail, isValidPhone, MAX_QUANTITY } from './validate'

export type CheckoutLine = {
  productId: number
  size: string | null
  quantity: number
  /** cents the browser last showed for this line — used only to detect drift */
  expectedUnitPrice: number
}

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
  /** set when a signed-in customer is checking out */
  userId?: number
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
  user?: number
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  customer: { name: string; email: string; phone: string }
  delivery: Record<string, string | null>
}

/** A line whose real price no longer matches what the browser was showing. */
export type RepricedLine = { productId: number; size: string | null; unitPrice: number }

export { MAX_QUANTITY }

export type BuildResult =
  | { ok: true; data: OrderData }
  | { ok: false; error: string; repriced?: RepricedLine[] }

/**
 * The first date the studio can still deliver on.
 *
 * ponytail: uses the server's local clock, which is right for a single-city
 * florist and wrong the day you open a second branch in another timezone.
 * Store an IANA zone on Settings when that happens.
 */
export const earliestDeliveryDate = (cutoffHour: number, now = new Date()) => {
  const earliest = new Date(now)
  if (now.getHours() >= cutoffHour) earliest.setDate(earliest.getDate() + 1)
  return `${earliest.getFullYear()}-${String(earliest.getMonth() + 1).padStart(2, '0')}-${String(
    earliest.getDate(),
  ).padStart(2, '0')}`
}

/**
 * Turns whatever the browser posted into an order the studio can trust.
 *
 * The client sends product ids, sizes, quantities and the prices it last
 * displayed. Every price, the delivery fee and the total are read back out of
 * the database here. The displayed prices are compared but never used, so a
 * tampered payload cannot change what the customer pays — it can only ever
 * trigger the "prices changed" path.
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
  if (!isValidEmail(customer?.email ?? '')) {
    return { ok: false, error: 'That email does not look right.' }
  }
  if (!isValidPhone(customer?.phone ?? '')) {
    return { ok: false, error: 'Enter a phone number the courier can call.' }
  }
  if (delivery?.method === 'delivery' && !delivery.address?.trim()) {
    return { ok: false, error: 'Please add a delivery address.' }
  }
  if (delivery?.recipientPhone?.trim() && !isValidPhone(delivery.recipientPhone)) {
    return { ok: false, error: "The recipient's phone number does not look right." }
  }

  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })

  if (delivery?.date) {
    const earliest = earliestDeliveryDate(settings.sameDayCutoffHour ?? 14)
    if (delivery.date.slice(0, 10) < earliest) {
      return {
        ok: false,
        error: `We can no longer make that date. The earliest we can deliver is ${earliest}.`,
      }
    }
  }

  const items: OrderItem[] = []
  const repriced: RepricedLine[] = []

  for (const line of lines) {
    const quantity = Math.floor(Number(line.quantity))
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
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

    if (Number(line.expectedUnitPrice) !== unitPrice) {
      repriced.push({ productId: product.id, size: line.size, unitPrice })
    }

    items.push({ product: product.id, title: product.title, size: line.size, unitPrice, quantity })
  }

  // Never silently charge a total the customer has not seen.
  if (repriced.length > 0) {
    return {
      ok: false,
      error:
        repriced.length === 1
          ? 'One item changed price while it was in your cart. Please check the new total before ordering.'
          : 'Some items changed price while they were in your cart. Please check the new total before ordering.',
      repriced,
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const threshold = toCents(settings.freeDeliveryThreshold ?? 0)
  const freeDelivery = threshold > 0 && subtotal >= threshold

  const zone = (settings.deliveryZones ?? []).find((option) => option.name === delivery.city)
  const zoneFee = zone?.fee ?? null
  const standardFee = toCents(settings.deliveryFee ?? 0)

  const deliveryFee =
    delivery.method === 'pickup' || freeDelivery
      ? 0
      : zoneFee !== null && zoneFee !== undefined
        ? toCents(zoneFee)
        : standardFee

  return {
    ok: true,
    data: {
      status: 'pending',
      paymentMethod: 'cash-on-delivery',
      ...(input.userId ? { user: input.userId } : {}),
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

