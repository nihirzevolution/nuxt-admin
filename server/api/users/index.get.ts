import { listUsers } from '../../controllers/users.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireAdmin } from '../../utils/guard'

/**
 * GET /api/users?page&limit&search
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const data = await listUsers(getQuery(event) as { page?: string; limit?: string; search?: string })
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
