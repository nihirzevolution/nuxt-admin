/**
 * Web dashboard: `admin` and `super_admin` only (end users and shop owners use the app).
 * `Users` and `Roles` add `staff` / `super-admin` on top of this.
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()
  if (!user.value) {
    return
  }
  const r = user.value.role
  if (r === 'admin' || r === 'super_admin') {
    return
  }
  return navigateTo('/')
})
