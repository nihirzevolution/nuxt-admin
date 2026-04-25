import { registerUser } from '../../controllers/auth.controller'
import { jsonError, jsonSuccess } from '../../utils/apiResponse'

type RegisterBody = { name?: string; email?: string; password?: string }

/**
 * POST /api/auth/register
 * Body: { "name", "email", "password" } — creates a standard user (role: user)
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event).catch(() => ({}))

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!name || !email || !password) {
    return jsonError(
      event,
      'VALIDATION_ERROR',
      'name, email, and password are required',
      400
    )
  }

  if (password.length < 8) {
    return jsonError(
      event,
      'VALIDATION_ERROR',
      'password must be at least 8 characters',
      400
    )
  }

  const rawClient = getRequestHeader(event, 'x-auth-client')?.toLowerCase()
  const client: 'app' | 'web' = rawClient === 'app' ? 'app' : 'web'

  try {
    const data = await registerUser({ name, email, password }, { client })
    return jsonSuccess(event, data, 201)
  } catch (e: unknown) {
    const err = e as { message?: string; statusCode?: number }
    if (err.statusCode === 409) {
      return jsonError(
        event,
        'EMAIL_IN_USE',
        err.message ?? 'Email already registered',
        409
      )
    }
    if (e instanceof Error && e.message.includes('not configured')) {
      return jsonError(event, 'CONFIG', e.message, 500)
    }
    throw e
  }
})
