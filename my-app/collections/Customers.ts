import type { Access, CollectionConfig } from 'payload'

import { isValidPhone } from '../lib/validate'

const isStudioStaff = (user: { collection?: string } | null | undefined) =>
  user?.collection === 'users'

/** Staff see everyone; a customer only ever sees their own record. */
const ownRecordOnly: Access = ({ req: { user } }) => {
  if (isStudioStaff(user)) return true
  if (user) return { id: { equals: user.id } }
  return false
}

export const Customers: CollectionConfig = {
  slug: 'customers',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'phone', 'createdAt'],
    group: 'Shop',
  },
  access: {
    // Anyone can register. Everything else is scoped to the account holder.
    create: () => true,
    read: ownRecordOnly,
    update: ownRecordOnly,
    delete: ({ req: { user } }) => isStudioStaff(user),
    // Customers authenticate against the storefront, never the admin panel.
    admin: () => false,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'phone',
      type: 'text',
      validate: (value: unknown) => {
        if (!value) return true
        return isValidPhone(String(value)) || 'Enter a phone number the courier can call.'
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'address', type: 'text', admin: { description: 'Prefills checkout.' } },
        { name: 'city', type: 'text' },
      ],
    },
    {
      name: 'googleId',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set when the account was linked through Google sign-in.',
      },
    },
  ],
}
