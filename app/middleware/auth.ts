import type { ApiResult, MeData } from '#shared/types/api'

/**
 * Use on protected pages (e.g. dashboard). Ensures cookie exists and JWT is valid; syncs `auth:user` state.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { token, user, clearSession } = useAuth()
  if (!token.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  const requestFetch = useRequestFetch()
  try {
    const res = await requestFetch<ApiResult<MeData>>('/api/auth/me', {
      credentials: 'include'
    })
    if (res?.ok) {
      user.value = res.data.user
      return
    }
  } catch {
    // 401 or network
  }
  clearSession()
  return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
})
