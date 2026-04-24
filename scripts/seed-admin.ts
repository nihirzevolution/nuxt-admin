import 'dotenv/config'
import { connectDatabase, disconnectDatabase } from '../server/lib/database'
import { User } from '../server/models'
import { hashPassword } from '../server/utils/password'
import { ensureSystemRoles } from './ensure-system-roles'

/**
 * Idempotent: creates a super_admin if no user exists with SEED_ADMIN_EMAIL.
 * Run: npm run seed:admin
 */
async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    // eslint-disable-next-line no-console
    console.error('MONGODB_URI is not set. Copy .env.example to .env and configure it.')
    process.exit(1)
  }
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim()
  const password = process.env.SEED_ADMIN_PASSWORD
  const name = (process.env.SEED_ADMIN_NAME || 'Super Admin').trim()

  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required in .env')
    process.exit(1)
  }

  await connectDatabase(uri)
  await ensureSystemRoles()

  const existing = await User.findOne({ email })
  if (existing) {
    // eslint-disable-next-line no-console
    console.info(`[seed:admin] User with email "${email}" already exists — nothing to do.`)
    await disconnectDatabase()
    return
  }

  const passwordHash = await hashPassword(password)
  await User.create({
    email,
    name,
    passwordHash,
    role: 'super_admin',
    isActive: true
  })
  // eslint-disable-next-line no-console
  console.info(`[seed:admin] Created super_admin: ${email}`)
  await disconnectDatabase()
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
