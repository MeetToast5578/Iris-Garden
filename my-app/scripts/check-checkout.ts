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

import { buildOrderData, type CheckoutInput } from '../lib/order'
import { toCents } from '../lib/money'

const customer = { name: 'Test Buyer', email: 'test@example.com', phone: '+1 555 0100' }
const delivery = { method: 'delivery' as const, address: '1 Test Street', city: 'Downtown' }

const run = async () => {
  const payload = await getPayload({ config })

  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  const fee = toCents(settings.deliveryFee ?? 0)
  const threshold = toCents(settings.freeDeliveryThreshold ?? 0)

  // Array fields are not queryable, so filter in memory.
  const all = await payload.find({ collection: 'products', limit: 200, depth: 0, sort: 'price' })
  const plain = all.docs.find((product) => !product.sizes?.length)
  const sized = all.docs.find((product) => product.sizes?.length)

  assert.ok(plain, 'seed a cheap product without sizes first: npm run seed')
  assert.ok(sized?.sizes?.length, 'seed a product with sizes first: npm run seed')

  const base = (lines: CheckoutInput['lines']): CheckoutInput => ({ lines, customer, delivery })

  // 1. Prices come from the database, not the request.
  const two = await buildOrderData(payload, base([{ productId: plain.id, size: null, quantity: 2 }]))
  assert.ok(two.ok, 'a valid order should build')
  assert.equal(two.data.items[0].unitPrice, toCents(plain.price))
  assert.equal(two.data.subtotal, toCents(plain.price) * 2)
  assert.equal(two.data.total, two.data.subtotal + two.data.deliveryFee)

  // 2. A size that does not exist on the product is rejected outright.
  const forged = await buildOrderData(
    payload,
    base([{ productId: sized.id, size: 'Free', quantity: 1 }]),
  )
  assert.equal(forged.ok, false, 'an unknown size must be rejected')

  // 3. A real size applies the delta stored on the product.
  const size = sized.sizes![0]
  const withSize = await buildOrderData(
    payload,
    base([{ productId: sized.id, size: size.label, quantity: 1 }]),
  )
  assert.ok(withSize.ok)
  assert.equal(withSize.data.items[0].unitPrice, toCents(sized.price) + toCents(size.priceDelta))

  // 4. Quantities outside 1–99 are rejected rather than clamped.
  for (const quantity of [0, -3, 1000, Number.NaN]) {
    const result = await buildOrderData(payload, base([{ productId: plain.id, size: null, quantity }]))
    assert.equal(result.ok, false, `quantity ${quantity} must be rejected`)
  }

  // 5. A product id that does not exist fails instead of pricing at zero.
  const missing = await buildOrderData(payload, base([{ productId: 999999, size: null, quantity: 1 }]))
  assert.equal(missing.ok, false, 'an unknown product must be rejected')

  // 6. Contact details are validated.
  assert.equal(
    (
      await buildOrderData(payload, {
        ...base([{ productId: plain.id, size: null, quantity: 1 }]),
        customer: { ...customer, email: 'not-an-email' },
      })
    ).ok,
    false,
  )
  assert.equal(
    (
      await buildOrderData(payload, {
        ...base([{ productId: plain.id, size: null, quantity: 1 }]),
        delivery: { method: 'delivery', city: 'Downtown' },
      })
    ).ok,
    false,
    'courier delivery without an address must be rejected',
  )

  // 7. Delivery fee rules: charged below the threshold, free above it, free on pickup.
  const small = await buildOrderData(payload, base([{ productId: plain.id, size: null, quantity: 1 }]))
  assert.ok(small.ok)
  assert.ok(small.data.subtotal < threshold, 'pick a cheaper product for the fee assertion')
  assert.equal(small.data.deliveryFee, fee)

  const big = await buildOrderData(payload, base([{ productId: plain.id, size: null, quantity: 99 }]))
  assert.ok(big.ok)
  assert.ok(big.data.subtotal >= threshold)
  assert.equal(big.data.deliveryFee, 0, 'free above the threshold')

  const pickup = await buildOrderData(payload, {
    lines: [{ productId: plain.id, size: null, quantity: 1 }],
    customer,
    delivery: { method: 'pickup' },
  })
  assert.ok(pickup.ok)
  assert.equal(pickup.data.deliveryFee, 0, 'no fee on store pickup')

  console.log('checkout pricing: all assertions passed')
}

await run()
process.exit(0)
