import type { GlobalConfig } from 'payload'

import { revalidatePaths } from '../lib/revalidate'

const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Store Settings',
  admin: { group: 'Admin' },
  access: { read: () => true, update: isAdmin },
  hooks: {
    afterChange: [
      () => void revalidatePaths(['/', '/shop', '/delivery', '/about', '/contact', '/checkout']),
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Home page',
          fields: [
            { name: 'heroEyebrow', type: 'text', defaultValue: 'Fresh from the garden, daily' },
            { name: 'heroTitle', type: 'text', defaultValue: 'Flowers that say it better' },
            {
              name: 'heroSubtitle',
              type: 'textarea',
              defaultValue:
                'Hand-tied bouquets arranged the morning they are delivered, from a small studio that treats every order like a gift.',
            },
            { name: 'heroImage', type: 'upload', relationTo: 'media' },
            {
              name: 'studioImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Wide photo used on the About page.' },
            },
          ],
        },
        {
          label: 'Delivery',
          fields: [
            {
              name: 'deliveryFee',
              type: 'number',
              required: true,
              defaultValue: 9,
              admin: { step: 0.01, description: 'In dollars.' },
            },
            {
              name: 'freeDeliveryThreshold',
              type: 'number',
              required: true,
              defaultValue: 100,
              admin: {
                step: 0.01,
                description: 'Order subtotal above which delivery is free, in dollars. Use 0 to disable.',
              },
            },
            {
              name: 'deliveryNote',
              type: 'textarea',
              defaultValue: 'Same-day delivery on orders placed before 2pm.',
            },
            {
              name: 'sameDayCutoffHour',
              type: 'number',
              required: true,
              defaultValue: 14,
              min: 0,
              max: 23,
              admin: {
                description:
                  'Hour of the day (0–23, studio time) after which same-day delivery is no longer offered. The checkout date picker enforces this.',
              },
            },
            {
              name: 'deliveryZones',
              type: 'array',
              fields: [
                { name: 'name', type: 'text', required: true },
                {
                  name: 'fee',
                  type: 'number',
                  min: 0,
                  admin: {
                    step: 0.01,
                    description: 'In dollars. Leave blank to charge the standard fee above.',
                  },
                },
              ],
              admin: { description: 'Cities or districts offered in the checkout city field.' },
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            { name: 'phone', type: 'text', defaultValue: '+1 (555) 014-2200' },
            { name: 'email', type: 'email', defaultValue: 'hello@irisgarden.com' },
            { name: 'address', type: 'text', defaultValue: '14 Wildflower Lane, Portland, OR' },
            {
              name: 'openingHours',
              type: 'text',
              defaultValue: 'Mon–Sat 8:00–20:00, Sun 10:00–18:00',
            },
            { name: 'instagram', type: 'text', defaultValue: 'https://instagram.com' },
          ],
        },
      ],
    },
  ],
}
