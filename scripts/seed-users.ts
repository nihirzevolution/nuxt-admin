import 'dotenv/config'
import { connectDatabase, disconnectDatabase } from '../server/lib/database'
import { User } from '../server/models'
import { hashPassword } from '../server/utils/password'
import { ensureSystemRoles } from './ensure-system-roles'

type Seed = { email: string; name: string; role: string; password: string }

const DEFAULT_PASSWORD = 'SeedUser123!'

/**
 * Idempotent: creates sample users with roles (skips if email already exists).
 * Set SEED_DEFAULT_PASSWORD in .env or use per-user SEED_USER_*_PASSWORD.
 * Run: npm run seed:users
 */
const SEEDS: Seed[] = [
  { email: 'super@example.com', name: 'Super Seeder', role: 'super_admin', password: '' },
  { email: 'admin@example.com', name: 'Admin Seeder', role: 'admin', password: '' },
  { email: 'shop@example.com', name: 'Shop Owner', role: 'shop_owner', password: '' },
  { email: 'user@example.com', name: 'End User', role: 'user', password: '' }
]

function passwordFor(s: Seed, fallback: string) {
  if (s.password) {
    return s.password
  }
  return fallback
}

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    // eslint-disable-next-line no-console
    console.error('MONGODB_URI is not set')
    process.exit(1)
  }
  const pass = process.env.SEED_DEFAULT_PASSWORD || DEFAULT_PASSWORD
  await connectDatabase(uri)
  await ensureSystemRoles()

  for (const s of SEEDS) {
    const email = s.email.toLowerCase()
    const existing = await User.findOne({ email })
    if (existing) {
      // eslint-disable-next-line no-console
      console.info(`[seed:users] Skip (exists): ${email}`)
      continue
    }
    const passwordHash = await hashPassword(passwordFor(s, pass))
    await User.create({
      email,
      name: s.name,
      passwordHash,
      role: s.role,
      isActive: true
    })
    // eslint-disable-next-line no-console
    console.info(`[seed:users] Created ${email} (${s.role})`)
  }

  await disconnectDatabase()
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
