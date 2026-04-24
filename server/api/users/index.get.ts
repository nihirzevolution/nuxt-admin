import { listUsers } from '../../controllers/users.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireStaff } from '../../utils/guard'

/**
 * GET /api/users?page&limit&search
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireStaff(event)
    const data = await listUsers(getQuery(event) as { page?: string; limit?: string; search?: string }, {
      viewerRole: String(user.role)
    })
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
