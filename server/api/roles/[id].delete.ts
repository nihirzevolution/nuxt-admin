import { deleteRole } from '../../controllers/roles.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireSuperAdmin } from '../../utils/guard'

/**
 * DELETE /api/roles/:id
 */
export default defineEventHandler(async (event) => {
  try {
    await requireSuperAdmin(event)
    const id = getRouterParam(event, 'id')
    if (!id) {
      const e = new Error('id required') as { statusCode?: number }
      e.statusCode = 400
      throw e
    }
    const data = await deleteRole(id)
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
