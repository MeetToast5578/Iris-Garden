'use server'

import { redirect } from 'next/navigation'

import { getPayloadClient } from '@/lib/payload'
import { withinRateLimit } from '@/lib/rateLimit'
import { isValidEmail } from '@/lib/validate'

/** Plain form action, so the contact form still works with JavaScript off. */
export async function sendMessage(formData: FormData) {
  if (!(await withinRateLimit('contact', { max: 5, windowMs: 60 * 60 * 1000 }))) {
    redirect('/contact?error=rate')
  }

  const value = (name: string) => String(formData.get(name) ?? '').trim()

  const name = value('name')
  const email = value('email')
  const message = value('message')

  if (!name || !isValidEmail(email) || message.length < 2) {
    redirect('/contact?error=1')
  }

  const payload = await getPayloadClient()
  await payload.create({
    collection: 'contact-messages',
    data: { name, email, phone: value('phone') || null, message },
  })

  redirect('/contact?sent=1')
}
