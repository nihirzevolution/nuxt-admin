import { jsonError, jsonSuccess } from '../../utils/apiResponse'

type RegisterBody = { name?: string; email?: string; password?: string }

/**
 * POST /api/auth/register
 * Postman: POST http://localhost:3000/api/auth/register
 * Body: { "name": "Jane", "email": "a@b.c", "password": "secret123" }
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

  // Stub: replace with persistence and duplicate-email checks
  return jsonSuccess(
    event,
    {
      id: '00000000-0000-0000-0000-000000000001',
      name,
      email
    },
    201
  )
})
