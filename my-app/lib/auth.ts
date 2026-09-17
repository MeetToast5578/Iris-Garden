import { cookies, headers as nextHeaders } from 'next/headers'
import {
  generateExpiredPayloadCookie,
  generatePayloadCookie,
  getFieldsToSign,
  jwtSign,
  type Payload,
} from 'payload'

import type { Customer } from '@/payload-types'

import { getPayloadClient } from './payload'

const CUSTOMERS = 'customers' as const

/**
 * The signed-in shopper, or null. Staff logged into the admin panel are not
 * customers, so they come back null here too.
 */
export const getCurrentCustomer = async (): Promise<Customer | null> => {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (!user || user.collection !== CUSTOMERS) return null
  return user as unknown as Customer
}

/**
 * Issues Payload's own session cookie for a customer.
 *
 * Used by password login and by the Google callback, which has no password to
 * hand to payload.login(). Both paths mint the same token through Payload's
 * exported helpers rather than rolling their own JWT.
 */
export const startSession = async (payload: Payload, customer: { id: number; email: string }) => {
  const collectionConfig = payload.collections[CUSTOMERS].config

  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: customer.email,
    user: { ...customer, collection: CUSTOMERS } as never,
  })

  const { token } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  await setSessionCookie(payload, token)
  return token
}

export const setSessionCookie = async (payload: Payload, token: string) => {
  const cookie = generatePayloadCookie({
    collectionAuthConfig: payload.collections[CUSTOMERS].config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token,
    returnCookieAsObject: true,
  })

  const store = await cookies()
  store.set({
    name: cookie.name,
    value: cookie.value ?? '',
    httpOnly: cookie.httpOnly ?? true,
    path: cookie.path ?? '/',
    sameSite: (cookie.sameSite?.toLowerCase() as 'lax' | 'strict' | 'none') ?? 'lax',
    secure: cookie.secure ?? process.env.NODE_ENV === 'production',
    ...(cookie.expires ? { expires: new Date(cookie.expires) } : {}),
    ...(cookie.domain ? { domain: cookie.domain } : {}),
  })
}

export const endSession = async (payload: Payload) => {
  const cookie = generateExpiredPayloadCookie({
    collectionAuthConfig: payload.collections[CUSTOMERS].config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    returnCookieAsObject: true,
  })

  const store = await cookies()
  store.set({
    name: cookie.name,
    value: '',
    httpOnly: true,
    path: cookie.path ?? '/',
    expires: new Date(0),
  })
}
