import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">This one has wilted</h1>
      <p className="mt-4 text-ink-soft">
        The page you were after is not here any more. The flowers still are.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">
          Shop bouquets
        </Link>
        <Link href="/" className="btn-secondary">
          Back home
        </Link>
      </div>
    </div>
  )
}
