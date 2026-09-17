import Image from 'next/image'
import Link from 'next/link'

import { ProductCard } from '@/components/ProductCard'
import { imageOf } from '@/lib/media'
import { OCCASIONS } from '@/lib/occasions'
import { getPayloadClient } from '@/lib/payload'
import { toCard } from '@/lib/product'

const promises = [
  {
    title: 'Cut this morning',
    body: 'We buy small and often, so nothing sits in a bucket waiting for a buyer.',
  },
  {
    title: 'Arranged by hand',
    body: 'Every bouquet is tied by a florist, not assembled from a pre-packed kit.',
  },
  {
    title: 'Delivered today',
    body: 'Order before 2pm and it reaches the door the same afternoon.',
  },
]

/** Content comes from Payload, so re-render at most once a minute. */
export const revalidate = 60

export default async function HomePage() {
  const payload = await getPayloadClient()

  const [settings, featured, categories] = await Promise.all([
    payload.findGlobal({ slug: 'settings', depth: 1 }),
    payload.find({
      collection: 'products',
      where: { featured: { equals: true } },
      limit: 8,
      depth: 1,
    }),
    payload.find({ collection: 'categories', limit: 4, sort: 'order', depth: 1 }),
  ])

  const hero = imageOf(settings.heroImage, 'hero')

  return (
    <>
      <section className="shell grid items-center gap-10 py-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:py-20">
        <div className="max-w-xl">
          <p className="eyebrow">{settings.heroEyebrow}</p>
          <h1 className="mt-5 text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.02]">
            {settings.heroTitle}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">{settings.heroSubtitle}</p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">
              Shop bouquets
            </Link>
            <Link href="/delivery" className="btn-secondary">
              Delivery & payment
            </Link>
          </div>

          <p className="mt-8 flex items-center gap-2 text-sm text-ink-soft">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
            {settings.deliveryNote}
          </p>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-petal sm:aspect-[5/4] lg:aspect-[4/5]">
          {hero ? (
            <Image
              src={hero.src}
              alt={hero.alt || 'A hand-tied seasonal bouquet'}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-ink-soft">
              Add a hero image in Store Settings
            </div>
          )}
        </div>
      </section>

      {categories.docs.length > 0 && (
        <section className="shell py-10">
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-3xl sm:text-4xl">Browse by style</h2>
            <Link
              href="/shop"
              className="shrink-0 text-sm text-moss underline underline-offset-4 hover:text-ink"
            >
              See everything
            </Link>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.docs.map((category) => {
              const image = imageOf(category.image, 'card')
              return (
                <li key={category.id}>
                  <Link
                    href={`/shop/${category.slug}`}
                    className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl bg-paper-dim p-5"
                  >
                    {image && (
                      <Image
                        src={image.src}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 300px"
                        className="object-cover transition-transform duration-700 ease-soft group-hover:scale-105"
                      />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                    <span className="relative font-display text-xl text-paper">
                      {category.title}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {featured.docs.length > 0 && (
        <section className="shell py-14">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">This week</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">Favourites from the studio</h2>
            </div>
            <Link
              href="/shop"
              className="shrink-0 text-sm text-moss underline underline-offset-4 hover:text-ink"
            >
              All bouquets
            </Link>
          </div>

          <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {featured.docs.map((product, index) => (
              <ProductCard key={product.id} product={toCard(product)} priority={index < 4} />
            ))}
          </div>
        </section>
      )}

      <section className="shell py-10">
        <div className="rounded-[2rem] bg-petal px-6 py-12 sm:px-12">
          <h2 className="text-3xl sm:text-4xl">Find flowers for the moment</h2>
          <ul className="mt-7 flex flex-wrap gap-2.5">
            {OCCASIONS.map((occasion) => (
              <li key={occasion.value}>
                <Link
                  href={`/shop?occasion=${occasion.value}`}
                  className="inline-block rounded-full border border-ink/10 bg-paper/70 px-5 py-2.5 text-sm transition-colors hover:bg-moss hover:text-paper"
                >
                  {occasion.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="shell py-14">
        <ul className="grid gap-8 border-t border-line pt-12 sm:grid-cols-3">
          {promises.map((promise, index) => (
            <li key={promise.title}>
              <span className="font-display text-2xl text-sage">0{index + 1}</span>
              <h3 className="mt-3 text-xl">{promise.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{promise.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
