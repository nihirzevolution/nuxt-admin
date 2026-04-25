import { createProduct } from '../../controllers/products.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopModule } from '../../utils/guard'

/**
 * POST /api/products
 * Body: `shopId` or `shop_id`, `categoryId` or `category_id`, `name`, `price`, optional `productImage` / `product_image`
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopModule(event)
    const body = await readBody<{
      name?: string
      price?: number
      productImage?: string
      product_image?: string
      shopId?: string
      shop_id?: string
      categoryId?: string
      category_id?: string
    }>(event)
    const data = await createProduct(
      {
        shopId: String(body.shopId ?? body.shop_id ?? ''),
        categoryId: String(body.categoryId ?? body.category_id ?? ''),
        name: String(body.name ?? ''),
        productImage: body.productImage ?? body.product_image,
        price: Number(body.price)
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data, 201)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
