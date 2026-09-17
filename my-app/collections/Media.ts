import type { CollectionConfig } from 'payload'

const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  upload: {
    staticDir: 'public/media',
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 768, height: 1024, position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, position: 'centre' },
    ],
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Generated once at upload time; rendering it per request would mean
        // re-reading the original file on every page view.
        if (req.file?.data) {
          const sharp = (await import('sharp')).default
          const tiny = await sharp(req.file.data)
            .resize(16, 16, { fit: 'inside' })
            .blur(1)
            .jpeg({ quality: 40 })
            .toBuffer()
          data.blurDataURL = `data:image/jpeg;base64,${tiny.toString('base64')}`
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'blurDataURL',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Describe the image for screen readers and search engines.',
      },
    },
  ],
}
