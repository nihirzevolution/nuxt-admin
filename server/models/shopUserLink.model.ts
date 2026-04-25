import mongoose, { type Document, type Model, type Types } from 'mongoose'

/** User ↔ shop relationship: shop adds user; user accepts or declines. */
export type ShopUserLinkStatus = 'pending' | 'active' | 'declined' | 'revoked'

export interface IShopUserLink {
  userId: Types.ObjectId
  shopId: Types.ObjectId
  status: ShopUserLinkStatus
  /** Who created the invite (shop owner or staff). */
  invitedByUserId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type IShopUserLinkDocument = IShopUserLink & Document

const shopUserLinkSchema = new mongoose.Schema<IShopUserLinkDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'active', 'declined', 'revoked'] satisfies ShopUserLinkStatus[],
      index: true
    },
    invitedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true, collection: 'shop_user_links' }
)

shopUserLinkSchema.index({ userId: 1, shopId: 1 }, { unique: true })
shopUserLinkSchema.index({ shopId: 1, status: 1 })
shopUserLinkSchema.index({ userId: 1, status: 1 })

export const ShopUserLink
  = (mongoose.models.ShopUserLink as Model<IShopUserLinkDocument>)
  || mongoose.model<IShopUserLinkDocument>('ShopUserLink', shopUserLinkSchema)
