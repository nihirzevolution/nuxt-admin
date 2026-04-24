import { updateUser } from '../../controllers/users.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireAdmin } from '../../utils/guard'

/**
 * PUT /api/users/:id
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
    const body = await readBody<{
      name?: string
      email?: string
      role?: string
      isActive?: boolean
      password?: string
    }>(event)
    const data = await updateUser(id, String(user._id), body)
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
