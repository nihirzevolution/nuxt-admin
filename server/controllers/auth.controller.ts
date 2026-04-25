import { connectDatabase } from '../lib/database'
import { User } from '../models'
import { hashPassword, verifyPassword } from '../utils/password'
import { signAccessToken } from '../utils/token'

/** Browser portal (`/login`, dashboard): only these roles may get a web session. */
const WEB_PORTAL_ROLES = new Set(['admin', 'super_admin'])

function isWebPortalRole(role: string) {
  return WEB_PORTAL_ROLES.has(role)
}

async function ensureDb() {
  const { mongodbUri } = useRuntimeConfig()
  if (!mongodbUri) {
    throw new Error('Database is not configured (MONGODB_URI missing)')
  }
  await connectDatabase(String(mongodbUri))
}

function isDuplicateKeyError(e: unknown) {
  return Boolean(
    e
    && typeof e === 'object'
    && 'code' in e
    && (e as { code: number }).code === 11000
  )
}

export async function registerUser(
  input: {
    name: string
    email: string
    password: string
  },
  options: { client: 'web' | 'app' } = { client: 'app' }
) {
  await ensureDb()
  const passwordHash = await hashPassword(input.password)
  try {
    const user = await User.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: 'user',
      isActive: true
    })
    const config = useRuntimeConfig()
    const downloadUrl = String(config.public.appDownloadUrl || '#')
    const message
      = 'Thank you for your registration! Open the app to sign in and continue.'
    const userPayload = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role
    }
    if (options.client === 'web') {
      return {
        user: userPayload,
        message,
        downloadUrl
      }
    }
    const token = await signAccessToken({
      sub: String(user._id),
      email: user.email,
      role: user.role
    })
    return {
      token,
      user: userPayload,
      message: 'Thank you for your registration! You can now use the application.',
      downloadUrl
    }
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      const err = new Error('An account with this email already exists')
      ;(err as { statusCode?: number }).statusCode = 409
      throw err
    }
    throw e
  }
}

export async function loginUser(
  input: { email: string; password: string },
  options: { client: 'web' | 'app' } = { client: 'app' }
) {
  await ensureDb()
  const email = input.email.toLowerCase().trim()
  const user = await User.findOne({ email, isActive: true }).select('+passwordHash')
  if (!user || !user.passwordHash) {
    const err = new Error('Invalid email or password')
    ;(err as { statusCode?: number }).statusCode = 401
    throw err
  }
  const valid = await verifyPassword(input.password, user.passwordHash)
  if (!valid) {
    const err = new Error('Invalid email or password')
    ;(err as { statusCode?: number }).statusCode = 401
    throw err
  }
  if (options.client === 'web' && !isWebPortalRole(user.role)) {
    const config = useRuntimeConfig()
    const downloadUrl = String(config.public.appDownloadUrl || '#')
    const err = new Error(
      'This website is for administrators only. Please use the mobile app for your account.'
    ) as Error & { statusCode?: number; data?: { downloadUrl: string } }
    err.statusCode = 403
    err.data = { downloadUrl }
    throw err
  }
  const token = await signAccessToken({
    sub: String(user._id),
    email: user.email,
    role: user.role
  })
  return {
    token,
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role
    }
  }
}
