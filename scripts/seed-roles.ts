import 'dotenv/config'
import { connectDatabase, disconnectDatabase } from '../server/lib/database'
import { ensureSystemRoles } from './ensure-system-roles'

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    // eslint-disable-next-line no-console
    console.error('MONGODB_URI is not set')
    process.exit(1)
  }
  await connectDatabase(uri)
  await ensureSystemRoles()
  // eslint-disable-next-line no-console
  console.info('[seed:roles] System roles OK')
  await disconnectDatabase()
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
