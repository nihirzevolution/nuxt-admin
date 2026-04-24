import mongoose, { type Document, type Model } from 'mongoose'

/** System-style slugs; new roles are managed via the Roles module (same `slug` stored on user). */
export type UserRole = string

export interface IUser {
  email: string
  passwordHash: string
  name: string
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type IUserDocument = IUser & Document

const userSchema = new mongoose.Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      default: 'user',
      index: true
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'users' }
)

export const User
  = (mongoose.models.User as Model<IUserDocument>)
  || mongoose.model<IUserDocument>('User', userSchema)
