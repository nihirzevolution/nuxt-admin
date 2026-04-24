import { connectDatabase } from '../lib/database'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  if (!config.mongodbUri) {
    if (import.meta.dev) {
      // eslint-disable-next-line no-console
      console.warn('[db] MONGODB_URI is not set — set it in your .env file')
    }
    return
  }
  return connectDatabase(String(config.mongodbUri))
    .then(() => {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.log('[db] MongoDB connection ready')
      }
    })
    .catch((e: unknown) => {
      // eslint-disable-next-line no-console
      console.error('[db] Failed to connect:', e)
    })
})
