import type { Metadata } from 'next'

import { getPayloadClient } from '@/lib/payload'

import { sendMessage } from './actions'

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Call the studio, send a message, or come and see what arrived this morning.',
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const [{ sent, error }, payload] = await Promise.all([searchParams, getPayloadClient()])
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })

  return (
    <div className="shell grid max-w-5xl gap-14 py-14 lg:grid-cols-2 lg:gap-20">
      <div>
        <p className="eyebrow">Say hello</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">Contact us</h1>
        <p className="mt-5 leading-relaxed text-ink-soft">
          Want something arranged specially, or not sure what suits the occasion? Tell us a little
          about it and a florist will write back.
        </p>

        <dl className="mt-10 space-y-5 text-sm">
          <div>
            <dt className="eyebrow">Phone</dt>
            <dd className="mt-1.5">
              <a
                href={`tel:${(settings.phone ?? '').replace(/[^+\d]/g, '')}`}
                className="text-lg hover:text-moss"
              >
                {settings.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Email</dt>
            <dd className="mt-1.5">
              <a href={`mailto:${settings.email}`} className="text-lg hover:text-moss">
                {settings.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Studio</dt>
            <dd className="mt-1.5 text-lg">{settings.address}</dd>
          </div>
          <div>
            <dt className="eyebrow">Hours</dt>
            <dd className="mt-1.5 text-lg">{settings.openingHours}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-[1.75rem] border border-line bg-paper-dim p-6 sm:p-8">
        {sent ? (
          <div role="status" className="py-10 text-center">
            <p className="font-display text-2xl">Message sent</p>
            <p className="mt-3 text-sm text-ink-soft">
              Thank you. We answer within a few hours during opening times.
            </p>
          </div>
        ) : (
          <form action={sendMessage} className="space-y-4">
            {error && (
              <p role="alert" className="rounded-xl bg-petal p-3 text-sm text-moss">
                Please check your name, email and message and try again.
              </p>
            )}
            <div>
              <label className="label" htmlFor="contact-name">
                Your name
              </label>
              <input id="contact-name" name="name" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="contact-email">
                Email
              </label>
              <input id="contact-email" name="email" type="email" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="contact-phone">
                Phone (optional)
              </label>
              <input id="contact-phone" name="phone" type="tel" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="contact-message">
                Message
              </label>
              <textarea id="contact-message" name="message" rows={5} required className="field" />
            </div>
            <button type="submit" className="btn-primary w-full">
              Send message
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
