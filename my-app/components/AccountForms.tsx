'use client'

import { useActionState } from 'react'

import {
  changePassword,
  register,
  signIn,
  updateProfile,
  type AuthResult,
} from '@/app/(frontend)/account/actions'
import { PHONE_INPUT_PATTERN } from '@/lib/validate'

const Alert = ({ state }: { state: AuthResult | null }) => {
  if (!state) return null
  return state.ok ? (
    <p role="status" className="rounded-xl bg-petal p-3 text-sm text-moss">
      Saved.
    </p>
  ) : (
    <p role="alert" className="rounded-xl bg-petal p-3 text-sm text-moss">
      {state.error}
    </p>
  )
}

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(signIn, null)

  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
      <div>
        <label className="label" htmlFor="signin-email">
          Email
        </label>
        <input
          id="signin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field"
        />
      </div>
      <div>
        <label className="label" htmlFor="signin-password">
          Password
        </label>
        <input
          id="signin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field"
        />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(register, null)

  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
      <div>
        <label className="label" htmlFor="register-name">
          Your name
        </label>
        <input id="register-name" name="name" required autoComplete="name" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field"
        />
      </div>
      <div>
        <label className="label" htmlFor="register-phone">
          Phone (optional)
        </label>
        <input
          id="register-phone"
          name="phone"
          type="tel"
          pattern={PHONE_INPUT_PATTERN}
          autoComplete="tel"
          className="field"
        />
      </div>
      <div>
        <label className="label" htmlFor="register-password">
          Password
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field"
        />
        <p className="mt-1.5 text-xs text-ink-soft">At least 8 characters.</p>
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}

type ProfileDefaults = {
  name: string
  phone: string
  address: string
  city: string
}

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [state, formAction, pending] = useActionState(updateProfile, null)

  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="profile-name">
            Name
          </label>
          <input
            id="profile-name"
            name="name"
            required
            defaultValue={defaults.name}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="profile-phone">
            Phone
          </label>
          <input
            id="profile-phone"
            name="phone"
            type="tel"
            pattern={PHONE_INPUT_PATTERN}
            defaultValue={defaults.phone}
            className="field"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="profile-address">
            Default address
          </label>
          <input
            id="profile-address"
            name="address"
            defaultValue={defaults.address}
            placeholder="Street, building, apartment"
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="profile-city">
            City
          </label>
          <input id="profile-city" name="city" defaultValue={defaults.city} className="field" />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, null)

  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="current-password">
            Current password
          </label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field"
          />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? 'Updating…' : 'Change password'}
      </button>
    </form>
  )
}
