import config from '@payload-config'
import { getPayload } from 'payload'

/** Payload's Local API — queries the database directly, no HTTP round trip. */
export const getPayloadClient = () => getPayload({ config })
