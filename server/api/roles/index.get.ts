import { listRoles } from '../../controllers/roles.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireAdmin } from '../../utils/guard'

/**
 * GET /api/roles?page&limit&active=1
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const data = await listRoles(getQuery(event) as { page?: string; limit?: string; active?: string })
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
