import type { Metadata } from 'next'

import { CheckoutForm } from '@/components/CheckoutForm'
import { getCurrentCustomer } from '@/lib/auth'
import { toCents } from '@/lib/money'
import { earliestDeliveryDate } from '@/lib/order'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false },
}

/** Depends on the signed-in customer and on the time of day, so never cached. */
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const payload = await getPayloadClient()
  const [settings, customer] = await Promise.all([
    payload.findGlobal({ slug: 'settings', depth: 0 }),
    getCurrentCustomer(),
  ])

  return (
    <div className="shell py-12">
      <p className="eyebrow">Almost there</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Checkout</h1>

      <CheckoutForm
        deliveryFee={toCents(settings.deliveryFee ?? 0)}
        freeDeliveryThreshold={toCents(settings.freeDeliveryThreshold ?? 0)}
        zones={(settings.deliveryZones ?? []).map((zone) => ({
          name: zone.name,
          fee: zone.fee === null || zone.fee === undefined ? null : toCents(zone.fee),
        }))}
        pickupAddress={settings.address ?? undefined}
        earliestDate={earliestDeliveryDate(settings.sameDayCutoffHour ?? 14)}
        customer={
          customer
            ? {
                name: customer.name ?? '',
                email: customer.email ?? '',
                phone: customer.phone ?? '',
                address: customer.address ?? '',
                city: customer.city ?? '',
              }
            : null
        }
      />
    </div>
  )
}
