'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { endSession, getCurrentCustomer, setSessionCookie } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { withinRateLimit } from '@/lib/rateLimit'
import { isStrongEnoughPassword, isValidEmail, isValidPhone } from '@/lib/validate'

export type AuthResult = { ok: true } | { ok: false; error: string }

const field = (form: FormData, name: string) => String(form.get(name) ?? '').trim()

/** Only ever send people to paths on this site. */
const safeRedirect = (value: string | null | undefined) =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/account'

export async function register(_state: AuthResult | null, form: FormData): Promise<AuthResult> {
  if (!(await withinRateLimit('register', { max: 5, windowMs: 60 * 60 * 1000 }))) {
    return { ok: false, error: 'Too many attempts. Please try again later.' }
  }

  const name = field(form, 'name')
  const email = field(form, 'email').toLowerCase()
  const password = String(form.get('password') ?? '')
  const phone = field(form, 'phone')

  if (!name) return { ok: false, error: 'Please tell us your name.' }
  if (!isValidEmail(email)) return { ok: false, error: 'That email does not look right.' }
  if (!isStrongEnoughPassword(password)) {
    return { ok: false, error: 'Use a password of at least 8 characters.' }
  }
  if (phone && !isValidPhone(phone)) {
    return { ok: false, error: 'Enter a phone number the courier can call.' }
  }

  const payload = await getPayloadClient()

  const existing = await payload.find({
    collection: 'customers',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    return { ok: false, error: 'There is already an account with that email. Try signing in.' }
  }

  await payload.create({
    collection: 'customers',
    data: { name, email, password, phone: phone || null },
    overrideAccess: true,
  })

  const { token } = await payload.login({
    collection: 'customers',
    data: { email, password },
  })

  if (token) await setSessionCookie(payload, token)

  redirect(safeRedirect(field(form, 'redirectTo')))
}

export async function signIn(_state: AuthResult | null, form: FormData): Promise<AuthResult> {
  if (!(await withinRateLimit('signin', { max: 10, windowMs: 15 * 60 * 1000 }))) {
    return { ok: false, error: 'Too many attempts. Please try again in a few minutes.' }
  }

  const email = field(form, 'email').toLowerCase()
  const password = String(form.get('password') ?? '')

  if (!isValidEmail(email) || !password) {
    return { ok: false, error: 'Enter your email and password.' }
  }

  const payload = await getPayloadClient()

  let token: string | undefined
  try {
    const result = await payload.login({ collection: 'customers', data: { email, password } })
    token = result.token
  } catch {
    // Deliberately identical whether the email is unknown or the password is
    // wrong, so this cannot be used to enumerate accounts.
    return { ok: false, error: 'Those details did not match an account.' }
  }

  if (!token) return { ok: false, error: 'Those details did not match an account.' }

  await setSessionCookie(payload, token)
  redirect(safeRedirect(field(form, 'redirectTo')))
}

export async function signOut() {
  const payload = await getPayloadClient()
  await endSession(payload)
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function updateProfile(
  _state: AuthResult | null,
  form: FormData,
): Promise<AuthResult> {
  const customer = await getCurrentCustomer()
  if (!customer) return { ok: false, error: 'Please sign in again.' }

  const name = field(form, 'name')
  const phone = field(form, 'phone')

  if (!name) return { ok: false, error: 'Please tell us your name.' }
  if (phone && !isValidPhone(phone)) {
    return { ok: false, error: 'Enter a phone number the courier can call.' }
  }

  const payload = await getPayloadClient()
  await payload.update({
    collection: 'customers',
    id: customer.id,
    data: {
      name,
      phone: phone || null,
      address: field(form, 'address') || null,
      city: field(form, 'city') || null,
    },
    overrideAccess: true,
  })

  revalidatePath('/account')
  return { ok: true }
}

export async function changePassword(
  _state: AuthResult | null,
  form: FormData,
): Promise<AuthResult> {
  const customer = await getCurrentCustomer()
  if (!customer) return { ok: false, error: 'Please sign in again.' }

  const current = String(form.get('currentPassword') ?? '')
  const next = String(form.get('newPassword') ?? '')

  if (!isStrongEnoughPassword(next)) {
    return { ok: false, error: 'Use a password of at least 8 characters.' }
  }

  const payload = await getPayloadClient()

  try {
    await payload.login({ collection: 'customers', data: { email: customer.email, password: current } })
  } catch {
    return { ok: false, error: 'Your current password is not right.' }
  }

  await payload.update({
    collection: 'customers',
    id: customer.id,
    data: { password: next },
    overrideAccess: true,
  })

  return { ok: true }
}
