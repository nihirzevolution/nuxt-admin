import { listProducts } from '../../controllers/products.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopModule } from '../../utils/guard'

/**
 * GET /api/products?page&limit&search&shopId&categoryId
 * (Aliases: `shop_id`, `category_id`)
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopModule(event)
    const q = getQuery(event) as {
      page?: string
      limit?: string
      search?: string
      shopId?: string
      shop_id?: string
      categoryId?: string
      category_id?: string
    }
    const data = await listProducts(
      {
        page: q.page,
        limit: q.limit,
        search: q.search,
        shopId: q.shopId ?? q.shop_id,
        categoryId: q.categoryId ?? q.category_id
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
