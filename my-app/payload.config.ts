import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Categories } from './collections/Categories'
import { Customers } from './collections/Customers'
import { ContactMessages } from './collections/ContactMessages'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Products } from './collections/Products'
import { RateLimits } from './collections/RateLimits'
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
  collections: [Products, Categories, Media, Orders, Customers, ContactMessages, RateLimits, Users],
  globals: [Settings],
  editor: lexicalEditor(),
  // DATABASE_URI is Neon's pooled (-pooler) string, so keep the client pool small.
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI, max: 5 },
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
  // Vercel's disk is read-only, so uploads go to Neon Object Storage (S3 API) when its keys are set.
  // The bucket is private; Payload streams files through /api/media/file/*.
  plugins: [
    s3Storage({
      enabled: Boolean(process.env.S3_ACCESS_KEY_ID),
      collections: { media: true },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
  sharp,
})
