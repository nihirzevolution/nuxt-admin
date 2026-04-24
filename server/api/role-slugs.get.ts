import { Role } from '../models'
import { connectDatabase } from '../lib/database'
import { jsonSuccess } from '../utils/apiResponse'
import { handleControllerError } from '../utils/httpError'
import { requireStaff } from '../utils/guard'

/**
 * GET /api/role-slugs — active roles for user forms (`admin` / `super_admin` only).
 * Hides `super_admin` for non-super users.
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireStaff(event)
    const { mongodbUri } = useRuntimeConfig()
    if (!mongodbUri) {
      throw new Error('Database is not configured')
    }
    await connectDatabase(String(mongodbUri))
    const rows = await Role.find({ isActive: true })
      .select('name slug')
      .sort({ slug: 1 })
      .lean()
    const canSeeSuper = String(user.role) === 'super_admin'
    const items = rows
      .filter((r) => canSeeSuper || r.slug !== 'super_admin')
      .map((r) => ({ slug: r.slug, name: r.name }))
    return jsonSuccess(event, { items })
  } catch (e) {
    return handleControllerError(event, e)
  }
})
