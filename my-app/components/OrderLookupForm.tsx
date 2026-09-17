'use client'

import { useActionState } from 'react'

import { lookupOrder, type LookupResult } from '@/app/(frontend)/order/lookup/actions'

export function OrderLookupForm() {
  const [state, formAction, pending] = useActionState<LookupResult, FormData>(lookupOrder, null)

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {state?.error && (
        <p role="alert" className="rounded-xl bg-petal p-3 text-sm text-moss">
          {state.error}
        </p>
      )}
      <div>
        <label className="label" htmlFor="lookup-number">
          Order number
        </label>
        <input
          id="lookup-number"
          name="orderNumber"
          required
          placeholder="IG-XXXXXXXXX"
          className="field"
        />
      </div>
      <div>
        <label className="label" htmlFor="lookup-email">
          Email you ordered with
        </label>
        <input id="lookup-email" name="email" type="email" required className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Looking…' : 'Find my order'}
      </button>
    </form>
  )
}
