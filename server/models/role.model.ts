import mongoose, { type Document, type Model } from 'mongoose'

export interface IRole {
  name: string
  slug: string
  description: string
  isSystem: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type IRoleDocument = IRole & Document

const roleSchema = new mongoose.Schema<IRoleDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/
    },
    description: { type: String, default: '' },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'roles' }
)

export const Role
  = (mongoose.models.Role as Model<IRoleDocument>)
  || mongoose.model<IRoleDocument>('Role', roleSchema)
