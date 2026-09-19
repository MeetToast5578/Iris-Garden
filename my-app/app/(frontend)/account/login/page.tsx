import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/AccountForms'
import { GoogleButton } from '@/components/GoogleButton'
import { getCurrentCustomer } from '@/lib/auth'
import { AUTH_ERRORS } from '@/lib/authErrors'
import { googleOAuthConfigured } from '@/lib/google'
import { safeRedirect } from '@/lib/validate'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>
}) {
  const { error, redirectTo } = await searchParams
  if (await getCurrentCustomer()) redirect(safeRedirect(redirectTo))

  return (
    <div className="shell max-w-md py-16">
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-3 text-4xl">Sign in</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Your saved details, your order history, and a faster checkout.
      </p>

      <div className="mt-8 space-y-5">
        {error && AUTH_ERRORS[error] && (
          <p role="alert" className="rounded-xl bg-petal p-3 text-sm text-moss">
            {AUTH_ERRORS[error]}
          </p>
        )}

        {googleOAuthConfigured() && (
          <>
            <GoogleButton redirectTo={redirectTo} label="Continue with Google" />
            <div className="flex items-center gap-3 text-xs text-ink-soft">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <SignInForm redirectTo={redirectTo} />

        <p className="text-sm text-ink-soft">
          No account yet?{' '}
          <Link
            href={`/account/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
            className="text-moss underline underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
