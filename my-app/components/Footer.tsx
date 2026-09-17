import Link from 'next/link'

import type { NavCategory } from './Header'

type FooterProps = {
  categories: NavCategory[]
  phone?: string
  email?: string
  address?: string
  openingHours?: string
  instagram?: string
}

export function Footer({
  categories,
  phone,
  email,
  address,
  openingHours,
  instagram,
}: FooterProps) {
  return (
    <footer className="mt-24 border-t border-line bg-paper-dim">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl">Iris Garden</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
            A small flower studio. Seasonal stems, arranged by hand the morning they reach your door.
          </p>
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm text-moss underline underline-offset-4"
            >
              Instagram
            </a>
          )}
        </div>

        <nav aria-label="Shop">
          <h2 className="eyebrow font-sans">Shop</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/shop" className="text-ink-soft transition-colors hover:text-moss">
                All bouquets
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/shop/${category.slug}`}
                  className="text-ink-soft transition-colors hover:text-moss"
                >
                  {category.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Information">
          <h2 className="eyebrow font-sans">Information</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { href: '/delivery', label: 'Delivery & payment' },
              { href: '/about', label: 'About the studio' },
              { href: '/contact', label: 'Contact us' },
              { href: '/order/lookup', label: 'Track an order' },
              { href: '/account', label: 'Your account' },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink-soft transition-colors hover:text-moss">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow font-sans">Visit</h2>
          <address className="mt-4 space-y-2.5 text-sm not-italic text-ink-soft">
            {address && <p>{address}</p>}
            {openingHours && <p>{openingHours}</p>}
            {phone && (
              <p>
                <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="hover:text-moss">
                  {phone}
                </a>
              </p>
            )}
            {email && (
              <p>
                <a href={`mailto:${email}`} className="hover:text-moss">
                  {email}
                </a>
              </p>
            )}
          </address>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Iris Garden. All rights reserved.</p>
          <p>Cash on delivery · Same-day dispatch before 2pm</p>
        </div>
      </div>
    </footer>
  )
}
