import { cookies, headers as nextHeaders } from 'next/headers'
import {
  createLocalReq,
  generateExpiredPayloadCookie,
  generatePayloadCookie,
  getFieldsToSign,
  jwtSign,
  logoutOperation,
  type Payload,
} from 'payload'
import { addSessionToUser } from 'payload/shared'

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
 * Used by the Google callback, which has no password to hand to payload.login().
 * Mirrors what login does: records a session on the customer and signs its id
 * into the token, because Payload rejects tokens without a known session.
 */
export const startSession = async (payload: Payload, customer: { id: number; email: string }) => {
  const collectionConfig = payload.collections[CUSTOMERS].config
  const req = await createLocalReq({}, payload)

  // The raw row, so existing sessions on other devices survive the write.
  const user = await payload.db.findOne({
    collection: CUSTOMERS,
    req,
    where: { id: { equals: customer.id } },
  })
  const { sid } = await addSessionToUser({ collectionConfig, payload, req, user: user as never })

  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: customer.email,
    sid,
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
  // Revoke the session too, so a copied token stops working after sign-out.
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (user?.collection === CUSTOMERS) {
    await logoutOperation({
      collection: payload.collections[CUSTOMERS],
      req: await createLocalReq({ user }, payload),
    })
  }

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
