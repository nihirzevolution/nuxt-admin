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
    if (res?.ok && res.data.user) {
      const r = res.data.user.role
      if (r === 'admin' || r === 'super_admin') {
        return navigateTo('/dashboard')
      }
      return navigateTo('/')
    }
  } catch {
    // stale / invalid token while on guest page
  }
  clearSession()
})
