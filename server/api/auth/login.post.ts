import { randomUUID } from 'node:crypto'
import { jsonError, jsonSuccess } from '../../utils/apiResponse'

type LoginBody = { email?: string; password?: string }

/**
 * POST /api/auth/login
 * Postman: POST http://localhost:3000/api/auth/login
 * Body (raw JSON): { "email": "a@b.c", "password": "secret" }
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

  // Stub: replace with real auth (database, sessions, JWT, etc.)
  return jsonSuccess(event, {
    token: `stub-jwt-${randomUUID()}`,
    user: {
      id: '00000000-0000-0000-0000-000000000000',
      email
    }
  })
})
