'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Replace with your error tracker when you add one.
    console.error(error)
  }, [error])

  return (
    <div className="shell flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">Something wilted</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">That did not work</h1>
      <p className="mt-4 text-ink-soft">
        Sorry — something went wrong on our side. Trying again usually fixes it.
      </p>
      {error.digest && <p className="mt-2 text-xs text-ink-soft">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back home
        </Link>
      </div>
    </div>
  )
}
