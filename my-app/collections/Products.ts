import type { CollectionConfig } from 'payload'

import { OCCASIONS } from '../lib/occasions'
import { slugField } from '../lib/slugField'

const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'price', 'inStock', 'featured'],
    group: 'Shop',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: { position: 'sidebar', step: 0.01, description: 'In dollars, e.g. 45.00' },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'occasions',
      type: 'select',
      hasMany: true,
      options: [...OCCASIONS],
      admin: { position: 'sidebar', description: 'Drives the occasion filters in the shop.' },
    },
    {
      name: 'inStock',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Uncheck to show the bouquet as sold out.' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Featured bouquets appear on the home page.' },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      admin: { description: 'The first image is used on product cards.' },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      maxLength: 200,
      admin: { description: 'One or two lines, shown on the product card.' },
    },
    { name: 'description', type: 'richText' },
    {
      name: 'composition',
      type: 'textarea',
      admin: { description: "What is in the bouquet, e.g. '9 peonies, eucalyptus, ruscus'." },
    },
    {
      name: 'sizes',
      type: 'array',
      labels: { singular: 'Size', plural: 'Sizes' },
      admin: {
        description: 'Optional. Leave empty for a single-size bouquet.',
      },
      fields: [
        { name: 'label', type: 'text', required: true, admin: { description: 'e.g. Medium' } },
        {
          name: 'priceDelta',
          type: 'number',
          required: true,
          defaultValue: 0,
          admin: { step: 0.01, description: 'Added to the base price, in dollars. May be negative.' },
        },
      ],
    },
  ],
}
