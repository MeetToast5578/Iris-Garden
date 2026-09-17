import type { Metadata } from 'next'

import { formatPrice, toCents } from '@/lib/money'
import { getPayloadClient } from '@/lib/payload'

/** Payload hooks purge this on save; the timer is only a backstop. */
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Delivery & payment',
  description: 'How and when we deliver, what it costs, and how you pay.',
}

const steps = [
  {
    title: 'Order before 2pm',
    body: 'Anything ordered before 2pm goes out the same afternoon. Later orders travel first thing the next morning.',
  },
  {
    title: 'We call to confirm',
    body: 'A quick call to check the address, the timing and whether the recipient should be surprised.',
  },
  {
    title: 'Hand delivered',
    body: 'Our courier carries the bouquet upright in water. We photograph the handover if you ask.',
  },
]

export default async function DeliveryPage() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  const zones = settings.deliveryZones ?? []

  return (
    <div className="shell max-w-3xl py-14">
      <p className="eyebrow">Practical things</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Delivery & payment</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">{settings.deliveryNote}</p>

      <ol className="mt-12 space-y-8">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-5">
            <span className="font-display text-2xl text-sage">0{index + 1}</span>
            <div>
              <h2 className="text-xl">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-line p-6">
          <h2 className="text-xl">What it costs</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Delivery is {formatPrice(toCents(settings.deliveryFee ?? 0))} inside our zones
            {settings.freeDeliveryThreshold
              ? `, and free on orders over ${formatPrice(toCents(settings.freeDeliveryThreshold))}`
              : ''}
            . Store pickup is always free.
          </p>
        </div>

        <div className="rounded-2xl border border-line p-6">
          <h2 className="text-xl">How you pay</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Cash or card to the courier when the flowers arrive. Nothing is charged until you have
            the bouquet in your hands.
          </p>
        </div>
      </div>

      {zones.length > 0 && (
        <div className="mt-8 rounded-2xl bg-petal p-6">
          <h2 className="text-xl">Where we deliver</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {zones.map((zone) => (
              <li
                key={zone.id ?? zone.name}
                className="rounded-full bg-paper/70 px-4 py-1.5 text-sm"
              >
                {zone.name}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-soft">
            Somewhere else? Call {settings.phone} and we will work it out.
          </p>
        </div>
      )}
    </div>
  )
}
