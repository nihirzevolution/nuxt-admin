import { listShopUserLinks } from '../../controllers/shopUserLinks.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopLinkModule } from '../../utils/guard'

/**
 * GET /api/shop-links?page&limit&shopId&userId&status
 * - End user: own links; optional `shopId` to filter one shop.
 * - Shop owner: must pass `shopId` (their shop).
 * - Staff: pass `shopId` and/or `userId` (at least one).
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopLinkModule(event)
    const q = getQuery(event) as {
      page?: string
      limit?: string
      shopId?: string
      shop_id?: string
      userId?: string
      user_id?: string
      status?: string
    }
    const data = await listShopUserLinks(
      {
        page: q.page,
        limit: q.limit,
        shopId: q.shopId ?? q.shop_id,
        userId: q.userId ?? q.user_id,
        status: q.status
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
