export type ApiOk<T> = { ok: true; data: T }
export type ApiErr = {
  ok: false
  error: { code: string; message: string; details?: unknown }
}
export type ApiResult<T> = ApiOk<T> | ApiErr

export type HealthData = {
  status: 'ok'
  service: string
  time: string
}

export type LoginData = {
  token: string
  user: { id: string; email: string }
}

export type RegisterData = {
  id: string
  name: string
  email: string
}
