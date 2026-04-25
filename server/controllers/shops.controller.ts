import { connectDatabase } from '../lib/database'
import { Shop, User } from '../models'

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

export function mapShop(
  s: {
    _id: unknown
    userId: unknown
    name: string
    address: string
    phone: string
    email?: string
    description?: string
    city?: string
    country?: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  },
  owner?: { name: string; email: string } | null
) {
  return {
    id: String(s._id),
    userId: String(s.userId),
    ownerName: owner?.name,
    ownerEmail: owner?.email,
    name: s.name,
    address: s.address,
    phone: s.phone,
    email: s.email ?? '',
    description: s.description ?? '',
    city: s.city ?? '',
    country: s.country ?? '',
    isActive: s.isActive,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  }
}

type Viewer = { userId: string; role: string }

const STAFF_ROLES = new Set(['admin', 'super_admin'])

function isStaffRole(role: string) {
  return STAFF_ROLES.has(role)
}

function assertCanAccessShop(viewer: Viewer, shopUserId: string) {
  if (isStaffRole(viewer.role)) {
    return
  }
  if (viewer.role === 'shop_owner' && String(shopUserId) === viewer.userId) {
    return
  }
  throw err('Forbidden', 403)
}

export async function listShops(
  query: { page?: string; limit?: string; search?: string; userId?: string },
  viewer: Viewer
) {
  await ensureDb()
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10))
  const skip = (page - 1) * limit
  const q = query.search?.trim()
  const userFilter: Record<string, unknown> = {}
  if (isStaffRole(viewer.role)) {
    const uid = query.userId?.trim()
    if (uid) {
      userFilter.userId = uid
    }
  } else if (viewer.role === 'shop_owner') {
    userFilter.userId = viewer.userId
  } else {
    throw err('Forbidden', 403)
  }
  let filter: Record<string, unknown>
  if (q) {
    const rx = { $regex: q, $options: 'i' }
    filter = {
      $and: [
        userFilter,
        {
          $or: [
            { name: rx },
            { address: rx },
            { phone: rx },
            { email: rx },
            { city: rx },
            { country: rx }
          ]
        }
      ]
    }
  } else {
    filter = { ...userFilter }
  }
  const [raw, total] = await Promise.all([
    Shop.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Shop.countDocuments(filter)
  ])
  const ownerIds = [...new Set(raw.map((r) => String(r.userId)))]
  const owners = await User.find({ _id: { $in: ownerIds } })
    .select('name email')
    .lean()
  const byId = new Map(owners.map((o) => [String(o._id), o]))
  return {
    items: raw.map((r) => {
      const o = byId.get(String(r.userId))
      return mapShop(r as Parameters<typeof mapShop>[0], o ? { name: o.name, email: o.email } : null)
    }),
    total,
    page,
    limit
  }
}

export async function getShopById(id: string, viewer: Viewer) {
  await ensureDb()
  const s = await Shop.findById(id).lean()
  if (!s) {
    throw err('Shop not found', 404)
  }
  assertCanAccessShop(viewer, String(s.userId))
  const u = await User.findById(s.userId).select('name email').lean()
  return mapShop(
    s as Parameters<typeof mapShop>[0],
    u ? { name: u.name, email: u.email } : null
  )
}

export async function createShop(
  input: {
    userId?: string
    name: string
    address: string
    phone: string
    email?: string
    description?: string
    city?: string
    country?: string
    isActive?: boolean
  },
  viewer: Viewer
) {
  await ensureDb()
  const name = input.name?.trim() ?? ''
  const address = input.address?.trim() ?? ''
  const phone = input.phone?.trim() ?? ''
  if (!name || !address || !phone) {
    throw err('name, address, and phone are required', 400)
  }
  let ownerId: string
  if (isStaffRole(viewer.role)) {
    const uid = input.userId?.trim()
    if (!uid) {
      throw err('userId is required', 400)
    }
    const u = await User.findById(uid).select('_id').lean()
    if (!u) {
      throw err('Owner user not found', 400)
    }
    ownerId = String(u._id)
  } else if (viewer.role === 'shop_owner') {
    ownerId = viewer.userId
  } else {
    throw err('Forbidden', 403)
  }
  const created = await Shop.create({
    userId: ownerId,
    name,
    address,
    phone,
    email: input.email?.trim() || undefined,
    description: input.description?.trim() || undefined,
    city: input.city?.trim() || undefined,
    country: input.country?.trim() || undefined,
    isActive: input.isActive !== false
  })
  const s = await Shop.findById(created._id).lean()
  const u = await User.findById(ownerId).select('name email').lean()
  return mapShop(
    s as Parameters<typeof mapShop>[0],
    u ? { name: u.name, email: u.email } : null
  )
}

export async function updateShop(
  id: string,
  input: {
    userId?: string
    name?: string
    address?: string
    phone?: string
    email?: string
    description?: string
    city?: string
    country?: string
    isActive?: boolean
  },
  viewer: Viewer
) {
  await ensureDb()
  const s = await Shop.findById(id)
  if (!s) {
    throw err('Shop not found', 404)
  }
  assertCanAccessShop(viewer, String(s.userId))
  if (isStaffRole(viewer.role) && input.userId != null) {
    const uid = String(input.userId).trim()
    const u = await User.findById(uid).select('_id').lean()
    if (!u) {
      throw err('Owner user not found', 400)
    }
    s.userId = u._id
  } else if (!isStaffRole(viewer.role) && input.userId != null && String(input.userId) !== String(s.userId)) {
    throw err('You cannot reassign this shop', 403)
  }
  if (input.name != null) {
    s.name = String(input.name).trim()
  }
  if (input.address != null) {
    s.address = String(input.address).trim()
  }
  if (input.phone != null) {
    s.phone = String(input.phone).trim()
  }
  if (input.email != null) {
    s.email = String(input.email).trim() || undefined
  }
  if (input.description != null) {
    s.description = String(input.description).trim() || undefined
  }
  if (input.city != null) {
    s.city = String(input.city).trim() || undefined
  }
  if (input.country != null) {
    s.country = String(input.country).trim() || undefined
  }
  if (input.isActive != null) {
    s.isActive = Boolean(input.isActive)
  }
  if (!s.name || !s.address || !s.phone) {
    throw err('name, address, and phone are required', 400)
  }
  await s.save()
  const fresh = await Shop.findById(s._id).lean()
  const u = await User.findById(s.userId).select('name email').lean()
  return mapShop(
    fresh as Parameters<typeof mapShop>[0],
    u ? { name: u.name, email: u.email } : null
  )
}

export async function deleteShop(id: string, viewer: Viewer) {
  await ensureDb()
  const s = await Shop.findById(id)
  if (!s) {
    throw err('Shop not found', 404)
  }
  assertCanAccessShop(viewer, String(s.userId))
  await s.deleteOne()
  return { deleted: true as const, id: String(s._id) }
}
