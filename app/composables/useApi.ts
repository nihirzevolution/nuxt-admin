import type {
  ApiResult,
  HealthData,
  LoginData,
  RegisterData
} from '#shared/types/api'

type LoginPayload = { email: string; password: string }
type RegisterPayload = { name: string; email: string; password: string }

/**
 * Typed HTTP client for the Nitro API under /api/… (same base URL in browser & Postman).
 */
export function useApi() {
  return {
    health: () => $fetch<ApiResult<HealthData>>('/api/v1/health'),
    login: (body: LoginPayload) =>
      $fetch<ApiResult<LoginData>>('/api/auth/login', { method: 'POST', body }),
    register: (body: RegisterPayload) =>
      $fetch<ApiResult<RegisterData>>('/api/auth/register', {
        method: 'POST',
        body
      })
  }
}
