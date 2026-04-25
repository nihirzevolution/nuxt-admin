import { createCategory } from '../../controllers/categories.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopModule } from '../../utils/guard'

/**
 * POST /api/categories
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopModule(event)
    const body = await readBody<{
      name?: string
      slug?: string
      shopId?: string
      shop_id?: string
      description?: string
    }>(event)
    const data = await createCategory(
      {
        name: String(body.name ?? ''),
        slug: body.slug,
        shopId: String(body.shopId ?? body.shop_id ?? ''),
        description: body.description
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data, 201)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
