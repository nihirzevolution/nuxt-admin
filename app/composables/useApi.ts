import type {
  ApiResult,
  HealthData,
  LoginData,
  MeData,
  RegisterData
} from '#shared/types/api'

type LoginPayload = { email: string; password: string }
type RegisterPayload = { name: string; email: string; password: string }

const webClientHeaders = { 'X-Auth-Client': 'web' } as const

/**
 * Typed HTTP client for the Nitro API under /api/… (same base URL in browser & Postman).
 * Log in / register from the browser use `X-Auth-Client: web` (admin portal rules).
 */
export function useApi() {
  return {
    health: () => $fetch<ApiResult<HealthData>>('/api/v1/health'),
    me: () => $fetch<ApiResult<MeData>>('/api/auth/me'),
    login: (body: LoginPayload) =>
      $fetch<ApiResult<LoginData>>('/api/auth/login', {
        method: 'POST',
        body,
        headers: webClientHeaders
      }),
    register: (body: RegisterPayload) =>
      $fetch<ApiResult<RegisterData>>('/api/auth/register', {
        method: 'POST',
        body,
        headers: webClientHeaders
      })
  }
}
