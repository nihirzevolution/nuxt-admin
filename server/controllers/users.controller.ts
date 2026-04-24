import { connectDatabase } from '../lib/database'
import { Role, User } from '../models'
import { hashPassword } from '../utils/password'

async function ensureDb() {
  const { mongodbUri } = useRuntimeConfig()
  if (!mongodbUri) {
    throw new Error('Database is not configured (MONGODB_URI missing)')
  }
  await connectDatabase(String(mongodbUri))
}

function err(message: string, code: number) {
  const e = new Error(message) as { statusCode?: number }
  e.statusCode = code
  return e
}

function isDuplicateKeyError(e: unknown) {
  return Boolean(
    e
    && typeof e === 'object'
    && 'code' in e
    && (e as { code: number }).code === 11000
  )
}

/** Ensures a matching active Role document exists, or the slug is a legacy system slug. */
async function assertValidRoleSlug(slug: string) {
  const s = String(slug).toLowerCase().trim()
  const r = await Role.findOne({ slug: s, isActive: true })
  if (r) {
    return
  }
  if (['user', 'admin', 'super_admin', 'shop_owner'].includes(s)) {
    return
  }
  throw err('Invalid role. Create the role in Roles first or use an active slug.', 400)
}

export function mapUser(
  u: { _id: unknown; email: string; name: string; role: string; isActive: boolean; createdAt: Date; updatedAt: Date }
) {
  return {
    id: String(u._id),
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  }
}

export async function listUsers(
  query: { page?: string; limit?: string; search?: string },
  options: { viewerRole: string }
) {
  await ensureDb()
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10))
  const skip = (page - 1) * limit
  const q = query.search?.trim()
  const hideSuperAdmins = options.viewerRole !== 'super_admin'
  const filter: Record<string, unknown> = {}
  if (q) {
    const searchPart = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }
    if (hideSuperAdmins) {
      filter.$and = [searchPart, { role: { $ne: 'super_admin' } }]
    } else {
      Object.assign(filter, searchPart)
    }
  } else if (hideSuperAdmins) {
    filter.role = { $ne: 'super_admin' }
  }
  const [raw, total] = await Promise.all([
    User.find(filter)
      .select('email name role isActive createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    User.countDocuments(filter)
  ])
  return {
    items: raw.map((u) => mapUser(u as Parameters<typeof mapUser>[0])),
    total,
    page,
    limit
  }
}

export async function getUserById(
  id: string,
  options: { viewerRole: string }
) {
  await ensureDb()
  const u = await User.findById(id)
    .select('email name role isActive createdAt updatedAt')
    .lean()
  if (!u) {
    throw err('User not found', 404)
  }
  if (u.role === 'super_admin' && options.viewerRole !== 'super_admin') {
    throw err('User not found', 404)
  }
  return mapUser(u as Parameters<typeof mapUser>[0])
}

export async function createUser(
  input: {
    name: string
    email: string
    password: string
    role: string
    isActive?: boolean
  },
  options: { viewerRole: string }
) {
  await ensureDb()
  if (input.role && input.role.toLowerCase() === 'super_admin' && options.viewerRole !== 'super_admin') {
    throw err('Only a super admin can create super admin users', 403)
  }
  const name = input.name?.trim() ?? ''
  const email = (input.email ?? '').toLowerCase().trim()
  const password = input.password ?? ''
  const role = (input.role ?? 'user').toLowerCase().trim()
  if (!name || !email) {
    throw err('name and email are required', 400)
  }
  if (password.length < 8) {
    throw err('password must be at least 8 characters', 400)
  }
  await assertValidRoleSlug(role)
  const passwordHash = await hashPassword(password)
  try {
    const u = await User.create({
      name,
      email,
      passwordHash,
      role,
      isActive: input.isActive !== false
    })
    const lean = await User.findById(u._id)
      .select('email name role isActive createdAt updatedAt')
      .lean()
    return mapUser(lean as Parameters<typeof mapUser>[0])
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      throw err('A user with this email already exists', 409)
    }
    throw e
  }
}

export async function updateUser(
  id: string,
  currentUserId: string,
  input: {
    name?: string
    email?: string
    role?: string
    isActive?: boolean
    password?: string
  },
  options: { viewerRole: string }
) {
  await ensureDb()
  const u = await User.findById(id).select('+passwordHash')
  if (!u) {
    throw err('User not found', 404)
  }
  if (u.role === 'super_admin' && options.viewerRole !== 'super_admin') {
    throw err('Only a super admin can modify super admin users', 403)
  }
  if (input.role && input.role.toLowerCase() === 'super_admin' && options.viewerRole !== 'super_admin') {
    throw err('Only a super admin can assign the super admin role', 403)
  }
  if (input.name != null) {
    u.name = String(input.name).trim()
  }
  if (input.email != null) {
    u.email = String(input.email).toLowerCase().trim()
  }
  if (input.isActive != null) {
    u.isActive = Boolean(input.isActive)
  }
  if (input.role != null) {
    const role = String(input.role).toLowerCase().trim()
    await assertValidRoleSlug(role)
    u.role = role
  }
  if (input.password) {
    if (String(input.password).length < 8) {
      throw err('password must be at least 8 characters', 400)
    }
    u.passwordHash = await hashPassword(String(input.password))
  }
  if (String(u._id) === String(currentUserId) && input.isActive === false) {
    throw err('You cannot deactivate your own account', 400)
  }
  if (String(u._id) === String(currentUserId) && input.role && input.role !== u.role) {
    if (u.role === 'super_admin' && String(input.role) !== 'super_admin') {
      const others = await User.countDocuments({ role: 'super_admin', _id: { $ne: u._id } })
      if (others === 0) {
        throw err('At least one super_admin must exist', 400)
      }
    }
  }
  try {
    await u.save()
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      throw err('A user with this email already exists', 409)
    }
    throw e
  }
  const fresh = await User.findById(id)
    .select('email name role isActive createdAt updatedAt')
    .lean()
  return mapUser(fresh as Parameters<typeof mapUser>[0])
}

export async function deleteUser(
  id: string,
  currentUserId: string,
  options: { viewerRole: string }
) {
  await ensureDb()
  if (id === currentUserId) {
    throw err('You cannot delete your own account', 400)
  }
  const u = await User.findById(id)
  if (!u) {
    throw err('User not found', 404)
  }
  if (u.role === 'super_admin' && options.viewerRole !== 'super_admin') {
    throw err('Only a super admin can delete a super admin user', 403)
  }
  if (u.role === 'super_admin') {
    const count = await User.countDocuments({ role: 'super_admin' })
    if (count <= 1) {
      throw err('Cannot delete the only super_admin', 400)
    }
  }
  await u.deleteOne()
  return { deleted: true as const, id: String(u._id) }
}
