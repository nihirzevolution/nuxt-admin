import { getCookie, getRequestHeader } from 'h3'
import { connectDatabase } from '../../lib/database'
import { User } from '../../models'
import { jsonError, jsonSuccess } from '../../utils/apiResponse'
import { verifyAccessToken } from '../../utils/token'

async function ensureDb() {
  const { mongodbUri } = useRuntimeConfig()
  if (!mongodbUri) {
    throw new Error('Database is not configured (MONGODB_URI missing)')
  }
  await connectDatabase(String(mongodbUri))
}

/**
 * GET /api/auth/me
 * Reads JWT from `auth_token` cookie or `Authorization: Bearer <token>`.
 * Validates signature/expiry, then checks user is active in the database.
 */
export default defineEventHandler(async (event) => {
  const fromCookie = getCookie(event, 'auth_token') ?? null
  const header = getRequestHeader(event, 'authorization')
  const bearer
    = header?.toLowerCase().startsWith('bearer ')
      ? header.slice(7).trim()
      : null
  const token = fromCookie || bearer
  if (!token) {
    return jsonError(event, 'UNAUTHORIZED', 'No access token', 401)
  }

  try {
    const payload = await verifyAccessToken(token)
    await ensureDb()
    const user = await User.findById(String(payload.sub)).select(
      'email name role isActive'
    )
    if (!user || !user.isActive) {
      return jsonError(event, 'UNAUTHORIZED', 'User not found or inactive', 401)
    }
    return jsonSuccess(event, {
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch {
    return jsonError(
      event,
      'UNAUTHORIZED',
      'Invalid or expired session',
      401
    )
  }
})
