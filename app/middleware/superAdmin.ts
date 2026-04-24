/**
 * Roles module: `super_admin` only (admin cannot access).
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()
  if (!user.value) {
    return
  }
  if (user.value.role === 'super_admin') {
    return
  }
  return navigateTo('/dashboard')
})
