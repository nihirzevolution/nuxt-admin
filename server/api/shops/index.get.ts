import { listShops } from '../../controllers/shops.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopModule } from '../../utils/guard'

/**
 * GET /api/shops?page&limit&search&userId (userId: staff only)
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopModule(event)
    const q = getQuery(event) as { page?: string; limit?: string; search?: string; userId?: string }
    const data = await listShops(q, {
      userId: String(user._id),
      role: String(user.role)
    })
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
