import type { CollectionConfig } from 'payload'

/**
 * One row per (key, fixed time window). Written only by lib/rateLimit.ts with raw SQL,
 * so nobody — not even a signed-in admin — can read or change it through the API.
 */
export const RateLimits: CollectionConfig = {
  slug: 'rate-limits',
  admin: { hidden: true, group: 'Admin' },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  indexes: [{ fields: ['key', 'windowStart'], unique: true }],
  fields: [
    { name: 'key', type: 'text', required: true },
    { name: 'windowStart', type: 'number', required: true },
    { name: 'count', type: 'number', required: true, defaultValue: 1 },
  ],
}
