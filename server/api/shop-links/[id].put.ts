import { respondToShopUserLink } from '../../controllers/shopUserLinks.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopLinkModule } from '../../utils/guard'

/**
 * PUT /api/shop-links/:id
 * Invited user only: body `{ "action": "accept" }` or `{ "action": "decline" }` when status is `pending`.
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopLinkModule(event)
    const id = getRouterParam(event, 'id') ?? ''
    const body = await readBody<{ action?: string }>(event)
    const act = String(body.action ?? '').toLowerCase()
    if (act !== 'accept' && act !== 'decline') {
      const e = new Error('action must be "accept" or "decline"') as { statusCode?: number }
      e.statusCode = 400
      throw e
    }
    const data = await respondToShopUserLink(
      id,
      { action: act === 'decline' ? 'decline' : 'accept' },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
