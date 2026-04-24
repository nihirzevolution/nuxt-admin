import type { H3Event } from 'h3'

export type ApiSuccess<T> = { ok: true; data: T }
export type ApiErrorBody = {
  ok: false
  error: { code: string; message: string; details?: unknown }
}

export function jsonSuccess<T>(event: H3Event, data: T, status = 200) {
  setResponseStatus(event, status)
  return { ok: true as const, data }
}

export function jsonError(
  event: H3Event,
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  setResponseStatus(event, status)
  const body: ApiErrorBody = {
    ok: false,
    error: details !== undefined
      ? { code, message, details }
      : { code, message }
  }
  return body
}
