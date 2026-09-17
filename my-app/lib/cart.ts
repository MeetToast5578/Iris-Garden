'use client'

import { useSyncExternalStore } from 'react'

import { MAX_QUANTITY } from './validate'

export type CartItem = {
  /** product id plus size, so the same bouquet in two sizes stays two lines */
  key: string
  productId: number
  slug: string
  title: string
  image: string | null
  size: string | null
  /** cents, snapshotted for display only — checkout re-reads the real price */
  unitPrice: number
  quantity: number
}

type CartState = { items: CartItem[]; isOpen: boolean }

const STORAGE_KEY = 'iris-garden-cart'

/**
 * The cart lives outside React because it is really browser state: it has to
 * survive a reload and stay in step across tabs. useSyncExternalStore gives us
 * that without an effect that writes state on mount.
 */
const EMPTY: CartState = { items: [], isOpen: false }

let state: CartState = EMPTY
let loaded = false
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())

const readStored = (): CartItem[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

const update = (next: Partial<CartState>, persist = true) => {
  state = { ...state, ...next }
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      /* private mode or quota — the cart just will not survive a reload */
    }
  }
  emit()
}

const subscribe = (listener: () => void) => {
  if (!loaded) {
    loaded = true
    const stored = readStored()
    if (stored.length) state = { ...state, items: stored }

    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) update({ items: readStored() }, false)
    })
  }

  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => state
const getServerSnapshot = () => EMPTY

/** Every caller goes through this, so the cap cannot be forgotten in one of them. */
const clampQuantity = (quantity: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.floor(quantity)))

export const cart = {
  add(item: Omit<CartItem, 'key' | 'quantity'>, quantity = 1) {
    const key = `${item.productId}:${item.size ?? ''}`
    const existing = state.items.find((line) => line.key === key)

    update({
      items: existing
        ? state.items.map((line) =>
            line.key === key
              ? { ...line, quantity: clampQuantity(line.quantity + quantity) }
              : line,
          )
        : [...state.items, { ...item, key, quantity: clampQuantity(quantity) }],
      isOpen: true,
    })
  },

  setQuantity(key: string, quantity: number) {
    update({
      items:
        quantity <= 0
          ? state.items.filter((line) => line.key !== key)
          : state.items.map((line) =>
              line.key === key ? { ...line, quantity: clampQuantity(quantity) } : line,
            ),
    })
  },

  /** Adopt server-side prices after checkout reports that something drifted. */
  reprice(lines: { productId: number; size: string | null; unitPrice: number }[]) {
    update({
      items: state.items.map((line) => {
        const match = lines.find(
          (priced) => priced.productId === line.productId && (priced.size ?? null) === line.size,
        )
        return match ? { ...line, unitPrice: match.unitPrice } : line
      }),
    })
  },

  remove(key: string) {
    update({ items: state.items.filter((line) => line.key !== key) })
  },

  clear() {
    update({ items: [] })
  },

  open() {
    update({ isOpen: true }, false)
  },

  close() {
    update({ isOpen: false }, false)
  },
}

export const useCart = () => {
  const { items, isOpen } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return {
    items,
    isOpen,
    count: items.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    ...cart,
  }
}
