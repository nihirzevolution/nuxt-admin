import { updateCategory } from '../../controllers/categories.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopModule } from '../../utils/guard'

/**
 * PUT /api/categories/:id
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopModule(event)
    const id = getRouterParam(event, 'id') ?? ''
    const body = await readBody<{
      name?: string
      slug?: string
      shopId?: string
      shop_id?: string
      description?: string
    }>(event)
    const data = await updateCategory(
      id,
      {
        name: body.name,
        slug: body.slug,
        shopId: body.shopId ?? body.shop_id,
        description: body.description
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
