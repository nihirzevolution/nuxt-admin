import mongoose, { type Document, type Model, type Types } from 'mongoose'

export interface IProduct {
  shopId: Types.ObjectId
  categoryId: Types.ObjectId
  name: string
  productImage: string
  price: number
  createdAt: Date
  updatedAt: Date
}

export type IProductDocument = IProduct & Document

const productSchema = new mongoose.Schema<IProductDocument>(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    productImage: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 }
  },
  { timestamps: true, collection: 'products' }
)

productSchema.index({ shopId: 1, categoryId: 1, name: 1 })

export const Product
  = (mongoose.models.Product as Model<IProductDocument>)
  || mongoose.model<IProductDocument>('Product', productSchema)
