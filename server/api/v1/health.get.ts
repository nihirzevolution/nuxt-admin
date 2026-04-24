import { jsonSuccess } from '../../utils/apiResponse'

/**
 * GET /api/v1/health
 * Postman: GET http://localhost:3000/api/v1/health
 */
export default defineEventHandler((event) => {
  return jsonSuccess(event, {
    status: 'ok' as const,
    service: 'nativeadmin',
    time: new Date().toISOString()
  })
})
