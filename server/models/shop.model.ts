import mongoose, { type Document, type Model, type Types } from 'mongoose'

export interface IShop {
  userId: Types.ObjectId
  name: string
  address: string
  phone: string
  email?: string
  description?: string
  city?: string
  country?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type IShopDocument = IShop & Document

const shopSchema = new mongoose.Schema<IShopDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 2000 },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'shops' }
)

export const Shop
  = (mongoose.models.Shop as Model<IShopDocument>)
  || mongoose.model<IShopDocument>('Shop', shopSchema)
