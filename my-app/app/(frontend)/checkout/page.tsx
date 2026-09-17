import type { Metadata } from 'next'

import { CheckoutForm } from '@/components/CheckoutForm'
import { toCents } from '@/lib/money'
import { getPayloadClient } from '@/lib/payload'

/** Content comes from Payload, so re-render at most once a minute. */
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false },
}

export default async function CheckoutPage() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })

  return (
    <div className="shell py-12">
      <p className="eyebrow">Almost there</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Checkout</h1>

      <CheckoutForm
        deliveryFee={toCents(settings.deliveryFee ?? 0)}
        freeDeliveryThreshold={toCents(settings.freeDeliveryThreshold ?? 0)}
        zones={(settings.deliveryZones ?? []).map((zone) => zone.name)}
        pickupAddress={settings.address ?? undefined}
      />
    </div>
  )
}
