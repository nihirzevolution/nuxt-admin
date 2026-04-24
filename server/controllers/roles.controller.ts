import { connectDatabase } from '../lib/database'
import { Role, User } from '../models'

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

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function listRoles(query: { page?: string; limit?: string; active?: string }) {
  await ensureDb()
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const skip = (page - 1) * limit
  const filter: { isActive?: boolean } = {}
  if (query.active === '1' || query.active === 'true') {
    filter.isActive = true
  }
  const [items, total] = await Promise.all([
    Role.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Role.countDocuments(filter)
  ])
  return {
    items: items.map((r) => ({
      id: String(r._id),
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })),
    total,
    page,
    limit
  }
}

export async function getRoleById(id: string) {
  await ensureDb()
  const r = await Role.findById(id).lean()
  if (!r) {
    throw err('Role not found', 404)
  }
  return {
    id: String(r._id),
    name: r.name,
    slug: r.slug,
    description: r.description,
    isSystem: r.isSystem,
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  }
}

export async function createRole(input: {
  name: string
  slug?: string
  description?: string
}) {
  await ensureDb()
  const name = input.name?.trim() ?? ''
  if (!name) {
    throw err('name is required', 400)
  }
  const slug = (input.slug?.trim() && slugify(input.slug)) || slugify(name)
  if (!slug) {
    throw err('valid slug is required (use a–z, 0–9, hyphens)', 400)
  }
  try {
    const r = await Role.create({
      name,
      slug,
      description: input.description?.trim() ?? '',
      isSystem: false,
      isActive: true
    })
    return {
      id: String(r._id),
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      isActive: r.isActive
    }
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      throw err('A role with this slug already exists', 409)
    }
    throw e
  }
}

export async function updateRole(
  id: string,
  input: { name?: string; slug?: string; description?: string; isActive?: boolean }
) {
  await ensureDb()
  const r = await Role.findById(id)
  if (!r) {
    throw err('Role not found', 404)
  }
  if (r.isSystem) {
    if (input.slug !== undefined && input.slug !== r.slug) {
      throw err('Cannot change slug of a system role', 400)
    }
    if (input.isActive === false) {
      throw err('Cannot deactivate a system role', 400)
    }
  }
  if (input.name != null) {
    r.name = String(input.name).trim()
  }
  if (input.description != null) {
    r.description = String(input.description)
  }
  if (input.isActive != null && !r.isSystem) {
    r.isActive = Boolean(input.isActive)
  }
  if (input.slug != null && !r.isSystem) {
    const s = slugify(String(input.slug))
    if (s) {
      r.slug = s
    }
  }
  try {
    await r.save()
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      throw err('A role with this slug already exists', 409)
    }
    throw e
  }
  return {
    id: String(r._id),
    name: r.name,
    slug: r.slug,
    description: r.description,
    isSystem: r.isSystem,
    isActive: r.isActive
  }
}

export async function deleteRole(id: string) {
  await ensureDb()
  const r = await Role.findById(id)
  if (!r) {
    throw err('Role not found', 404)
  }
  if (r.isSystem) {
    throw err('Cannot delete a system role', 400)
  }
  const inUse = await User.countDocuments({ role: r.slug })
  if (inUse > 0) {
    throw err('Cannot delete: users are still assigned to this role', 400)
  }
  await r.deleteOne()
  return { deleted: true as const, id: String(r._id) }
}
