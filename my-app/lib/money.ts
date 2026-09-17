/**
 * Products store their price in dollars because that is what admins type.
 * Everything downstream of the cart works in integer cents so that totals
 * never accumulate floating point error.
 */
export const toCents = (dollars: number): number => Math.round(dollars * 100)

export const formatPrice = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
