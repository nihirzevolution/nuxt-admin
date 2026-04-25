import { listPurchases } from '../../controllers/purchases.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requirePurchaseModule } from '../../utils/guard'

/**
 * GET /api/purchases?page&limit&search&shopId&userId&productId
 * (Aliases: `shop_id`, `user_id`, `product_id`)
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requirePurchaseModule(event)
    const q = getQuery(event) as {
      page?: string
      limit?: string
      search?: string
      shopId?: string
      shop_id?: string
      userId?: string
      user_id?: string
      productId?: string
      product_id?: string
    }
    const data = await listPurchases(
      {
        page: q.page,
        limit: q.limit,
        search: q.search,
        shopId: q.shopId ?? q.shop_id,
        userId: q.userId ?? q.user_id,
        productId: q.productId ?? q.product_id
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
