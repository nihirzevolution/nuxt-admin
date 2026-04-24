import { getUserById } from '../../controllers/users.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireAdmin } from '../../utils/guard'

/**
 * GET /api/users/:id
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const id = getRouterParam(event, 'id')
    if (!id) {
      const e = new Error('id required') as { statusCode?: number }
      e.statusCode = 400
      throw e
    }
    const data = await getUserById(id)
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
