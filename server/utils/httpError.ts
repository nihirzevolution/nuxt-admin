import type { H3Event } from 'h3'
import { jsonError } from './apiResponse'

export function handleControllerError(event: H3Event, e: unknown) {
  if (e && typeof e === 'object' && 'statusCode' in e) {
    const x = e as { statusCode: number; message?: string }
    if (typeof x.statusCode === 'number' && x.statusCode >= 400 && x.statusCode < 600) {
      return jsonError(
        event,
        'ERROR',
        x.message ?? (e as Error).message ?? 'Error',
        x.statusCode
      )
    }
  }
  throw e
}
