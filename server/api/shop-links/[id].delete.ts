import { revokeShopUserLink } from '../../controllers/shopUserLinks.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopLinkModule } from '../../utils/guard'

/**
 * DELETE /api/shop-links/:id
 * Shop owner (that shop) or staff: set status to `revoked` (removes the customer from the shop side).
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopLinkModule(event)
    const id = getRouterParam(event, 'id') ?? ''
    const data = await revokeShopUserLink(id, {
      userId: String(user._id),
      role: String(user.role)
    })
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
