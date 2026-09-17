/**
 * Pure-logic checks that need no database.
 *
 *   npm run check
 *
 * Covers the cart store's merge-and-clamp rules and the shop query builder —
 * the two places where a refactor could quietly change behaviour.
 */
import assert from 'node:assert/strict'

import { earliestDeliveryDate } from '../lib/order'
import { buildPriceBands, parsePriceBand, sortFor, whereFor } from '../lib/shop'

const STORAGE_KEY = 'iris-garden-cart'

// The cart store talks to window.localStorage; give it one before importing.
const storage = new Map<string, string>()
const fakeWindow = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  },
  addEventListener: () => {},
}
;(globalThis as Record<string, unknown>).window = fakeWindow

const { cart } = await import('../lib/cart')

type Line = { productId: number; size: string | null; quantity: number; unitPrice: number }
const lines = (): Line[] => JSON.parse(storage.get(STORAGE_KEY) ?? '[]')

const bouquet = {
  productId: 1,
  slug: 'morning-market',
  title: 'Morning Market',
  image: null,
  size: null,
  unitPrice: 6800,
}

const run = () => {
  // --- cart store ---
  cart.clear()

  cart.add(bouquet)
  assert.equal(lines().length, 1, 'adding puts one line in the cart')
  assert.equal(lines()[0].quantity, 1)

  cart.add(bouquet)
  assert.equal(lines().length, 1, 'the same bouquet merges into one line')
  assert.equal(lines()[0].quantity, 2, 'merging adds the quantities')

  cart.add({ ...bouquet, size: 'Large' })
  assert.equal(lines().length, 2, 'a different size is a separate line')

  cart.add(bouquet, 500)
  assert.equal(lines()[0].quantity, 99, 'adding past the cap clamps instead of overflowing')

  cart.setQuantity('1:', 500)
  assert.equal(lines()[0].quantity, 99, 'setting past the cap clamps too')

  cart.setQuantity('1:', 3)
  assert.equal(lines()[0].quantity, 3)

  cart.setQuantity('1:', 0)
  assert.equal(lines().length, 1, 'setting a quantity to zero removes the line')
  assert.equal(lines()[0].size, 'Large', 'and removes the right one')

  cart.add(bouquet)
  cart.reprice([{ productId: 1, size: null, unitPrice: 7200 }])
  const plain = lines().find((line) => line.size === null)!
  const large = lines().find((line) => line.size === 'Large')!
  assert.equal(plain.unitPrice, 7200, 'repricing updates the matching line')
  assert.equal(large.unitPrice, 6800, 'and leaves other sizes alone')

  cart.clear()
  assert.equal(lines().length, 0, 'clearing empties the cart')

  // --- shop query builder ---
  assert.deepEqual(whereFor({}), {}, 'no filters means no where clause')
  assert.deepEqual(whereFor({}, 7), { and: [{ category: { equals: 7 } }] })

  const searched = whereFor({ q: 'rose' })
  assert.ok(JSON.stringify(searched).includes('composition'), 'search covers the composition field')

  const occasion = whereFor({ occasion: 'romance' })
  assert.deepEqual(occasion, { and: [{ occasions: { in: ['romance'] } }] })

  assert.deepEqual(whereFor({ price: '50-100' }), {
    and: [{ price: { greater_than_equal: 50, less_than_equal: 100 } }],
  })
  assert.deepEqual(whereFor({ price: '-50' }), { and: [{ price: { less_than_equal: 50 } }] })
  assert.deepEqual(whereFor({ price: '150-' }), { and: [{ price: { greater_than_equal: 150 } }] })
  assert.deepEqual(whereFor({ price: 'drop table' }), {}, 'junk in the price param is ignored')

  assert.equal(parsePriceBand('-'), null)
  assert.equal(parsePriceBand(undefined), null)

  // --- price bands always match something ---
  const bands = buildPriceBands(16, 110)
  assert.ok(bands.length >= 2, 'a spread catalogue gets multiple bands')
  for (const band of bands) {
    const parsed = parsePriceBand(band.value)!
    assert.ok(parsed, `${band.value} parses`)
    const lowEnough = parsed.min === undefined || parsed.min < 110
    const highEnough = parsed.max === undefined || parsed.max > 16
    assert.ok(lowEnough && highEnough, `${band.label} can actually match a product`)
  }
  assert.deepEqual(buildPriceBands(20, 20), [], 'a single price gets no bands')
  assert.deepEqual(buildPriceBands(0, 0), [], 'an empty catalogue gets no bands')

  // --- sorting keeps sold-out bouquets last ---
  assert.equal(sortFor('price-asc')[0], '-inStock', 'availability wins over the chosen sort')
  assert.equal(sortFor('price-asc')[1], 'price')
  assert.equal(sortFor(undefined)[1], '-createdAt', 'newest is the default')

  // --- same-day cutoff ---
  const morning = new Date('2026-06-10T09:00:00')
  const evening = new Date('2026-06-10T21:00:00')
  assert.equal(earliestDeliveryDate(14, morning), '2026-06-10', 'before the cutoff, today works')
  assert.equal(earliestDeliveryDate(14, evening), '2026-06-11', 'after it, the earliest is tomorrow')

  console.log('cart store, shop filters and cutoff: all assertions passed')
}

run()
process.exit(0)
