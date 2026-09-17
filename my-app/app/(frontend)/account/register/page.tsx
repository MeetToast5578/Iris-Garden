import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { RegisterForm } from '@/components/AccountForms'
import { GoogleButton } from '@/components/GoogleButton'
import { getCurrentCustomer } from '@/lib/auth'
import { googleOAuthConfigured } from '@/lib/google'

export const metadata: Metadata = { title: 'Create an account', robots: { index: false } }

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const { redirectTo } = await searchParams
  if (await getCurrentCustomer()) redirect(redirectTo || '/account')

  return (
    <div className="shell max-w-md py-16">
      <p className="eyebrow">First time here</p>
      <h1 className="mt-3 text-4xl">Create an account</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Keep your address on file and see every order you have placed with us.
      </p>

      <div className="mt-8 space-y-5">
        {googleOAuthConfigured() && (
          <>
            <GoogleButton redirectTo={redirectTo} label="Sign up with Google" />
            <div className="flex items-center gap-3 text-xs text-ink-soft">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <RegisterForm redirectTo={redirectTo} />

        <p className="text-sm text-ink-soft">
          Already have one?{' '}
          <Link
            href={`/account/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
            className="text-moss underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
