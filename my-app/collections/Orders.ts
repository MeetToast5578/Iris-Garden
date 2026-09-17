import type { CollectionConfig } from 'payload'

/**
 * Orders are written by the checkout server action through the Local API,
 * which bypasses access control. Keeping every operation admin-only here
 * means the public REST endpoint cannot be used to forge an order.
 */
const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

export const ORDER_STATUSES = [
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Out for delivery', value: 'out-for-delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
]

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'status', 'total', 'createdAt'],
    group: 'Shop',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.orderNumber) {
          const stamp = Date.now().toString(36).toUpperCase()
          const noise = Math.random().toString(36).slice(2, 5).toUpperCase()
          data.orderNumber = `IG-${stamp}${noise}`
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ORDER_STATUSES,
      admin: { position: 'sidebar' },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      defaultValue: 'cash-on-delivery',
      options: [{ label: 'Cash on delivery', value: 'cash-on-delivery' }],
      admin: { position: 'sidebar' },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      admin: { description: 'Prices are frozen at the moment the order was placed.' },
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products' },
        { name: 'title', type: 'text', required: true },
        { name: 'size', type: 'text' },
        {
          name: 'unitPrice',
          type: 'number',
          required: true,
          admin: { description: 'In cents.' },
        },
        { name: 'quantity', type: 'number', required: true, min: 1 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotal', type: 'number', required: true, admin: { description: 'In cents.' } },
        { name: 'deliveryFee', type: 'number', required: true, admin: { description: 'In cents.' } },
        { name: 'total', type: 'number', required: true, admin: { description: 'In cents.' } },
      ],
    },
    {
      name: 'customer',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text', required: true },
      ],
    },
    {
      name: 'delivery',
      type: 'group',
      fields: [
        {
          name: 'method',
          type: 'select',
          required: true,
          defaultValue: 'delivery',
          options: [
            { label: 'Delivery', value: 'delivery' },
            { label: 'Store pickup', value: 'pickup' },
          ],
        },
        { name: 'recipientName', type: 'text' },
        { name: 'recipientPhone', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'city', type: 'text' },
        {
          name: 'date',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } },
        },
        { name: 'timeSlot', type: 'text' },
        { name: 'giftMessage', type: 'textarea' },
        { name: 'notes', type: 'textarea' },
      ],
    },
  ],
}
