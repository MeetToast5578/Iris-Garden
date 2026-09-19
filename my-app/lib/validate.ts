/** Shared between Payload field validation, server actions and the HTML forms. */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim())

/**
 * Deliberately loose: couriers need a reachable number, not an E.164 one.
 * Seven to fifteen digits covers every national format plus a country code.
 */
export const isValidPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export const PHONE_INPUT_PATTERN = '[0-9+()\-\s]{7,20}'

export const isStrongEnoughPassword = (value: string) => value.length >= 8

/** Only ever send people to paths on this site; browsers read `//x` and `/\x` as another host. */
export const safeRedirect = (value: string | null | undefined) =>
  value && /^\/(?![/\\])/.test(value) ? value : '/account'

/** Upper bound on a single cart line, enforced in the store and again on the server. */
export const MAX_QUANTITY = 99
