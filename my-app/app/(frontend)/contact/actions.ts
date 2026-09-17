'use server'

import { redirect } from 'next/navigation'

import { getPayloadClient } from '@/lib/payload'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Plain form action, so the contact form still works with JavaScript off. */
export async function sendMessage(formData: FormData) {
  const value = (name: string) => String(formData.get(name) ?? '').trim()

  const name = value('name')
  const email = value('email')
  const message = value('message')

  if (!name || !EMAIL.test(email) || message.length < 2) {
    redirect('/contact?error=1')
  }

  const payload = await getPayloadClient()
  await payload.create({
    collection: 'contact-messages',
    data: { name, email, phone: value('phone') || null, message },
  })

  redirect('/contact?sent=1')
}
