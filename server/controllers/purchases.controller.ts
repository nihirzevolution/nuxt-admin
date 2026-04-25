import { connectDatabase } from '../lib/database'
import { Product, Purchase, Shop, ShopUserLink, User } from '../models'

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

type Viewer = { userId: string; role: string }

const STAFF_ROLES = new Set(['admin', 'super_admin'])

function isStaffRole(role: string) {
  return STAFF_ROLES.has(role)
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100
}

async function resolveAllowedShopIds(viewer: Viewer, requestedShopId?: string) {
  if (isStaffRole(viewer.role)) {
    if (!requestedShopId) {
      return null as string[] | null
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

async function assertPurchaseRowAccess(
  viewer: Viewer,
  purchase: { shopId: unknown; userId: unknown }
) {
  const shopId = String(purchase.shopId)
  const rowUserId = String(purchase.userId)
  if (isStaffRole(viewer.role)) {
    return
  }
  if (viewer.role === 'shop_owner') {
    const allowed = await resolveAllowedShopIds(viewer, shopId)
    if (!allowed.includes(shopId)) {
      throw err('Forbidden', 403)
    }
    return
  }
  if (viewer.role === 'user') {
    if (rowUserId !== viewer.userId) {
      throw err('Forbidden', 403)
    }
    return
  }
  throw err('Forbidden', 403)
}

async function assertProductBelongsToShop(productId: string, shopId: string) {
  const product = await Product.findById(productId).select('shopId').lean()
  if (!product) {
    throw err('Product not found', 404)
  }
  if (String(product.shopId) !== shopId) {
    throw err('Product does not belong to the selected shop', 400)
  }
  return product
}

/** Enforces shop–user “collection” (active `ShopUserLink`); staff bypass. */
async function assertActiveShopMembershipForPurchase(
  viewer: Viewer,
  shopId: string,
  targetUserId: string
) {
  if (isStaffRole(viewer.role)) {
    return
  }
  const link = await ShopUserLink.findOne({
    shopId,
    userId: targetUserId,
    status: 'active'
  })
    .select('_id')
    .lean()
  if (!link) {
    throw err(
      'No active membership for this user and shop. The shop must invite the user and the user must accept first (see /api/shop-links).',
      400
    )
  }
}

export function mapPurchase(
  row: {
    _id: unknown
    shopId: unknown
    userId: unknown
    productId: unknown
    quantity: number
    priceAtPurchase: number
    totalAmount: number
    purchaseDate: Date
    notes?: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
  },
  extra?: {
    shopName?: string
    productName?: string
    userName?: string
    userEmail?: string
  }
) {
  return {
    id: String(row._id),
    shopId: String(row.shopId),
    userId: String(row.userId),
    productId: String(row.productId),
    quantity: row.quantity,
    priceAtPurchase: row.priceAtPurchase,
    totalAmount: row.totalAmount,
    purchaseDate: row.purchaseDate,
    notes: row.notes ?? '',
    shopName: extra?.shopName,
    productName: extra?.productName,
    userName: extra?.userName,
    userEmail: extra?.userEmail,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null
  }
}

async function enrichPurchaseRows(
  rows: Array<{
    _id: unknown
    shopId: unknown
    userId: unknown
    productId: unknown
    quantity: number
    priceAtPurchase: number
    totalAmount: number
    purchaseDate: Date
    notes?: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
  }>
) {
  const shopIds = [...new Set(rows.map(r => String(r.shopId)))]
  const userIds = [...new Set(rows.map(r => String(r.userId)))]
  const productIds = [...new Set(rows.map(r => String(r.productId)))]
  const [shops, users, products] = await Promise.all([
    Shop.find({ _id: { $in: shopIds } }).select('name').lean(),
    User.find({ _id: { $in: userIds } }).select('name email').lean(),
    Product.find({ _id: { $in: productIds } }).select('name').lean()
  ])
  const shopById = new Map(shops.map(s => [String(s._id), s]))
  const userById = new Map(users.map(u => [String(u._id), u]))
  const productById = new Map(products.map(p => [String(p._id), p]))
  return rows.map((row) => {
    const s = shopById.get(String(row.shopId))
    const u = userById.get(String(row.userId))
    const p = productById.get(String(row.productId))
    return mapPurchase(row, {
      shopName: s?.name,
      productName: p?.name,
      userName: u?.name,
      userEmail: u?.email
    })
  })
}

export async function listPurchases(
  query: {
    page?: string
    limit?: string
    search?: string
    shopId?: string
    userId?: string
    productId?: string
  },
  viewer: Viewer
) {
  await ensureDb()
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10))
  const skip = (page - 1) * limit
  const shopQ = query.shopId?.trim()
  const userQ = query.userId?.trim()
  const productQ = query.productId?.trim()
  const searchQ = query.search?.trim()

  const filter: Record<string, unknown> = { deletedAt: null }

  if (isStaffRole(viewer.role)) {
    if (shopQ) {
      filter.shopId = shopQ
    }
    if (userQ) {
      filter.userId = userQ
    }
    if (productQ) {
      filter.productId = productQ
    }
  } else if (viewer.role === 'shop_owner') {
    const allowedShopIds = await resolveAllowedShopIds(viewer, shopQ)
    if (Array.isArray(allowedShopIds) && allowedShopIds.length === 0) {
      return { items: [], total: 0, page, limit }
    }
    if (shopQ) {
      filter.shopId = shopQ
    } else if (Array.isArray(allowedShopIds)) {
      filter.shopId = { $in: allowedShopIds }
    }
    if (userQ) {
      filter.userId = userQ
    }
    if (productQ) {
      filter.productId = productQ
    }
  } else if (viewer.role === 'user') {
    if (userQ && userQ !== viewer.userId) {
      throw err('Forbidden', 403)
    }
    filter.userId = viewer.userId
    if (shopQ) {
      filter.shopId = shopQ
    }
    if (productQ) {
      filter.productId = productQ
    }
  } else {
    throw err('Forbidden', 403)
  }

  if (searchQ) {
    const rx = { $regex: escapeRegex(searchQ), $options: 'i' }
    const searchOr = { $or: [{ notes: rx }] }
    if (Object.keys(filter).length) {
      const base = { ...filter }
      for (const k of Object.keys(filter)) {
        delete (filter as Record<string, unknown>)[k]
      }
      filter.$and = [base, searchOr]
    } else {
      Object.assign(filter, searchOr)
    }
  }

  const [rows, total] = await Promise.all([
    Purchase.find(filter)
      .sort({ purchaseDate: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Purchase.countDocuments(filter)
  ])

  return {
    items: await enrichPurchaseRows(rows as Parameters<typeof enrichPurchaseRows>[0]),
    total,
    page,
    limit
  }
}

export async function getPurchaseById(id: string, viewer: Viewer) {
  await ensureDb()
  const row = await Purchase.findOne({ _id: id, deletedAt: null }).lean()
  if (!row) {
    throw err('Purchase not found', 404)
  }
  await assertPurchaseRowAccess(viewer, row)
  const [one] = await enrichPurchaseRows([row as Parameters<typeof enrichPurchaseRows>[0][0]])
  return one
}

/** Accepts ISO strings from JSON; used by Nitro route handlers. */
export function parsePurchaseDateInput(raw: unknown): Date | undefined {
  if (raw == null || raw === '') {
    return undefined
  }
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) {
    throw err('purchaseDate must be a valid date', 400)
  }
  return d
}

/**
 * - `user`: line is always for the logged-in user (`userId` in body is ignored).
 * - `shop_owner`: `userId` is the **customer**; omit or empty → shop owner (self), e.g. own purchase at own shop.
 * - `admin` / `super_admin`: `userId` required (who the line is for).
 */
function resolveCreateUserId(viewer: Viewer, bodyUserId: string | undefined) {
  const raw = bodyUserId?.trim() ?? ''
  if (viewer.role === 'user') {
    return viewer.userId
  }
  if (viewer.role === 'shop_owner') {
    return raw || viewer.userId
  }
  if (isStaffRole(viewer.role)) {
    if (!raw) {
      throw err('userId is required', 400)
    }
    return raw
  }
  throw err('Forbidden', 403)
}

export async function createPurchase(
  input: {
    shopId: string
    userId?: string
    productId: string
    quantity: number
    priceAtPurchase: number
    totalAmount?: number
    purchaseDate?: Date
    notes?: string
  },
  viewer: Viewer
) {
  await ensureDb()
  const shopId = input.shopId?.trim() ?? ''
  const productId = input.productId?.trim() ?? ''
  const quantity = Number(input.quantity)
  const priceAtPurchase = Number(input.priceAtPurchase)
  const notes = input.notes?.trim() ?? ''

  if (!shopId || !productId) {
    throw err('shopId and productId are required', 400)
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw err('quantity must be a positive number', 400)
  }
  if (!Number.isFinite(priceAtPurchase) || priceAtPurchase < 0) {
    throw err('priceAtPurchase must be a non-negative number', 400)
  }

  const targetUserId = resolveCreateUserId(viewer, input.userId ?? '')

  if (isStaffRole(viewer.role)) {
    // any shop / user
  } else if (viewer.role === 'shop_owner') {
    await resolveAllowedShopIds(viewer, shopId)
  } else if (viewer.role === 'user') {
    if (targetUserId !== viewer.userId) {
      throw err('Forbidden', 403)
    }
  } else {
    throw err('Forbidden', 403)
  }

  const shop = await Shop.findById(shopId).select('_id name').lean()
  if (!shop) {
    throw err('Shop not found', 404)
  }

  const buyer = await User.findById(targetUserId).select('_id').lean()
  if (!buyer) {
    throw err('User not found', 404)
  }

  await assertProductBelongsToShop(productId, shopId)
  await assertActiveShopMembershipForPurchase(viewer, shopId, String(buyer._id))

  const computed = roundMoney(quantity * priceAtPurchase)
  if (input.totalAmount != null && Number.isFinite(Number(input.totalAmount))) {
    const t = roundMoney(Number(input.totalAmount))
    if (Math.abs(t - computed) > 0.02) {
      throw err('totalAmount must equal quantity × priceAtPurchase (within rounding)', 400)
    }
  }

  const purchaseDate = input.purchaseDate ?? new Date()

  const created = await Purchase.create({
    shopId: shop._id,
    userId: buyer._id,
    productId,
    quantity,
    priceAtPurchase,
    totalAmount: computed,
    purchaseDate,
    notes: notes || undefined,
    deletedAt: null
  })

  return getPurchaseById(String(created._id), viewer)
}

export async function updatePurchase(
  id: string,
  input: {
    shopId?: string
    userId?: string
    productId?: string
    quantity?: number
    priceAtPurchase?: number
    totalAmount?: number
    purchaseDate?: Date
    notes?: string
  },
  viewer: Viewer
) {
  await ensureDb()
  const row = await Purchase.findOne({ _id: id, deletedAt: null })
  if (!row) {
    throw err('Purchase not found', 404)
  }
  await assertPurchaseRowAccess(viewer, row)

  let nextShopId = String(row.shopId)
  if (input.shopId != null) {
    const sid = String(input.shopId).trim()
    const shop = await Shop.findById(sid).lean()
    if (!shop) {
      throw err('Shop not found', 404)
    }
    if (isStaffRole(viewer.role)) {
      // ok
    } else if (viewer.role === 'shop_owner') {
      await resolveAllowedShopIds(viewer, sid)
    } else {
      throw err('Forbidden', 403)
    }
    row.shopId = shop._id
    nextShopId = String(shop._id)
  }

  if (input.userId != null) {
    const uid = String(input.userId).trim()
    if (viewer.role === 'user') {
      if (uid !== viewer.userId) {
        throw err('Forbidden', 403)
      }
    }
    const u = await User.findById(uid).select('_id').lean()
    if (!u) {
      throw err('User not found', 404)
    }
    row.userId = u._id
  }

  const nextProductId = input.productId != null ? String(input.productId).trim() : String(row.productId)
  if (input.productId != null) {
    await assertProductBelongsToShop(nextProductId, nextShopId)
    row.set('productId', nextProductId)
  } else {
    await assertProductBelongsToShop(String(row.productId), nextShopId)
  }

  if (input.quantity != null) {
    const q = Number(input.quantity)
    if (!Number.isFinite(q) || q <= 0) {
      throw err('quantity must be a positive number', 400)
    }
    row.quantity = q
  }
  if (input.priceAtPurchase != null) {
    const p = Number(input.priceAtPurchase)
    if (!Number.isFinite(p) || p < 0) {
      throw err('priceAtPurchase must be a non-negative number', 400)
    }
    row.priceAtPurchase = p
  }
  if (input.purchaseDate != null) {
    row.purchaseDate = input.purchaseDate
  }
  if (input.notes != null) {
    row.notes = String(input.notes).trim() || undefined
  }

  const computed = roundMoney(Number(row.quantity) * Number(row.priceAtPurchase))
  if (input.totalAmount != null && Number.isFinite(Number(input.totalAmount))) {
    const t = roundMoney(Number(input.totalAmount))
    if (Math.abs(t - computed) > 0.02) {
      throw err('totalAmount must equal quantity × priceAtPurchase (within rounding)', 400)
    }
  }
  row.totalAmount = computed

  await assertActiveShopMembershipForPurchase(
    viewer,
    nextShopId,
    String(row.userId)
  )

  await row.save()
  return getPurchaseById(String(row._id), viewer)
}

export async function softDeletePurchase(id: string, viewer: Viewer) {
  await ensureDb()
  const row = await Purchase.findOne({ _id: id, deletedAt: null })
  if (!row) {
    throw err('Purchase not found', 404)
  }
  await assertPurchaseRowAccess(viewer, row)
  row.deletedAt = new Date()
  await row.save()
  return { deleted: true as const, id: String(row._id) }
}
