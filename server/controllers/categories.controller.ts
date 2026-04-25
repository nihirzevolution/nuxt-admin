import { connectDatabase } from '../lib/database'
import { Category, Shop, User } from '../models'

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

type Viewer = { userId: string; role: string }

const STAFF_ROLES = new Set(['admin', 'super_admin'])

function isStaffRole(role: string) {
  return STAFF_ROLES.has(role)
}

async function resolveAllowedShopIds(viewer: Viewer, requestedShopId?: string) {
  if (isStaffRole(viewer.role)) {
    if (!requestedShopId) {
      return null
    }
    const shop = await Shop.findById(requestedShopId).select('_id').lean()
    if (!shop) {
      throw err('Shop not found', 404)
    }
    return [String(shop._id)]
  }
  if (viewer.role === 'shop_owner') {
    const shops = await Shop.find({ userId: viewer.userId }).select('_id').lean()
    const ids = shops.map(s => String(s._id))
    if (requestedShopId) {
      if (!ids.includes(requestedShopId)) {
        throw err('Forbidden', 403)
      }
      return [requestedShopId]
    }
    return ids
  }
  throw err('Forbidden', 403)
}

async function assertCategoryAccess(viewer: Viewer, shopId: string) {
  const allowed = await resolveAllowedShopIds(viewer)
  if (allowed === null) {
    return
  }
  if (!allowed.includes(shopId)) {
    throw err('Forbidden', 403)
  }
}

export function mapCategory(
  c: {
    _id: unknown
    shopId: unknown
    name: string
    slug: string
    description?: string
    createdAt: Date
    updatedAt: Date
  },
  shop?: { name: string; userId: unknown } | null,
  owner?: { name: string; email: string } | null
) {
  return {
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    shopId: String(c.shopId),
    shopName: shop?.name,
    ownerName: owner?.name,
    ownerEmail: owner?.email,
    description: c.description ?? '',
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  }
}

export async function listCategories(
  query: { page?: string; limit?: string; search?: string; shopId?: string },
  viewer: Viewer
) {
  await ensureDb()
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10))
  const skip = (page - 1) * limit
  const q = query.search?.trim()

  const allowedShopIds = await resolveAllowedShopIds(viewer, query.shopId?.trim())
  if (Array.isArray(allowedShopIds) && allowedShopIds.length === 0) {
    return { items: [], total: 0, page, limit }
  }

  const filter: Record<string, unknown> = {}
  if (Array.isArray(allowedShopIds)) {
    filter.shopId = { $in: allowedShopIds }
  }
  if (q) {
    const rx = { $regex: q, $options: 'i' }
    const searchFilter = {
      $or: [
        { name: rx },
        { slug: rx },
        { description: rx }
      ]
    }
    if (filter.shopId) {
      filter.$and = [{ shopId: filter.shopId }, searchFilter]
      delete filter.shopId
    } else {
      Object.assign(filter, searchFilter)
    }
  }

  const [rows, total] = await Promise.all([
    Category.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Category.countDocuments(filter)
  ])

  const shopIds = [...new Set(rows.map(r => String(r.shopId)))]
  const shops = await Shop.find({ _id: { $in: shopIds } }).select('name userId').lean()
  const ownerIds = [...new Set(shops.map(s => String(s.userId)))]
  const owners = await User.find({ _id: { $in: ownerIds } }).select('name email').lean()
  const shopById = new Map(shops.map(s => [String(s._id), s]))
  const ownerById = new Map(owners.map(o => [String(o._id), o]))

  return {
    items: rows.map((row) => {
      const shop = shopById.get(String(row.shopId))
      const owner = shop ? ownerById.get(String(shop.userId)) : null
      return mapCategory(
        row as Parameters<typeof mapCategory>[0],
        shop ? { name: shop.name, userId: shop.userId } : null,
        owner ? { name: owner.name, email: owner.email } : null
      )
    }),
    total,
    page,
    limit
  }
}

export async function getCategoryById(id: string, viewer: Viewer) {
  await ensureDb()
  const row = await Category.findById(id).lean()
  if (!row) {
    throw err('Category not found', 404)
  }
  await assertCategoryAccess(viewer, String(row.shopId))
  const shop = await Shop.findById(row.shopId).select('name userId').lean()
  const owner = shop
    ? await User.findById(shop.userId).select('name email').lean()
    : null
  return mapCategory(
    row as Parameters<typeof mapCategory>[0],
    shop ? { name: shop.name, userId: shop.userId } : null,
    owner ? { name: owner.name, email: owner.email } : null
  )
}

export async function createCategory(
  input: { name: string; slug?: string; shopId: string; description?: string },
  viewer: Viewer
) {
  await ensureDb()
  const name = input.name?.trim() ?? ''
  const requestedShopId = input.shopId?.trim() ?? ''
  if (!name || !requestedShopId) {
    throw err('name and shopId are required', 400)
  }
  const shop = await Shop.findById(requestedShopId).select('name userId').lean()
  if (!shop) {
    throw err('Shop not found', 404)
  }
  await assertCategoryAccess(viewer, String(shop._id))

  const slug = slugify(input.slug?.trim() || name)
  if (!slug) {
    throw err('slug is required', 400)
  }

  try {
    const created = await Category.create({
      name,
      slug,
      shopId: shop._id,
      description: input.description?.trim() || undefined
    })
    const owner = await User.findById(shop.userId).select('name email').lean()
    return mapCategory(
      {
        _id: created._id,
        shopId: created.shopId,
        name: created.name,
        slug: created.slug,
        description: created.description,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt
      },
      { name: shop.name, userId: shop.userId },
      owner ? { name: owner.name, email: owner.email } : null
    )
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      throw err('A category with this slug already exists in the selected shop', 409)
    }
    throw e
  }
}

export async function updateCategory(
  id: string,
  input: { name?: string; slug?: string; shopId?: string; description?: string },
  viewer: Viewer
) {
  await ensureDb()
  const row = await Category.findById(id)
  if (!row) {
    throw err('Category not found', 404)
  }
  await assertCategoryAccess(viewer, String(row.shopId))

  let shop = await Shop.findById(row.shopId).select('name userId').lean()
  if (!shop) {
    throw err('Shop not found', 404)
  }

  if (input.shopId != null) {
    const nextShopId = String(input.shopId).trim()
    const nextShop = await Shop.findById(nextShopId).select('name userId').lean()
    if (!nextShop) {
      throw err('Shop not found', 404)
    }
    await assertCategoryAccess(viewer, String(nextShop._id))
    row.shopId = nextShop._id
    shop = nextShop
  }
  if (input.name != null) {
    row.name = String(input.name).trim()
  }
  if (input.slug != null) {
    row.slug = slugify(String(input.slug))
  }
  if (input.description != null) {
    row.description = String(input.description).trim() || undefined
  }
  if (!row.name.trim()) {
    throw err('name is required', 400)
  }
  if (!row.slug.trim()) {
    row.slug = slugify(row.name)
  }
  if (!row.slug) {
    throw err('slug is required', 400)
  }

  try {
    await row.save()
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      throw err('A category with this slug already exists in the selected shop', 409)
    }
    throw e
  }

  const owner = shop
    ? await User.findById(shop.userId).select('name email').lean()
    : null
  return mapCategory(
    {
      _id: row._id,
      shopId: row.shopId,
      name: row.name,
      slug: row.slug,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    },
    shop ? { name: shop.name, userId: shop.userId } : null,
    owner ? { name: owner.name, email: owner.email } : null
  )
}

export async function deleteCategory(id: string, viewer: Viewer) {
  await ensureDb()
  const row = await Category.findById(id)
  if (!row) {
    throw err('Category not found', 404)
  }
  await assertCategoryAccess(viewer, String(row.shopId))
  await row.deleteOne()
  return { deleted: true as const, id: String(row._id) }
}
