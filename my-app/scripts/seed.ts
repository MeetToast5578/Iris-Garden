/**
 * Demo catalogue for local development.
 *
 *   npm run seed
 *
 * Wipes products, categories and media, then rebuilds them. Orders and
 * messages are left alone. Photos are pulled from Unsplash at run time —
 * replace them with your own before going anywhere near production.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const PHOTOS = {
  shopFront: '1487070183336-b863922373d4',
  handsBouquet: '1526047932273-341f2a7631f9',
  peachBouquet: '1533616688419-b7a585564566',
  creamBouquet: '1563241527-3004b7be0ffd',
  blushArmful: '1596438459194-f275f413d6ff',
  duskFlowers: '1457089328109-e5d9bd499191',
  singleRose: '1518895949257-7621c3c786d7',
  redRoses: '1519378058457-4c29a0a2efac',
  blushRoses: '1591886960571-74d43a9d4166',
  pinkTulip: '1520763185298-1b434c919102',
  tulipVase: '1561181286-d3fee7d55364',
  blossom: '1462275646964-a0e3386b89fa',
  orchid: '1454262041357-5d96f50a2f27',
  lily: '1502977249166-824b3a8a4d6d',
  calla: '1469259943454-aa100abba749',
  sunflowers: '1470509037663-253afd7f0f51',
} as const

type PhotoKey = keyof typeof PHOTOS

const ALT: Record<PhotoKey, string> = {
  shopFront: 'Buckets of cut flowers lined up outside a flower shop',
  handsBouquet: 'Two hands holding a bright mixed bouquet',
  peachBouquet: 'Peach and coral bouquet arranged in a clear vase',
  creamBouquet: 'Cream and blush bouquet with eucalyptus in a glass vase',
  blushArmful: 'Large armful of white and pink garden roses',
  duskFlowers: 'Moody arrangement of dark red and purple blooms',
  singleRose: 'A single pink rose in a slim glass vase',
  redRoses: 'Dense cluster of deep red roses',
  blushRoses: 'Blush and cream garden roses gathered in a vase',
  pinkTulip: 'A single pink tulip against a pink background',
  tulipVase: 'Pink tulips standing in a clear glass vase',
  blossom: 'Pink cherry blossom branches in flower',
  orchid: 'White orchid flowers against a pale background',
  lily: 'A pink stargazer lily in a small vase',
  calla: 'Three pale pink calla lilies',
  sunflowers: 'Sunflowers with bright yellow petals',
}

const paragraphs = (lines: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: lines.map((text) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      children: [
        {
          type: 'text',
          text,
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          version: 1,
        },
      ],
    })),
  },
})

const CATEGORIES = [
  {
    title: 'Signature bouquets',
    photo: 'creamBouquet' as PhotoKey,
    order: 1,
    description:
      'Our own arrangements, rebuilt every week around whatever came in looking best that morning.',
  },
  {
    title: 'Roses',
    photo: 'blushRoses' as PhotoKey,
    order: 2,
    description: 'Garden roses and classic long stems, from a single bloom to an armful.',
  },
  {
    title: 'Tulips & spring',
    photo: 'tulipVase' as PhotoKey,
    order: 3,
    description: 'Short-season stems that only show up for a few weeks a year.',
  },
  {
    title: 'Lilies & orchids',
    photo: 'orchid' as PhotoKey,
    order: 4,
    description: 'Sculptural flowers that hold their shape for a fortnight or more.',
  },
]

const PRODUCTS = [
  {
    title: 'Morning Market',
    category: 'Signature bouquets',
    photos: ['peachBouquet', 'handsBouquet'] as PhotoKey[],
    price: 68,
    featured: true,
    occasions: ['birthday', 'thank-you', 'just-because'],
    shortDescription: 'Peach ranunculus, coral roses and whatever else looked good at 6am.',
    composition: '7 coral roses, 5 peach ranunculus, astrantia, eucalyptus, ruscus',
    sizes: [
      { label: 'Small', priceDelta: -16 },
      { label: 'Medium', priceDelta: 0 },
      { label: 'Large', priceDelta: 28 },
    ],
    description: [
      'The bouquet we make most mornings, and the one we would send to our own mother.',
      'Because it follows the market, the exact mix shifts week to week. The palette stays: warm peach, coral and soft cream, with enough greenery to keep it from looking staged.',
    ],
  },
  {
    title: 'Garden Party',
    category: 'Signature bouquets',
    photos: ['creamBouquet'] as PhotoKey[],
    price: 84,
    featured: true,
    occasions: ['anniversary', 'congratulations', 'thank-you'],
    shortDescription: 'Cream garden roses and eucalyptus, loose enough to look just-picked.',
    composition: '9 cream garden roses, lisianthus, silver eucalyptus, seeded eucalyptus',
    sizes: [
      { label: 'Medium', priceDelta: 0 },
      { label: 'Large', priceDelta: 34 },
    ],
    description: [
      'Tied loosely on purpose. Nothing here is wired or forced into place, so it keeps opening for days after it arrives.',
    ],
  },
  {
    title: 'Blush Armful',
    category: 'Signature bouquets',
    photos: ['blushArmful'] as PhotoKey[],
    price: 96,
    featured: true,
    occasions: ['anniversary', 'romance', 'congratulations'],
    shortDescription: 'A genuinely large bouquet of white and pink garden roses.',
    composition: '15 garden roses, white lisianthus, pistacia',
    sizes: [],
    description: [
      'This is the one people buy when the occasion is big. It needs a wide vase and a table you do not mind giving up.',
    ],
  },
  {
    title: 'Dusk',
    category: 'Signature bouquets',
    photos: ['duskFlowers'] as PhotoKey[],
    price: 74,
    featured: false,
    occasions: ['birthday', 'sympathy', 'just-because'],
    shortDescription: 'Deep plum, burgundy and rust — for people who find pastels boring.',
    composition: 'Burgundy dahlias, plum anemones, rust chrysanthemums, dark foliage',
    sizes: [
      { label: 'Medium', priceDelta: 0 },
      { label: 'Large', priceDelta: 26 },
    ],
    description: [
      'Built around dark, saturated blooms that read almost black in low light. It photographs badly and looks extraordinary in person.',
    ],
  },
  {
    title: 'Sunday Posy',
    category: 'Signature bouquets',
    photos: ['handsBouquet'] as PhotoKey[],
    price: 46,
    featured: false,
    occasions: ['just-because', 'thank-you', 'new-baby'],
    shortDescription: 'A small, bright handful. The one to send for no particular reason.',
    composition: 'Seasonal mixed stems, florist choice',
    sizes: [],
    description: [
      'Small, cheerful and deliberately unfussy. We pick the mix on the day, which is why it costs what it does.',
    ],
  },
  {
    title: 'Sunflower Bunch',
    category: 'Signature bouquets',
    photos: ['sunflowers'] as PhotoKey[],
    price: 38,
    featured: false,
    occasions: ['birthday', 'congratulations', 'just-because'],
    shortDescription: 'Five tall sunflowers, no arranging required.',
    composition: '5 sunflowers, wheat, ruscus',
    sizes: [],
    description: ['Cut the stems on an angle, give them deep water and stand back.'],
  },
  {
    title: 'One Rose',
    category: 'Roses',
    photos: ['singleRose'] as PhotoKey[],
    price: 16,
    featured: false,
    occasions: ['romance', 'just-because'],
    shortDescription: 'A single stem, wrapped properly. Sometimes that is the whole message.',
    composition: '1 garden rose, wrapped in paper with a water vial',
    sizes: [],
    description: ['Delivered with a water vial on the stem so it survives the journey.'],
  },
  {
    title: 'Crimson Dozen',
    category: 'Roses',
    photos: ['redRoses'] as PhotoKey[],
    price: 110,
    featured: true,
    occasions: ['romance', 'anniversary'],
    shortDescription: 'Twelve deep red roses, long stems, no filler hiding at the back.',
    composition: '12 long-stem red roses, ruscus',
    sizes: [
      { label: 'Twelve', priceDelta: 0 },
      { label: 'Twenty-four', priceDelta: 96 },
    ],
    description: [
      'The classic, done without shortcuts. Grade-A stems at 60cm, stripped of lower thorns and conditioned overnight before they go out.',
    ],
  },
  {
    title: 'Blush Roses in Glass',
    category: 'Roses',
    photos: ['blushRoses'] as PhotoKey[],
    price: 88,
    featured: false,
    occasions: ['anniversary', 'thank-you', 'congratulations'],
    shortDescription: 'Cream and blush garden roses, arranged and delivered in the vase.',
    composition: '11 garden roses in a recycled glass vase',
    sizes: [],
    description: ['Arrives arranged in water. Nothing to do but find a spot for it.'],
  },
  {
    title: 'First Tulip',
    category: 'Tulips & spring',
    photos: ['pinkTulip'] as PhotoKey[],
    price: 20,
    featured: false,
    occasions: ['just-because', 'new-baby'],
    shortDescription: 'Three pink tulips, wrapped simply. Spring, on a budget.',
    composition: '3 pink tulips',
    sizes: [],
    description: ['Tulips keep growing after they are cut, so expect them to rearrange themselves.'],
  },
  {
    title: 'Tulip Bunch',
    category: 'Tulips & spring',
    photos: ['tulipVase'] as PhotoKey[],
    price: 44,
    featured: true,
    occasions: ['birthday', 'thank-you', 'just-because'],
    shortDescription: 'Fifteen pink tulips. Buy them tight and watch them open all week.',
    composition: '15 pink tulips',
    sizes: [
      { label: 'Fifteen', priceDelta: 0 },
      { label: 'Thirty', priceDelta: 36 },
    ],
    description: [
      'We send tulips closed. Two days later they will have opened, leaned toward the window and doubled in size.',
    ],
  },
  {
    title: 'Blossom Branches',
    category: 'Tulips & spring',
    photos: ['blossom'] as PhotoKey[],
    price: 58,
    featured: false,
    occasions: ['congratulations', 'new-baby', 'just-because'],
    shortDescription: 'Cherry blossom branches, in season for about three weeks.',
    composition: '5 flowering cherry branches, 80–100cm',
    sizes: [],
    description: [
      'Tall, architectural and briefly available. Needs a heavy vase and a bit of ceiling height.',
    ],
  },
  {
    title: 'White Orchid',
    category: 'Lilies & orchids',
    photos: ['orchid'] as PhotoKey[],
    price: 76,
    featured: false,
    occasions: ['sympathy', 'congratulations', 'thank-you'],
    shortDescription: 'A potted phalaenopsis that will still be flowering in two months.',
    composition: 'Double-stem phalaenopsis in a ceramic pot',
    sizes: [],
    description: [
      'Three ice cubes a week, bright but indirect light, and it will outlast every bouquet on this page.',
    ],
  },
  {
    title: 'Stargazer',
    category: 'Lilies & orchids',
    photos: ['lily'] as PhotoKey[],
    price: 42,
    featured: false,
    occasions: ['birthday', 'sympathy'],
    shortDescription: 'Pink stargazer lilies. Two buds open a day for about a week.',
    composition: '5 stargazer lily stems, ruscus',
    sizes: [],
    description: [
      'We snip the anthers before they go out, which stops the pollen staining anything it touches.',
    ],
  },
  {
    title: 'Calla Trio',
    category: 'Lilies & orchids',
    photos: ['calla'] as PhotoKey[],
    price: 64,
    featured: true,
    occasions: ['sympathy', 'anniversary', 'congratulations'],
    shortDescription: 'Pale pink callas, as close to a drawn line as a flower gets.',
    composition: '9 pale pink calla lilies',
    sizes: [
      { label: 'Nine', priceDelta: 0 },
      { label: 'Eighteen', priceDelta: 52 },
    ],
    description: ['Keep the water shallow — callas rot if you stand them too deep.'],
  },
]

const fetchPhoto = async (id: string, width: number) => {
  const response = await fetch(`https://images.unsplash.com/photo-${id}?w=${width}&q=80`)
  if (!response.ok) throw new Error(`Could not download photo ${id}: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

const seed = async () => {
  const payload = await getPayload({ config })

  payload.logger.info('Clearing products, categories and media…')
  for (const collection of ['products', 'categories', 'media'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }

  payload.logger.info('Uploading photos…')
  const media: Partial<Record<PhotoKey, number>> = {}
  for (const [key, id] of Object.entries(PHOTOS) as [PhotoKey, string][]) {
    const data = await fetchPhoto(id, 1800)
    const doc = await payload.create({
      collection: 'media',
      data: { alt: ALT[key] },
      file: { data, mimetype: 'image/jpeg', name: `${key}.jpg`, size: data.length },
    })
    media[key] = doc.id
    payload.logger.info(`  ${key}`)
  }

  payload.logger.info('Creating categories…')
  const categories = new Map<string, number>()
  for (const category of CATEGORIES) {
    const doc = await payload.create({
      collection: 'categories',
      data: {
        title: category.title,
        slug: '',
        description: category.description,
        order: category.order,
        image: media[category.photo],
      },
    })
    categories.set(category.title, doc.id)
  }

  payload.logger.info('Creating products…')
  for (const product of PRODUCTS) {
    await payload.create({
      collection: 'products',
      data: {
        title: product.title,
        slug: '',
        price: product.price,
        category: categories.get(product.category)!,
        occasions: product.occasions as never,
        inStock: true,
        featured: product.featured,
        images: product.photos.map((photo) => media[photo]!),
        shortDescription: product.shortDescription,
        composition: product.composition,
        sizes: product.sizes,
        description: paragraphs(product.description) as never,
      },
    })
  }

  payload.logger.info('Updating store settings…')
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      heroEyebrow: 'Fresh from the market, daily',
      heroTitle: 'Flowers that say it better',
      heroSubtitle:
        'Hand-tied bouquets arranged the morning they are delivered, from a small studio that treats every order like a gift.',
      heroImage: media.blushArmful,
      studioImage: media.shopFront,
      deliveryFee: 9,
      freeDeliveryThreshold: 100,
      deliveryNote: 'Same-day delivery on orders placed before 2pm.',
      deliveryZones: [
        { name: 'Downtown' },
        { name: 'Northwest' },
        { name: 'Southeast' },
        { name: 'Pearl District' },
        { name: 'Sellwood' },
      ],
      phone: '+1 (555) 014-2200',
      email: 'hello@irisgarden.com',
      address: '14 Wildflower Lane, Portland, OR',
      openingHours: 'Mon–Sat 8:00–20:00, Sun 10:00–18:00',
      instagram: 'https://instagram.com',
    },
  })

  const email = process.env.SEED_EMAIL || 'admin@irisgarden.com'
  const password = process.env.SEED_PASSWORD || 'changeme123'
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })

  if (existing.docs.length === 0) {
    await payload.create({ collection: 'users', data: { email, password, name: 'Studio admin' } })
    payload.logger.info(`Admin user created — ${email} / ${password}`)
  } else {
    payload.logger.info(`Admin user ${email} already exists, left as is.`)
  }

  payload.logger.info(`Done: ${PRODUCTS.length} products across ${CATEGORIES.length} categories.`)
}

await seed()
process.exit(0)
