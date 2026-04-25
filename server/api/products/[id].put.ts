import { updateProduct } from '../../controllers/products.controller'
import { jsonSuccess } from '../../utils/apiResponse'
import { handleControllerError } from '../../utils/httpError'
import { requireShopModule } from '../../utils/guard'

/**
 * PUT /api/products/:id
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireShopModule(event)
    const id = getRouterParam(event, 'id') ?? ''
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
    const data = await updateProduct(
      id,
      {
        name: body.name,
        price: body.price,
        productImage: body.productImage ?? body.product_image,
        shopId: body.shopId ?? body.shop_id,
        categoryId: body.categoryId ?? body.category_id
      },
      { userId: String(user._id), role: String(user.role) }
    )
    return jsonSuccess(event, data)
  } catch (e) {
    return handleControllerError(event, e)
  }
})
