import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { imageOf } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'

/** Content comes from Payload, so re-render at most once a minute. */
export const revalidate = 60

export const metadata: Metadata = {
  title: 'About the studio',
  description:
    'Iris Garden is a small flower studio buying in small batches and arranging every bouquet by hand.',
}

export default async function AboutPage() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'settings', depth: 1 })
  const image = imageOf(settings.studioImage ?? settings.heroImage, 'hero')

  return (
    <div className="shell py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">Our studio</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">
          We buy small, so nothing waits around in a bucket
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          Iris Garden started with one cold room, a market stall and a stubborn idea: a bouquet
          should look like someone chose every stem, because someone did. We order in small batches
          several times a week, which means less choice on a Monday and the freshest flowers you
          will find on a Friday.
        </p>
      </div>

      {image && (
        <div className="relative mt-12 aspect-[16/9] overflow-hidden rounded-[2rem] bg-paper-dim">
          <Image
            src={image.src}
            alt={image.alt || 'Inside the Iris Garden studio'}
            fill
            sizes="(max-width: 1280px) 100vw, 1216px"
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: 'Seasonal first',
            body: 'If it is not good this week, it is not on the site this week. Peonies in June, dahlias in September, ranunculus when the cold comes.',
          },
          {
            title: 'No filler',
            body: 'We would rather give you nine good stems than fifteen with three carnations hiding in the back.',
          },
          {
            title: 'Real people',
            body: 'Call the number at the bottom of this page and a florist picks up, not a queue system.',
          },
        ].map((item) => (
          <div key={item.title}>
            <h2 className="text-xl">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-[2rem] bg-petal px-6 py-12 text-center sm:px-12">
        <h2 className="text-3xl">Come and see what came in today</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">{settings.address}</p>
        <Link href="/shop" className="btn-primary mt-7">
          Shop this week
        </Link>
      </div>
    </div>
  )
}
