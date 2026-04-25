import { createShop } from '../../controllers/shops.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopModule } from '../../utils/guard'

/**
 * POST /api/shops
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopModule(event)
    const body = await readBody<{
      userId?: string
      name?: string
      address?: string
      phone?: string
      email?: string
      description?: string
      city?: string
      country?: string
      isActive?: boolean
    }>(event)
    const data = await createShop(
      {
        userId: body.userId,
        name: String(body.name ?? ''),
        address: String(body.address ?? ''),
        phone: String(body.phone ?? ''),
        email: body.email,
        description: body.description,
        city: body.city,
        country: body.country,
        isActive: body.isActive
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data, 201)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
