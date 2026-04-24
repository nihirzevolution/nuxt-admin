import { loginUser } from '../../controllers/auth.controller'
import { jsonError, jsonSuccess } from '../../utils/apiResponse'

type LoginBody = { email?: string; password?: string }

/**
 * POST /api/auth/login
 * Body: { "email", "password" }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event).catch(() => ({}))

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return jsonError(
      event,
      'VALIDATION_ERROR',
      'email and password are required',
      400
    )
  }

  try {
    const data = await loginUser({ email, password })
    return jsonSuccess(event, data)
  } catch (e: unknown) {
    const err = e as { message?: string; statusCode?: number }
    const status = err.statusCode ?? 500
    if (status === 401) {
      return jsonError(
        event,
        'UNAUTHORIZED',
        err.message ?? 'Invalid email or password',
        401
      )
    }
    if (e instanceof Error && e.message.includes('not configured')) {
      return jsonError(event, 'CONFIG', e.message, 500)
    }
    throw e
  }
})
