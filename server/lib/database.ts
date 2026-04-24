import mongoose from 'mongoose'

const readyStates = { disconnected: 0, connected: 1, connecting: 2, disconnecting: 3 }

/**
 * Reuses a single connection (important for dev HMR and serverless warm starts).
 */
export async function connectDatabase(uri: string) {
  if (mongoose.connection.readyState === readyStates.connected) {
    return mongoose.connection
  }
  if (mongoose.connection.readyState === readyStates.connecting) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve)
    })
    return mongoose.connection
  }
  if (!uri) {
    throw new Error('MONGODB_URI (or NUXT_MONGODB_URI) is not set')
  }
  await mongoose.connect(uri)
  return mongoose.connection
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === readyStates.connected) {
    await mongoose.disconnect()
  }
}
