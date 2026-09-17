'use client'

import Image from 'next/image'
import { useState } from 'react'

type Shot = { src: string; alt: string }

export function ProductGallery({ images, title }: { images: Shot[]; title: string }) {
  const [active, setActive] = useState(0)
  const current = images[active]

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-paper-dim">
        {current ? (
          <Image
            src={current.src}
            alt={current.alt || title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-soft">No photo yet</div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex gap-3">
          {images.map((shot, index) => (
            <li key={shot.src}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === active}
                className={`relative block h-20 w-16 overflow-hidden rounded-xl border-2 transition-colors ${
                  index === active ? 'border-moss' : 'border-transparent hover:border-line'
                }`}
              >
                <Image src={shot.src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
