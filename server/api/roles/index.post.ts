import { createRole } from '../../controllers/roles.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireSuperAdmin } from '../../utils/guard'

/**
 * POST /api/roles
 * Body: { name, slug?, description? }
 */
export default defineEventHandler(async (event) => {
  try {
    await requireSuperAdmin(event)
    const body = await readBody<{
      name?: string
      slug?: string
      description?: string
    }>(event)
    const data = await createRole({
      name: String(body.name ?? ''),
      slug: body.slug,
      description: body.description
    })
    return jsonSuccess(event, data, 201)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
