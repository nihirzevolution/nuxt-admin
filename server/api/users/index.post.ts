import { createUser } from '../../controllers/users.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireAdmin } from '../../utils/guard'

/**
 * POST /api/users
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const body = await readBody<{
      name?: string
      email?: string
      password?: string
      role?: string
      isActive?: boolean
    }>(event)
    const data = await createUser({
      name: String(body.name ?? ''),
      email: String(body.email ?? ''),
      password: String(body.password ?? ''),
      role: body.role,
      isActive: body.isActive
    })
    return jsonSuccess(event, data, 201)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
