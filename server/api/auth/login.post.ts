import { loginUser } from '../../controllers/auth.controller'
import { jsonError, jsonSuccess } from '../../utils/apiResponse'

type LoginBody = { email?: string; password?: string }

/**
 * POST /api/auth/login
 * Body: { "email", "password" }
 * `X-Auth-Client: app` — mobile; issue token to any valid role. Omit or `web` — browser; token only for admin/super_admin.
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

  const rawClient = getRequestHeader(event, 'x-auth-client')?.toLowerCase()
  const client: 'app' | 'web' = rawClient === 'app' ? 'app' : 'web'

  const config = useRuntimeConfig()
  const downloadFallback = String(config.public.appDownloadUrl || '#')

  try {
    const data = await loginUser({ email, password }, { client })
    return jsonSuccess(event, data)
  } catch (e: unknown) {
    const err = e as { message?: string; statusCode?: number; data?: { downloadUrl?: string } }
    const status = err.statusCode ?? 500
    if (status === 401) {
      return jsonError(
        event,
        'UNAUTHORIZED',
        err.message ?? 'Invalid email or password',
        401
      )
    }
    if (status === 403) {
      return jsonError(
        event,
        'WEB_STAFF_ONLY',
        err.message
          ?? 'This website is for administrators only. Please use the mobile app.',
        403,
        { downloadUrl: err.data?.downloadUrl ?? downloadFallback }
      )
    }
    if (e instanceof Error && e.message.includes('not configured')) {
      return jsonError(event, 'CONFIG', e.message, 500)
    }
    throw e
  }
})
