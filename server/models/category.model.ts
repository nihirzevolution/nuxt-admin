import mongoose, { type Document, type Model, type Types } from 'mongoose'

export interface ICategory {
  name: string
  slug: string
  shopId: Types.ObjectId
  description?: string
  createdAt: Date
  updatedAt: Date
}

export type ICategoryDocument = ICategory & Document

const categorySchema = new mongoose.Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true
    },
    description: { type: String, trim: true, maxlength: 2000 }
  },
  { timestamps: true, collection: 'categories' }
)

categorySchema.index({ shopId: 1, slug: 1 }, { unique: true })
categorySchema.index({ name: 'text', slug: 'text', description: 'text' }, { name: 'category_text' })

export const Category
  = (mongoose.models.Category as Model<ICategoryDocument>)
  || mongoose.model<ICategoryDocument>('Category', categorySchema)
