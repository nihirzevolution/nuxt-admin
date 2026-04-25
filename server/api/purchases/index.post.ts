import {
  createPurchase,
  parsePurchaseDateInput
} from '../../controllers/purchases.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requirePurchaseModule } from '../../utils/guard'

/**
 * POST /api/purchases
 * Body: `shopId`/`shop_id`, `userId`/`user_id` (for **user** ignored — always self;
 * for **shop_owner** = customer, omit/empty = shop owner as buyer;
 * for **admin** / **super_admin** required),
 * `productId`/`product_id`, `quantity`, `priceAtPurchase`/`price_at_purchase`,
 * optional `totalAmount`/`total_amount`, `purchaseDate`/`purchase_date`, `notes`.
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requirePurchaseModule(event)
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
    const data = await createPurchase(
      {
        shopId: String(body.shopId ?? body.shop_id ?? ''),
        userId: String(body.userId ?? body.user_id ?? ''),
        productId: String(body.productId ?? body.product_id ?? ''),
        quantity: Number(body.quantity),
        priceAtPurchase: Number(body.priceAtPurchase ?? body.price_at_purchase),
        totalAmount: body.totalAmount ?? body.total_amount,
        purchaseDate: parsePurchaseDateInput(body.purchaseDate ?? body.purchase_date),
        notes: body.notes
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data, 201)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
