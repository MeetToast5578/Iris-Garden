/** Shared between the Payload field options and the storefront filter chips. */
export const OCCASIONS = [
  { label: 'Birthday', value: 'birthday' },
  { label: 'Anniversary', value: 'anniversary' },
  { label: 'Romance', value: 'romance' },
  { label: 'Congratulations', value: 'congratulations' },
  { label: 'Thank You', value: 'thank-you' },
  { label: 'New Baby', value: 'new-baby' },
  { label: 'Sympathy', value: 'sympathy' },
  { label: 'Just Because', value: 'just-because' },
] as const

export type Occasion = (typeof OCCASIONS)[number]['value']

export const occasionLabel = (value: string): string =>
  OCCASIONS.find((o) => o.value === value)?.label ?? value
