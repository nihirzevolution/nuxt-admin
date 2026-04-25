import type { MeData } from '#shared/types/api'

export const AUTH_TOKEN_COOKIE = 'auth_token'

/**
 * Session: JWT in an HttpOnly-style cookie (readable by the app and sent to `/api/*` on the same site).
 * `user` is hydrated from login/register and refreshed by the `auth` middleware.
 */
export function useAuth() {
  const token = useCookie<string | null>(AUTH_TOKEN_COOKIE, {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
    secure: import.meta.env.PROD
  })
  const user = useState<MeData['user'] | null>('auth:user', () => null)

  function setSession(
    accessToken: string,
    u: MeData['user']
  ) {
    token.value = accessToken
    user.value = u
  }

  function clearSession() {
    token.value = null
    user.value = null
  }

  const isStaff = computed(() => {
    const r = user.value?.role
    return r === 'admin' || r === 'super_admin'
  })

  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')

  const isShopOwner = computed(() => user.value?.role === 'shop_owner')

  /** Web portal: shops UI (same as staff — only admin / super_admin use the website). */
  const canUseShops = isStaff

  /** @deprecated use isStaff — same (admin or super_admin) */
  const isAdmin = isStaff

  return {
    token,
    user,
    isStaff,
    isSuperAdmin,
    isShopOwner,
    canUseShops,
    isAdmin,
    setSession,
    clearSession
  }
}
