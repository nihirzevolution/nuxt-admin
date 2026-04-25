import { createShopUserInvites } from '../../controllers/shopUserLinks.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopLinkModule } from '../../utils/guard'

/**
 * POST /api/shop-links
 * Shop owner or staff. Body: `shopId`/`shop_id`, `userId` or `userIds` (string[]).
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopLinkModule(event)
    const body = await readBody<{
      shopId?: string
      shop_id?: string
      userId?: string
      user_id?: string
      userIds?: string[]
    }>(event)
    const data = await createShopUserInvites(
      {
        shopId: String(body.shopId ?? body.shop_id ?? ''),
        userId: body.userId ?? body.user_id,
        userIds: body.userIds
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data, 201)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
