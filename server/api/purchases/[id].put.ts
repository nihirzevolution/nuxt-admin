import {
  parsePurchaseDateInput,
  updatePurchase
} from '../../controllers/purchases.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requirePurchaseModule } from '../../utils/guard'

/**
 * PUT /api/purchases/:id
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requirePurchaseModule(event)
    const id = getRouterParam(event, 'id') ?? ''
    const body = await readBody<{
      shopId?: string
      shop_id?: string
      userId?: string
      user_id?: string
      productId?: string
      product_id?: string
      quantity?: number
      priceAtPurchase?: number
      price_at_purchase?: number
      totalAmount?: number
      total_amount?: number
      purchaseDate?: string
      purchase_date?: string
      notes?: string
    }>(event)
    const data = await updatePurchase(
      id,
      {
        shopId: body.shopId ?? body.shop_id,
        userId: body.userId ?? body.user_id,
        productId: body.productId ?? body.product_id,
        quantity: body.quantity,
        priceAtPurchase: body.priceAtPurchase ?? body.price_at_purchase,
        totalAmount: body.totalAmount ?? body.total_amount,
        purchaseDate: parsePurchaseDateInput(body.purchaseDate ?? body.purchase_date),
        notes: body.notes
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
