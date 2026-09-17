'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { useCart } from '@/lib/cart'

export type NavCategory = { title: string; slug: string }

const staticLinks = [
  { href: '/shop', label: 'All bouquets' },
  { href: '/delivery', label: 'Delivery' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Header({ categories, phone }: { categories: NavCategory[]; phone?: string }) {
  const { count, open } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const categoryLinks = categories.map((c) => ({ href: `/shop/${c.slug}`, label: c.title }))

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="hidden bg-moss py-2 text-center text-xs tracking-wide text-paper sm:block">
        Hand-tied each morning · Same-day delivery on orders before 2pm
      </div>

      <div className="shell flex h-18 items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Iris Garden, home">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" className="text-moss">
            <path
              d="M13 2c2.6 2.4 3.9 5 3.9 7.8 0 1.5-.4 2.9-1.2 4.2 2-1.4 4.2-2 6.6-1.8-.6 3.3-2.3 5.6-5 6.9-1.5.7-3 1-4.3.9V24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M13 20c-1.3.1-2.8-.2-4.3-.9-2.7-1.3-4.4-3.6-5-6.9 2.4-.2 4.6.4 6.6 1.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-xl tracking-tight">Iris Garden</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-7 lg:flex" aria-label="Main">
          {staticLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm whitespace-nowrap transition-colors hover:text-moss ${
                pathname === link.href ? 'text-moss' : 'text-ink'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form action="/shop" role="search" className="ml-auto hidden max-w-52 lg:ml-0 lg:block">
          <label htmlFor="site-search" className="sr-only">
            Search bouquets
          </label>
          <input
            id="site-search"
            type="search"
            name="q"
            placeholder="Search"
            className="field !py-2 !text-sm"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          {phone && (
            <a
              href={`tel:${phone.replace(/[^+\d]/g, '')}`}
              className="hidden px-3 text-sm whitespace-nowrap text-ink-soft transition-colors hover:text-moss 2xl:block"
            >
              {phone}
            </a>
          )}

          <button
            type="button"
            onClick={open}
            className="relative rounded-full p-2.5 transition-colors hover:bg-paper-dim"
            aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none">
              <path
                d="M3.5 6h13l-1.1 9.2a1.5 1.5 0 01-1.5 1.3H6.1a1.5 1.5 0 01-1.5-1.3L3.5 6z"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path d="M7 6a3 3 0 016 0" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            {count > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blush px-1 text-[10px] font-medium text-paper tabular-nums">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-full p-2.5 transition-colors hover:bg-paper-dim lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              {menuOpen ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.4" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.4" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-line bg-paper lg:hidden">
          <div className="shell py-5">
            <form action="/shop" role="search" className="mb-4">
              <label htmlFor="mobile-search" className="sr-only">
                Search bouquets
              </label>
              <input id="mobile-search" type="search" name="q" placeholder="Search" className="field" />
            </form>
            <nav className="flex flex-col" aria-label="Mobile">
              {[...categoryLinks, ...staticLinks].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-line/70 py-3 text-base last:border-0"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
