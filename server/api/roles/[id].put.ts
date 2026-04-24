import { updateRole } from '../../controllers/roles.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireAdmin } from '../../utils/guard'

/**
 * PUT /api/roles/:id
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
    const body = await readBody<{
      name?: string
      slug?: string
      description?: string
      isActive?: boolean
    }>(event)
    const data = await updateRole(id, body)
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
