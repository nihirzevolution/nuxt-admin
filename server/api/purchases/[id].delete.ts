import { softDeletePurchase } from '../../controllers/purchases.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requirePurchaseModule } from '../../utils/guard'

/**
 * DELETE /api/purchases/:id — soft delete (`deletedAt` set).
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requirePurchaseModule(event)
    const id = getRouterParam(event, 'id') ?? ''
    const data = await softDeletePurchase(id, {
      userId: String(user._id),
      role: String(user.role)
    })
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
