import { connectDatabase } from '../lib/database'
import { Category, Product, Shop, User } from '../models'

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

async function assertProductShopAccess(viewer: Viewer, shopId: string) {
  const allowed = await resolveAllowedShopIds(viewer)
  if (allowed === null) {
    return
  }
  if (!allowed.includes(shopId)) {
    throw err('Forbidden', 403)
  }
}

async function assertCategoryBelongsToShop(categoryId: string, shopId: string) {
  const cat = await Category.findById(categoryId).lean()
  if (!cat) {
    throw err('Category not found', 404)
  }
  if (String(cat.shopId) !== String(shopId)) {
    throw err('Category does not belong to the selected shop', 400)
  }
  return cat
}

export function mapProduct(
  p: {
    _id: unknown
    shopId: unknown
    categoryId: unknown
    name: string
    productImage: string
    price: number
    createdAt: Date
    updatedAt: Date
  },
  extra?: { shopName?: string; categoryName?: string; ownerName?: string; ownerEmail?: string }
) {
  return {
    id: String(p._id),
    shopId: String(p.shopId),
    categoryId: String(p.categoryId),
    name: p.name,
    productImage: p.productImage ?? '',
    price: p.price,
    shopName: extra?.shopName,
    categoryName: extra?.categoryName,
    ownerName: extra?.ownerName,
    ownerEmail: extra?.ownerEmail,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }
}

export async function listProducts(
  query: { page?: string; limit?: string; search?: string; shopId?: string; categoryId?: string },
  viewer: Viewer
) {
  await ensureDb()
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10))
  const skip = (page - 1) * limit
  const q = query.search?.trim()
  const shopQ = query.shopId?.trim()
  const categoryQ = query.categoryId?.trim()

  if (categoryQ) {
    const cat = await Category.findById(categoryQ).lean()
    if (!cat) {
      throw err('Category not found', 404)
    }
    if (shopQ && String(cat.shopId) !== shopQ) {
      throw err('Category does not match the given shop', 400)
    }
  }

  const allowedShopIds = await resolveAllowedShopIds(viewer, shopQ)
  if (Array.isArray(allowedShopIds) && allowedShopIds.length === 0) {
    return { items: [], total: 0, page, limit }
  }

  const filter: Record<string, unknown> = {}
  if (Array.isArray(allowedShopIds)) {
    filter.shopId = { $in: allowedShopIds }
  }
  if (categoryQ) {
    filter.categoryId = categoryQ
  }
  if (q) {
    const rx = { $regex: q, $options: 'i' }
    const searchOr = { $or: [{ name: rx }, { productImage: rx }] }
    if (Object.keys(filter).length) {
      const base: Record<string, unknown> = { ...filter }
      for (const k of Object.keys(filter)) {
        delete (filter as Record<string, unknown>)[k]
      }
      filter.$and = [base, searchOr]
    } else {
      Object.assign(filter, searchOr)
    }
  }

  const [rows, total] = await Promise.all([
    Product.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Product.countDocuments(filter)
  ])

  const shopIds = [...new Set(rows.map(r => String(r.shopId)))]
  const categoryIds = [...new Set(rows.map(r => String(r.categoryId)))]
  const [shops, categories] = await Promise.all([
    Shop.find({ _id: { $in: shopIds } }).select('name userId').lean(),
    Category.find({ _id: { $in: categoryIds } }).select('name').lean()
  ])
  const ownerIds = [...new Set(shops.map(s => String(s.userId)))]
  const owners = await User.find({ _id: { $in: ownerIds } }).select('name email').lean()
  const shopById = new Map(shops.map(s => [String(s._id), s]))
  const catById = new Map(categories.map(c => [String(c._id), c]))
  const ownerById = new Map(owners.map(o => [String(o._id), o]))

  return {
    items: rows.map((row) => {
      const s = shopById.get(String(row.shopId))
      const c = catById.get(String(row.categoryId))
      const owner = s ? ownerById.get(String(s.userId)) : null
      return mapProduct(row as Parameters<typeof mapProduct>[0], {
        shopName: s?.name,
        categoryName: c?.name,
        ownerName: owner?.name,
        ownerEmail: owner?.email
      })
    }),
    total,
    page,
    limit
  }
}

export async function getProductById(id: string, viewer: Viewer) {
  await ensureDb()
  const row = await Product.findById(id).lean()
  if (!row) {
    throw err('Product not found', 404)
  }
  await assertProductShopAccess(viewer, String(row.shopId))
  const s = await Shop.findById(row.shopId).select('name userId').lean()
  const c = await Category.findById(row.categoryId).select('name').lean()
  const owner = s ? await User.findById(s.userId).select('name email').lean() : null
  return mapProduct(row as Parameters<typeof mapProduct>[0], {
    shopName: s?.name,
    categoryName: c?.name,
    ownerName: owner?.name,
    ownerEmail: owner?.email
  })
}

export async function createProduct(
  input: {
    shopId: string
    categoryId: string
    name: string
    productImage?: string
    price: number
  },
  viewer: Viewer
) {
  await ensureDb()
  const shopId = input.shopId?.trim() ?? ''
  const categoryId = input.categoryId?.trim() ?? ''
  const name = input.name?.trim() ?? ''
  const price = Number(input.price)
  if (!shopId || !categoryId || !name) {
    throw err('shopId, categoryId, and name are required', 400)
  }
  if (!Number.isFinite(price) || price < 0) {
    throw err('price must be a non-negative number', 400)
  }
  const shop = await Shop.findById(shopId).select('name userId').lean()
  if (!shop) {
    throw err('Shop not found', 404)
  }
  await assertProductShopAccess(viewer, String(shop._id))
  await assertCategoryBelongsToShop(categoryId, String(shop._id))

  const productImage = input.productImage?.trim() ?? ''
  const created = await Product.create({
    shopId: shop._id,
    categoryId,
    name,
    productImage,
    price
  })
  const cat = await Category.findById(categoryId).select('name').lean()
  const owner = await User.findById(shop.userId).select('name email').lean()
  return mapProduct(
    {
      _id: created._id,
      shopId: created.shopId,
      categoryId: created.categoryId,
      name: created.name,
      productImage: created.productImage,
      price: created.price,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    },
    {
      shopName: shop.name,
      categoryName: cat?.name,
      ownerName: owner?.name,
      ownerEmail: owner?.email
    }
  )
}

export async function updateProduct(
  id: string,
  input: { shopId?: string; categoryId?: string; name?: string; productImage?: string; price?: number },
  viewer: Viewer
) {
  await ensureDb()
  const row = await Product.findById(id)
  if (!row) {
    throw err('Product not found', 404)
  }
  await assertProductShopAccess(viewer, String(row.shopId))

  if (input.shopId != null) {
    const sid = String(input.shopId).trim()
    const s = await Shop.findById(sid).lean()
    if (!s) {
      throw err('Shop not found', 404)
    }
    await assertProductShopAccess(viewer, String(s._id))
    row.shopId = s._id
  }

  const nextShopId = String(row.shopId)
  if (input.categoryId != null) {
    const cid = String(input.categoryId).trim()
    await assertCategoryBelongsToShop(cid, nextShopId)
    row.set('categoryId', cid)
  } else {
    await assertCategoryBelongsToShop(String(row.categoryId), nextShopId)
  }

  if (input.name != null) {
    row.name = String(input.name).trim()
  }
  if (input.productImage != null) {
    row.productImage = String(input.productImage).trim()
  }
  if (input.price != null) {
    const p = Number(input.price)
    if (!Number.isFinite(p) || p < 0) {
      throw err('price must be a non-negative number', 400)
    }
    row.price = p
  }

  if (!row.name) {
    throw err('name is required', 400)
  }
  if (!Number.isFinite(row.price) || row.price < 0) {
    throw err('price must be a non-negative number', 400)
  }

  await row.save()
  const shop = await Shop.findById(row.shopId).select('name userId').lean()
  const cat = await Category.findById(row.categoryId).select('name').lean()
  const owner = shop ? await User.findById(shop.userId).select('name email').lean() : null
  return mapProduct(
    {
      _id: row._id,
      shopId: row.shopId,
      categoryId: row.categoryId,
      name: row.name,
      productImage: row.productImage,
      price: row.price,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    },
    {
      shopName: shop?.name,
      categoryName: cat?.name,
      ownerName: owner?.name,
      ownerEmail: owner?.email
    }
  )
}

export async function deleteProduct(id: string, viewer: Viewer) {
  await ensureDb()
  const row = await Product.findById(id)
  if (!row) {
    throw err('Product not found', 404)
  }
  await assertProductShopAccess(viewer, String(row.shopId))
  await row.deleteOne()
  return { deleted: true as const, id: String(row._id) }
}
