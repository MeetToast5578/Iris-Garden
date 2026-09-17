import path from 'path'
import { fileURLToPath } from 'url'

import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Categories } from './collections/Categories'
import { Customers } from './collections/Customers'
import { ContactMessages } from './collections/ContactMessages'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { Settings } from './globals/Settings'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Iris Garden',
    },
  },
  collections: [Products, Categories, Media, Orders, Customers, ContactMessages, Users],
  globals: [Settings],
  editor: lexicalEditor(),
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./iris-garden.db',
    },
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  graphQL: { disable: true },
  /**
   * Without SMTP credentials Payload logs emails to the console, which is what
   * you want locally. Set SMTP_HOST and friends and real mail starts sending
   * with no other change.
   */
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || 'hello@irisgarden.com',
        defaultFromName: 'Iris Garden',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp,
})
