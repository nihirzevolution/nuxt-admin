import { getShopUserLinkById } from '../../controllers/shopUserLinks.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopLinkModule } from '../../utils/guard'

/**
 * GET /api/shop-links/:id
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopLinkModule(event)
    const id = getRouterParam(event, 'id') ?? ''
    const data = await getShopUserLinkById(id, {
      userId: String(user._id),
      role: String(user.role)
    })
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
