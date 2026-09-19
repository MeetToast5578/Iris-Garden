import { randomBytes } from 'node:crypto'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { googleOAuthConfigured, googleRedirectUri, OAUTH_STATE_COOKIE } from '@/lib/google'
import { safeRedirect } from '@/lib/validate'

/** Step one: bounce the visitor to Google with a CSRF state we can check later. */
export async function GET(request: Request) {
  if (!googleOAuthConfigured()) {
    return NextResponse.redirect(new URL('/account/login?error=google-not-configured', request.url))
  }

  const state = randomBytes(16).toString('hex')
  const store = await cookies()
  store.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })

  const returnTo = new URL(request.url).searchParams.get('redirectTo')
  if (returnTo) {
    store.set('oauth-return-to', safeRedirect(returnTo), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    })
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!)
  authUrl.searchParams.set('redirect_uri', googleRedirectUri())
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('prompt', 'select_account')

  return NextResponse.redirect(authUrl.toString())
}
