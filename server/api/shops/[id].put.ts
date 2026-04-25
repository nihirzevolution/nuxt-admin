import { updateShop } from '../../controllers/shops.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopModule } from '../../utils/guard'

/**
 * PUT /api/shops/:id
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopModule(event)
    const id = getRouterParam(event, 'id') ?? ''
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
    const data = await updateShop(
      id,
      {
        userId: body.userId,
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        description: body.description,
        city: body.city,
        country: body.country,
        isActive: body.isActive
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
