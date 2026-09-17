/**
 * The one check that has to exist: money.
 *
 *   npm run check
 *
 * Runs against the seeded database and asserts that order totals come from the
 * database rather than from anything the browser sent. Creates no orders.
 */
import assert from 'node:assert/strict'

import config from '@payload-config'
import { getPayload } from 'payload'

import { toCents } from '../lib/money'
import { buildOrderData, earliestDeliveryDate, type CheckoutInput } from '../lib/order'

const customer = { name: 'Test Buyer', email: 'test@example.com', phone: '+1 555 0100' }

const run = async () => {
  const payload = await getPayload({ config })

  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  const standardFee = toCents(settings.deliveryFee ?? 0)
  const threshold = toCents(settings.freeDeliveryThreshold ?? 0)
  const zones = settings.deliveryZones ?? []

  // Array fields are not queryable, so filter in memory.
  const all = await payload.find({ collection: 'products', limit: 200, depth: 0, sort: 'price' })
  const plain = all.docs.find((product) => !product.sizes?.length)
  const sized = all.docs.find((product) => product.sizes?.length)

  assert.ok(plain, 'seed a cheap product without sizes first: npm run seed')
  assert.ok(sized?.sizes?.length, 'seed a product with sizes first: npm run seed')

  const plainPrice = toCents(plain.price)
  const freeZone = zones.find((zone) => zone.fee === 0)
  const paidZone = zones.find((zone) => typeof zone.fee === 'number' && zone.fee > 0)

  const order = (
    lines: CheckoutInput['lines'],
    delivery: Partial<CheckoutInput['delivery']> = {},
  ): CheckoutInput => ({
    lines,
    customer,
    delivery: { method: 'delivery', address: '1 Test Street', ...delivery },
  })

  const line = (quantity = 1, expectedUnitPrice = plainPrice) => [
    { productId: plain.id, size: null, quantity, expectedUnitPrice },
  ]

  // 1. Prices come from the database, not the request.
  const two = await buildOrderData(payload, order(line(2)))
  assert.ok(two.ok, 'a valid order should build')
  assert.equal(two.data.items[0].unitPrice, plainPrice)
  assert.equal(two.data.subtotal, plainPrice * 2)
  assert.equal(two.data.total, two.data.subtotal + two.data.deliveryFee)

  // 2. A price the browser no longer agrees with stops the order instead of
  //    silently charging the difference.
  const drifted = await buildOrderData(payload, order(line(1, plainPrice - 500)))
  assert.equal(drifted.ok, false, 'a stale price must not go through')
  assert.ok(!drifted.ok && drifted.repriced?.length === 1, 'the real price must come back')
  assert.equal(!drifted.ok && drifted.repriced![0].unitPrice, plainPrice)

  // 3. A size that does not exist on the product is rejected outright.
  const forged = await buildOrderData(
    payload,
    order([{ productId: sized.id, size: 'Free', quantity: 1, expectedUnitPrice: 1 }]),
  )
  assert.equal(forged.ok, false, 'an unknown size must be rejected')

  // 4. A real size applies the delta stored on the product.
  const size = sized.sizes![0]
  const sizedPrice = toCents(sized.price) + toCents(size.priceDelta)
  const withSize = await buildOrderData(
    payload,
    order([
      { productId: sized.id, size: size.label, quantity: 1, expectedUnitPrice: sizedPrice },
    ]),
  )
  assert.ok(withSize.ok)
  assert.equal(withSize.data.items[0].unitPrice, sizedPrice)

  // 5. Quantities outside 1–99 are rejected rather than clamped.
  for (const quantity of [0, -3, 1000, Number.NaN]) {
    const result = await buildOrderData(payload, order(line(quantity)))
    assert.equal(result.ok, false, `quantity ${quantity} must be rejected`)
  }

  // 6. A product id that does not exist fails instead of pricing at zero.
  const missing = await buildOrderData(
    payload,
    order([{ productId: 999999, size: null, quantity: 1, expectedUnitPrice: 100 }]),
  )
  assert.equal(missing.ok, false, 'an unknown product must be rejected')

  // 7. Contact details are validated.
  assert.equal(
    (await buildOrderData(payload, { ...order(line()), customer: { ...customer, email: 'nope' } }))
      .ok,
    false,
    'a malformed email must be rejected',
  )
  assert.equal(
    (await buildOrderData(payload, { ...order(line()), customer: { ...customer, phone: '12' } }))
      .ok,
    false,
    'a two-digit phone number must be rejected',
  )
  assert.equal(
    (await buildOrderData(payload, order(line(), { address: undefined }))).ok,
    false,
    'courier delivery without an address must be rejected',
  )

  // 8. Delivery fee rules: charged below the threshold, free above it, free on pickup.
  const small = await buildOrderData(payload, order(line(1)))
  assert.ok(small.ok)
  assert.ok(small.data.subtotal < threshold, 'pick a cheaper product for the fee assertion')
  assert.equal(small.data.deliveryFee, standardFee, 'unknown city falls back to the standard fee')

  const big = await buildOrderData(payload, order(line(99)))
  assert.ok(big.ok)
  assert.ok(big.data.subtotal >= threshold)
  assert.equal(big.data.deliveryFee, 0, 'free above the threshold')

  const pickup = await buildOrderData(payload, order(line(), { method: 'pickup' }))
  assert.ok(pickup.ok)
  assert.equal(pickup.data.deliveryFee, 0, 'no fee on store pickup')

  // 9. Per-zone delivery pricing.
  if (paidZone) {
    const zoned = await buildOrderData(payload, order(line(1), { city: paidZone.name }))
    assert.ok(zoned.ok)
    assert.equal(zoned.data.deliveryFee, toCents(paidZone.fee!), `${paidZone.name} has its own fee`)
  }
  if (freeZone) {
    const zoned = await buildOrderData(payload, order(line(1), { city: freeZone.name }))
    assert.ok(zoned.ok)
    assert.equal(zoned.data.deliveryFee, 0, `${freeZone.name} delivers free`)
  }

  // 10. The same-day cutoff is enforced server side, not just in the date picker.
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const stale = await buildOrderData(
    payload,
    order(line(), { date: yesterday.toISOString().slice(0, 10) }),
  )
  assert.equal(stale.ok, false, 'a date in the past must be rejected')

  const okDate = await buildOrderData(
    payload,
    order(line(), { date: earliestDeliveryDate(settings.sameDayCutoffHour ?? 14) }),
  )
  assert.ok(okDate.ok, 'the earliest allowed date must be accepted')

  // 11. A signed-in customer is recorded against the order.
  const owned = await buildOrderData(payload, { ...order(line()), userId: 42 })
  assert.ok(owned.ok)
  assert.equal(owned.data.user, 42)

  console.log('checkout pricing: all assertions passed')
}

await run()
process.exit(0)
