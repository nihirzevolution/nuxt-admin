/**
 * Back office: only `admin` and `super_admin` (not `user` or `shop_owner`).
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()
  if (!user.value) {
    return
  }
  if (user.value.role === 'admin' || user.value.role === 'super_admin') {
    return
  }
  return navigateTo('/')
})
