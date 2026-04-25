import mongoose, { type Document, type Model, type Types } from 'mongoose'

export interface IPurchase {
  shopId: Types.ObjectId
  userId: Types.ObjectId
  productId: Types.ObjectId
  quantity: number
  priceAtPurchase: number
  totalAmount: number
  purchaseDate: Date
  notes?: string
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type IPurchaseDocument = IPurchase & Document

const purchaseSchema = new mongoose.Schema<IPurchaseDocument>(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    quantity: { type: Number, required: true, min: 0.01 },
    priceAtPurchase: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, required: true, default: () => new Date() },
    notes: { type: String, trim: true, maxlength: 2000 },
    deletedAt: { type: Date, default: null, index: true }
  },
  { timestamps: true, collection: 'purchases' }
)

purchaseSchema.index({ shopId: 1, userId: 1, purchaseDate: -1 })

export const Purchase
  = (mongoose.models.Purchase as Model<IPurchaseDocument>)
  || mongoose.model<IPurchaseDocument>('Purchase', purchaseSchema)
