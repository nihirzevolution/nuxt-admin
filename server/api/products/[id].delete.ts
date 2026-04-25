import { deleteProduct } from '../../controllers/products.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopModule } from '../../utils/guard'

/**
 * DELETE /api/products/:id
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopModule(event)
    const id = getRouterParam(event, 'id') ?? ''
    const data = await deleteProduct(id, {
      userId: String(user._id),
      role: String(user.role)
    })
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
