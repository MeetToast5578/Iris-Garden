/** Maps the ?error= codes the OAuth routes redirect with onto readable copy. */
export const AUTH_ERRORS: Record<string, string> = {
  'google-not-configured': 'Google sign-in is not set up on this site yet.',
  'oauth-state': 'That sign-in link expired. Please try again.',
  'oauth-exchange': 'Google could not complete the sign-in. Please try again.',
  'oauth-no-email': 'Google did not share an email address with us.',
  'oauth-unverified': 'That Google account has an unverified email address.',
}
