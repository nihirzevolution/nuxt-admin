import { connectDatabase } from '../lib/database'
import { Shop, ShopUserLink, User, type ShopUserLinkStatus } from '../models'

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

async function resolveShopAccess(viewer: Viewer, shopId: string) {
  if (isStaffRole(viewer.role)) {
    const s = await Shop.findById(shopId).select('_id').lean()
    if (!s) {
      throw err('Shop not found', 404)
    }
    return
  }
  if (viewer.role === 'shop_owner') {
    const s = await Shop.findOne({ _id: shopId, userId: viewer.userId }).lean()
    if (!s) {
      throw err('Shop not found', 404)
    }
    return
  }
  throw err('Forbidden', 403)
}

export function mapShopUserLink(
  row: {
    _id: unknown
    userId: unknown
    shopId: unknown
    status: string
    invitedByUserId: unknown
    createdAt: Date
    updatedAt: Date
  },
  extra?: {
    shopName?: string
    userName?: string
    userEmail?: string
    inviterName?: string
  }
) {
  return {
    id: String(row._id),
    userId: String(row.userId),
    shopId: String(row.shopId),
    status: row.status,
    invitedByUserId: String(row.invitedByUserId),
    shopName: extra?.shopName,
    userName: extra?.userName,
    userEmail: extra?.userEmail,
    inviterName: extra?.inviterName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

async function enrichRows(
  rows: Array<{
    _id: unknown
    userId: unknown
    shopId: unknown
    status: string
    invitedByUserId: unknown
    createdAt: Date
    updatedAt: Date
  }>
) {
  if (!rows.length) {
    return []
  }
  const shopIds = [...new Set(rows.map(r => String(r.shopId)))]
  const userIds = [
    ...new Set([
      ...rows.map(r => String(r.userId)),
      ...rows.map(r => String(r.invitedByUserId))
    ])
  ]
  const [shops, users] = await Promise.all([
    Shop.find({ _id: { $in: shopIds } }).select('name').lean(),
    User.find({ _id: { $in: userIds } }).select('name email').lean()
  ])
  const shopById = new Map(shops.map(s => [String(s._id), s]))
  const userById = new Map(users.map(u => [String(u._id), u]))
  return rows.map((row) => {
    const s = shopById.get(String(row.shopId))
    const u = userById.get(String(row.userId))
    const inv = userById.get(String(row.invitedByUserId))
    return mapShopUserLink(row, {
      shopName: s?.name,
      userName: u?.name,
      userEmail: u?.email,
      inviterName: inv?.name
    })
  })
}

/**
 * List links: staff/owner by `shopId` or `userId`; end user — own links (no `shopId` for shop-side list).
 */
export async function listShopUserLinks(
  query: {
    page?: string
    limit?: string
    shopId?: string
    userId?: string
    status?: string
  },
  viewer: Viewer
) {
  await ensureDb()
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 20))
  const skip = (page - 1) * limit
  const statusFilter = query.status?.trim() as ShopUserLinkStatus | undefined
  if (statusFilter && !['pending', 'active', 'declined', 'revoked'].includes(statusFilter)) {
    throw err('Invalid status filter', 400)
  }

  const filter: Record<string, unknown> = {}
  if (statusFilter) {
    filter.status = statusFilter
  }

  if (viewer.role === 'user') {
    filter.userId = viewer.userId
    const onlyShop = query.shopId?.trim()
    if (onlyShop) {
      filter.shopId = onlyShop
    }
  } else if (isStaffRole(viewer.role)) {
    const shopQ = query.shopId?.trim()
    const userQ = query.userId?.trim()
    if (!shopQ && !userQ) {
      throw err('For staff, provide shopId and/or userId to list shop–user links', 400)
    }
    if (shopQ) {
      filter.shopId = shopQ
    }
    if (userQ) {
      filter.userId = userQ
    }
  } else if (viewer.role === 'shop_owner') {
    const shopQ = query.shopId?.trim()
    if (!shopQ) {
      throw err('shopId is required to list members of your shop', 400)
    }
    await resolveShopAccess(viewer, shopQ)
    filter.shopId = shopQ
  } else {
    throw err('Forbidden', 403)
  }

  const [raw, total] = await Promise.all([
    ShopUserLink.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    ShopUserLink.countDocuments(filter)
  ])
  return {
    items: await enrichRows(raw as Parameters<typeof enrichRows>[0]),
    total,
    page,
    limit
  }
}

export async function getShopUserLinkById(id: string, viewer: Viewer) {
  await ensureDb()
  const row = await ShopUserLink.findById(id).lean()
  if (!row) {
    throw err('Link not found', 404)
  }
  if (isStaffRole(viewer.role)) {
    // ok
  } else if (viewer.role === 'user' && String(row.userId) === viewer.userId) {
    // ok
  } else if (viewer.role === 'shop_owner') {
    await resolveShopAccess(viewer, String(row.shopId))
  } else {
    throw err('Forbidden', 403)
  }
  const [one] = await enrichRows([row as Parameters<typeof enrichRows>[0][0]])
  return one
}

async function upsertInvite(
  shopId: string,
  targetUserId: string,
  invitedBy: string
) {
  const existing = await ShopUserLink.findOne({ shopId, userId: targetUserId })
  if (!existing) {
    return ShopUserLink.create({
      shopId,
      userId: targetUserId,
      status: 'pending' as const,
      invitedByUserId: invitedBy
    })
  }
  if (existing.status === 'active') {
    throw err('User is already a member of this shop', 400)
  }
  if (existing.status === 'pending') {
    throw err('An invite is already pending for this user and shop', 400)
  }
  existing.status = 'pending'
  existing.invitedByUserId = invitedBy as unknown as typeof existing.invitedByUserId
  await existing.save()
  return existing
}

/**
 * One or many user ids; shop must be allowed for viewer.
 */
export async function createShopUserInvites(
  input: { shopId: string; userId?: string; userIds?: string[] },
  viewer: Viewer
) {
  await ensureDb()
  const shopId = input.shopId?.trim() ?? ''
  if (!shopId) {
    throw err('shopId is required', 400)
  }
  if (viewer.role === 'user') {
    throw err('Only staff or a shop owner can send invites', 403)
  }
  await resolveShopAccess(viewer, shopId)

  const rawIds = input.userIds?.length
    ? input.userIds
    : input.userId
      ? [input.userId]
      : []
  const userIds = [...new Set(rawIds.map(id => String(id).trim()).filter(Boolean))]
  if (!userIds.length) {
    throw err('userId or userIds is required', 400)
  }

  const shop = await Shop.findById(shopId).select('_id userId').lean()
  if (!shop) {
    throw err('Shop not found', 404)
  }

  const inviter = viewer.userId
  const results: Array<{ userId: string; ok: boolean; id?: string; error?: string }> = []

  for (const uid of userIds) {
    if (String(shop.userId) === uid) {
      results.push({ userId: uid, ok: false, error: 'Shop owner account cannot be linked as a customer to the same shop' })
      continue
    }
    const u = await User.findById(uid).select('_id isActive').lean()
    if (!u) {
      results.push({ userId: uid, ok: false, error: 'User not found' })
      continue
    }
    if (!u.isActive) {
      results.push({ userId: uid, ok: false, error: 'User is inactive' })
      continue
    }
    try {
      const doc = await upsertInvite(shopId, uid, inviter)
      results.push({ userId: uid, ok: true, id: String(doc._id) })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed'
      results.push({ userId: uid, ok: false, error: msg })
    }
  }

  return {
    shopId,
    invitedByUserId: inviter,
    results
  }
}

/**
 * User accepts (active) or declines (declined) a pending invite.
 */
export async function respondToShopUserLink(
  id: string,
  input: { action: 'accept' | 'decline' },
  viewer: Viewer
) {
  await ensureDb()
  if (viewer.role !== 'user') {
    throw err('Only the invited user can accept or decline', 403)
  }
  const action = input.action
  if (action !== 'accept' && action !== 'decline') {
    throw err('action must be accept or decline', 400)
  }
  const row = await ShopUserLink.findById(id)
  if (!row) {
    throw err('Link not found', 404)
  }
  if (String(row.userId) !== viewer.userId) {
    throw err('Forbidden', 403)
  }
  if (row.status !== 'pending') {
    throw err('This invite is not pending', 400)
  }
  row.status = action === 'accept' ? 'active' : 'declined'
  await row.save()
  return getShopUserLinkById(String(row._id), viewer)
}

export async function revokeShopUserLink(id: string, viewer: Viewer) {
  await ensureDb()
  const row = await ShopUserLink.findById(id)
  if (!row) {
    throw err('Link not found', 404)
  }
  if (viewer.role === 'user') {
    throw err('Use decline on a pending invite, or ask the shop to remove you', 403)
  }
  if (isStaffRole(viewer.role)) {
    // ok
  } else if (viewer.role === 'shop_owner') {
    await resolveShopAccess(viewer, String(row.shopId))
  } else {
    throw err('Forbidden', 403)
  }
  if (row.status === 'revoked' || row.status === 'declined') {
    return { revoked: true as const, id: String(row._id), status: row.status }
  }
  row.status = 'revoked'
  await row.save()
  return { revoked: true as const, id: String(row._id) }
}
