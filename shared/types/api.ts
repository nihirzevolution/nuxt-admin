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
  user: { id: string; email: string; name: string; role: string }
}

export type MeData = {
  user: { id: string; email: string; name: string; role: string }
}

export type RegisterData = {
  /** Present when `X-Auth-Client: app`; web registration does not issue a browser session. */
  token?: string
  user: { id: string; name: string; email: string; role: string }
  message: string
  downloadUrl: string
}
