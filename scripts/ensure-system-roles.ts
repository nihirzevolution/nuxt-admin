import { Role } from '../server/models/role.model'

const SYSTEM = [
  { name: 'Super Admin', slug: 'super_admin', description: 'Full system access' },
  { name: 'Admin', slug: 'admin', description: 'Manage users (not roles)' },
  { name: 'Shop owner', slug: 'shop_owner', description: 'Shop / tenant owner' },
  { name: 'User', slug: 'user', description: 'Default application user' }
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
