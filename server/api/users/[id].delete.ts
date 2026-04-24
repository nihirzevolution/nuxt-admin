import { deleteUser } from '../../controllers/users.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireAdmin } from '../../utils/guard'

/**
 * DELETE /api/users/:id
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAdmin(event)
    const id = getRouterParam(event, 'id')
    if (!id) {
      const e = new Error('id required') as { statusCode?: number }
      e.statusCode = 400
      throw e
    }
    const data = await deleteUser(id, String(user._id))
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
