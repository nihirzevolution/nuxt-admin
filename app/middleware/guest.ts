import type { ApiResult, MeData } from '#shared/types/api'

/**
 * For login/register: if a valid session exists, go straight to the dashboard.
 */
export default defineNuxtRouteMiddleware(async () => {
  const { token, clearSession } = useAuth()
  if (!token.value) {
    return
  }

  const requestFetch = useRequestFetch()
  try {
    const res = await requestFetch<ApiResult<MeData>>('/api/auth/me', {
      credentials: 'include'
    })
    if (res?.ok) {
      return navigateTo('/dashboard')
    }
  } catch {
    // stale / invalid token while on guest page
  }
  clearSession()
})
