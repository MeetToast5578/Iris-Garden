import type { Field } from 'payload'

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** URL slug that fills itself in from another field when left blank. */
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'Used in the page URL. Leave blank to generate it from the title.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => slugify(typeof value === 'string' && value ? value : data?.[from] || ''),
    ],
  },
})
