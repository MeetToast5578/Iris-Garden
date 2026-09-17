export const OAUTH_STATE_COOKIE = 'google-oauth-state'

export const googleOAuthConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export const googleRedirectUri = () =>
  `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/google/callback`

export type GoogleClaims = {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
}

/**
 * Reads the claims out of Google's id_token without verifying the signature.
 *
 * That is safe here and only here: the token came straight back from Google's
 * token endpoint over TLS, authenticated with our client secret. Anything
 * arriving from a browser would have to be verified against Google's JWKS.
 */
export const readIdTokenClaims = (idToken: string): GoogleClaims | null => {
  const payload = idToken.split('.')[1]
  if (!payload) return null

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as GoogleClaims
  } catch {
    return null
  }
}
