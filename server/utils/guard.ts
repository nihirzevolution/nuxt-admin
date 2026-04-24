import { getCookie, getRequestHeader } from 'h3'
import { connectDatabase } from '../lib/database'
import { User, type IUserDocument } from '../models'
import { verifyAccessToken } from './token'

async function ensureDb() {
  const { mongodbUri } = useRuntimeConfig()
  if (!mongodbUri) {
    throw new Error('Database is not configured (MONGODB_URI missing)')
  }
  await connectDatabase(String(mongodbUri))
}

function getTokenFromEvent(event: Parameters<typeof getCookie>[0]) {
  const fromCookie = getCookie(event, 'auth_token') ?? null
  const header = getRequestHeader(event, 'authorization')
  const bearer
    = header?.toLowerCase().startsWith('bearer ')
      ? header.slice(7).trim()
      : null
  return fromCookie || bearer
}

const ADMIN_ROLES = new Set(['admin', 'super_admin'])

/**
 * Resolves the current user for protected APIs (401 if missing/invalid user).
 */
export async function getAuthUserFromEvent(
  event: Parameters<typeof getCookie>[0]
) {
  const token = getTokenFromEvent(event)
  if (!token) {
    const e = new Error('Unauthorized') as { statusCode?: number }
    e.statusCode = 401
    throw e
  }
  let payload: { sub: string; email: string; role: string }
  try {
    payload = await verifyAccessToken(token) as { sub: string; email: string; role: string }
  } catch {
    const e = new Error('Invalid session') as { statusCode?: number }
    e.statusCode = 401
    throw e
  }
  await ensureDb()
  const user = await User.findById(String(payload.sub))
  if (!user || !user.isActive) {
    const e = new Error('User not found or inactive') as { statusCode?: number }
    e.statusCode = 401
    throw e
  }
  return { user, token, payload } as { user: IUserDocument; token: string; payload: { sub: string; email: string; role: string } }
}

export async function requireAuth(event: Parameters<typeof getCookie>[0]) {
  return getAuthUserFromEvent(event)
}

/**
 * For role / user management APIs: must be `admin` or `super_admin`.
 */
export async function requireAdmin(
  event: Parameters<typeof getCookie>[0]
) {
  const { user, token, payload } = await getAuthUserFromEvent(event)
  if (!ADMIN_ROLES.has(String(user.role))) {
    const e = new Error('Forbidden') as { statusCode?: number }
    e.statusCode = 403
    throw e
  }
  return { user, token, payload }
}
