import { randomBytes } from 'node:crypto'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { startSession } from '@/lib/auth'
import {
  googleOAuthConfigured,
  googleRedirectUri,
  OAUTH_STATE_COOKIE,
  readIdTokenClaims,
} from '@/lib/google'
import { getPayloadClient } from '@/lib/payload'

const failTo = (request: Request, reason: string) =>
  NextResponse.redirect(new URL(`/account/login?error=${reason}`, request.url))

export async function GET(request: Request) {
  if (!googleOAuthConfigured()) return failTo(request, 'google-not-configured')

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const store = await cookies()
  const expectedState = store.get(OAUTH_STATE_COOKIE)?.value
  store.delete(OAUTH_STATE_COOKIE)

  // Constant work either way; a missing or mismatched state means the callback
  // did not originate from a flow this browser started.
  if (!code || !state || !expectedState || state !== expectedState) {
    return failTo(request, 'oauth-state')
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(),
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) return failTo(request, 'oauth-exchange')

  const tokens = (await tokenResponse.json()) as { id_token?: string }
  const claims = tokens.id_token ? readIdTokenClaims(tokens.id_token) : null

  if (!claims?.email) return failTo(request, 'oauth-no-email')
  // Without this, anyone who can create an unverified Google account with
  // someone else's address could take over that customer's account.
  if (claims.email_verified === false) return failTo(request, 'oauth-unverified')

  const email = claims.email.toLowerCase()
  const payload = await getPayloadClient()

  const existing = await payload.find({
    collection: 'customers',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  let customer = existing.docs[0]

  if (customer) {
    if (!customer.googleId) {
      customer = await payload.update({
        collection: 'customers',
        id: customer.id,
        data: { googleId: claims.sub },
        overrideAccess: true,
      })
    }
  } else {
    customer = await payload.create({
      collection: 'customers',
      data: {
        name: claims.name || email.split('@')[0],
        email,
        googleId: claims.sub,
        // Payload requires one; the customer signs in through Google and can
        // set a real password later from their profile.
        password: randomBytes(24).toString('hex'),
      },
      overrideAccess: true,
    })
  }

  await startSession(payload, { id: customer.id, email: customer.email })

  const returnTo = store.get('oauth-return-to')?.value
  store.delete('oauth-return-to')

  const destination = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/account'
  return NextResponse.redirect(new URL(destination, request.url))
}
