import type { ApiResult } from '#shared/types/api'

type Paginated<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

export type RoleItem = {
  id: string
  name: string
  slug: string
  description: string
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type UserItem = {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ShopItem = {
  id: string
  userId: string
  ownerName?: string
  ownerEmail?: string
  name: string
  address: string
  phone: string
  email: string
  description: string
  city: string
  country: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const fetchOpts = { credentials: 'include' as const }

/**
 * Admin-only JSON APIs (cookie or Bearer; admin / super_admin).
 * Roles CRUD: super_admin only. `roleSlugs` is for user forms (admin + super_admin).
 */
export function useAdminApi() {
  return {
    roleSlugs: () =>
      $fetch<ApiResult<{ items: { slug: string; name: string }[] }>>(
        '/api/role-slugs',
        fetchOpts
      ),
    roles: {
      list: (q?: { page?: number; limit?: number; active?: boolean | number }) =>
        $fetch<ApiResult<Paginated<RoleItem>>>('/api/roles', {
          ...fetchOpts,
          query: {
            page: q?.page,
            limit: q?.limit,
            active: q?.active === true || q?.active === 1 ? 1 : undefined
          }
        }),
      get: (id: string) =>
        $fetch<ApiResult<RoleItem>>(`/api/roles/${id}`, fetchOpts),
      create: (body: { name: string; slug?: string; description?: string }) =>
        $fetch<ApiResult<RoleItem>>('/api/roles', {
          method: 'POST',
          body,
          ...fetchOpts
        }),
      update: (
        id: string,
        body: { name?: string; slug?: string; description?: string; isActive?: boolean }
      ) =>
        $fetch<ApiResult<RoleItem>>(`/api/roles/${id}`, {
          method: 'PUT',
          body,
          ...fetchOpts
        }),
      remove: (id: string) =>
        $fetch<ApiResult<{ deleted: boolean; id: string }>>(`/api/roles/${id}`, {
          method: 'DELETE',
          ...fetchOpts
        })
    },
    users: {
      list: (q?: { page?: number; limit?: number; search?: string }) =>
        $fetch<ApiResult<Paginated<UserItem>>>('/api/users', {
          ...fetchOpts,
          query: { page: q?.page, limit: q?.limit, search: q?.search }
        }),
      get: (id: string) =>
        $fetch<ApiResult<UserItem>>(`/api/users/${id}`, fetchOpts),
      create: (body: {
        name: string
        email: string
        password: string
        role: string
        isActive?: boolean
      }) =>
        $fetch<ApiResult<UserItem>>('/api/users', {
          method: 'POST',
          body,
          ...fetchOpts
        }),
      update: (
        id: string,
        body: {
          name?: string
          email?: string
          role?: string
          isActive?: boolean
          password?: string
        }
      ) =>
        $fetch<ApiResult<UserItem>>(`/api/users/${id}`, {
          method: 'PUT',
          body,
          ...fetchOpts
        }),
        remove: (id: string) =>
        $fetch<ApiResult<{ deleted: boolean; id: string }>>(
          `/api/users/${id}`,
          { method: 'DELETE', ...fetchOpts }
        )
    },
    shops: {
      list: (q?: { page?: number; limit?: number; search?: string; userId?: string }) =>
        $fetch<ApiResult<Paginated<ShopItem>>>('/api/shops', {
          ...fetchOpts,
          query: {
            page: q?.page,
            limit: q?.limit,
            search: q?.search,
            userId: q?.userId
          }
        }),
      get: (id: string) =>
        $fetch<ApiResult<ShopItem>>(`/api/shops/${id}`, fetchOpts),
      create: (body: {
        userId?: string
        name: string
        address: string
        phone: string
        email?: string
        description?: string
        city?: string
        country?: string
        isActive?: boolean
      }) =>
        $fetch<ApiResult<ShopItem>>('/api/shops', {
          method: 'POST',
          body,
          ...fetchOpts
        }),
      update: (
        id: string,
        body: {
          userId?: string
          name?: string
          address?: string
          phone?: string
          email?: string
          description?: string
          city?: string
          country?: string
          isActive?: boolean
        }
      ) =>
        $fetch<ApiResult<ShopItem>>(`/api/shops/${id}`, {
          method: 'PUT',
          body,
          ...fetchOpts
        }),
      remove: (id: string) =>
        $fetch<ApiResult<{ deleted: boolean; id: string }>>(
          `/api/shops/${id}`,
          { method: 'DELETE', ...fetchOpts }
        )
    }
  }
}
