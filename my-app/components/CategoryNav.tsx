import Link from 'next/link'

import { getPayloadClient } from '@/lib/payload'

export async function CategoryNav({ activeSlug }: { activeSlug?: string }) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    limit: 20,
    sort: 'order',
    depth: 0,
  })

  const links = [{ href: '/shop', label: 'All bouquets', slug: undefined as string | undefined }]
  docs.forEach((category) =>
    links.push({ href: `/shop/${category.slug}`, label: category.title, slug: category.slug }),
  )

  return (
    <nav aria-label="Categories" className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active = link.slug === activeSlug
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full border px-5 py-2 text-sm whitespace-nowrap transition-colors ${
              active
                ? 'border-moss bg-moss text-paper'
                : 'border-line text-ink-soft hover:border-moss hover:text-ink'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
