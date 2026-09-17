import type { Metadata } from 'next'
import { Fraunces, Geist } from 'next/font/google'

import { CartDrawer } from '@/components/CartDrawer'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { toCents } from '@/lib/money'
import { getPayloadClient } from '@/lib/payload'

import './globals.css'

const display = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], display: 'swap' })
const sans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Iris Garden — hand-tied bouquets, delivered fresh',
    template: '%s — Iris Garden',
  },
  description:
    'Seasonal bouquets arranged by hand the morning they are delivered. Same-day flower delivery from a small studio.',
  openGraph: {
    type: 'website',
    siteName: 'Iris Garden',
    url: siteUrl,
    images: ['/logo.png'],
  },
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayloadClient()
  const [categories, settings] = await Promise.all([
    payload.find({ collection: 'categories', limit: 20, sort: 'order', depth: 0 }),
    payload.findGlobal({ slug: 'settings', depth: 0 }),
  ])

  const nav = categories.docs.map(({ title, slug }) => ({ title, slug }))

  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-moss focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <Header categories={nav} phone={settings.phone ?? undefined} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer
          categories={nav}
          phone={settings.phone ?? undefined}
          email={settings.email ?? undefined}
          address={settings.address ?? undefined}
          openingHours={settings.openingHours ?? undefined}
          instagram={settings.instagram ?? undefined}
        />
        <CartDrawer freeDeliveryThreshold={toCents(settings.freeDeliveryThreshold ?? 0)} />
      </body>
    </html>
  )
}
