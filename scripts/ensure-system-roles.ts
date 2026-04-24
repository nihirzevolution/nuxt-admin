import { Role } from '../server/models/role.model'

const SYSTEM = [
  { name: 'User', slug: 'user', description: 'Default application user' },
  { name: 'Admin', slug: 'admin', description: 'Administrator' },
  { name: 'Super Admin', slug: 'super_admin', description: 'Full access' }
]

/**
 * Ensures default roles exist (uses the live Mongo connection).
 * Call after `connectDatabase`.
 */
export async function ensureSystemRoles() {
  for (const r of SYSTEM) {
    await Role.findOneAndUpdate(
      { slug: r.slug },
      {
        $set: {
          name: r.name,
          slug: r.slug,
          description: r.description,
          isSystem: true,
          isActive: true
        }
      },
      { upsert: true }
    )
  }
}
