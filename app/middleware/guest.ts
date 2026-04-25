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
      // App-only account: clear so staff can use this device on /login
      clearSession()
      return
    }
  } catch {
    // network or invalid — drop cookie so /login is usable
  }
  if (token.value) {
    clearSession()
  }
})
