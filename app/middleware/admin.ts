/**
 * Only `admin` and `super_admin` may open management screens (assumes `auth` runs first on the same route).
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()
  if (!user.value) {
    return
  }
  if (user.value.role === 'admin' || user.value.role === 'super_admin') {
    return
  }
  return navigateTo('/dashboard')
})
