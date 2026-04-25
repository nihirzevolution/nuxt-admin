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

export type CategoryItem = {
  id: string
  name: string
  slug: string
  shopId: string
  shopName?: string
  ownerName?: string
  ownerEmail?: string
  description: string
  createdAt: string
  updatedAt: string
}

export type ProductItem = {
  id: string
  shopId: string
  categoryId: string
  name: string
  productImage: string
  price: number
  shopName?: string
  categoryName?: string
  ownerName?: string
  ownerEmail?: string
  createdAt: string
  updatedAt: string
}

export type PurchaseItem = {
  id: string
  shopId: string
  userId: string
  productId: string
  quantity: number
  priceAtPurchase: number
  totalAmount: number
  purchaseDate: string
  notes: string
  shopName?: string
  productName?: string
  userName?: string
  userEmail?: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type ShopUserLinkItem = {
  id: string
  userId: string
  shopId: string
  status: 'pending' | 'active' | 'declined' | 'revoked'
  invitedByUserId: string
  shopName?: string
  userName?: string
  userEmail?: string
  inviterName?: string
  createdAt: string
  updatedAt: string
}

export type ShopUserInviteResult = {
  shopId: string
  invitedByUserId: string
  results: Array<{ userId: string; ok: boolean; id?: string; error?: string }>
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
    },
    categories: {
      list: (q?: { page?: number; limit?: number; search?: string; shopId?: string }) =>
        $fetch<ApiResult<Paginated<CategoryItem>>>('/api/categories', {
          ...fetchOpts,
          query: {
            page: q?.page,
            limit: q?.limit,
            search: q?.search,
            shopId: q?.shopId
          }
        }),
      get: (id: string) =>
        $fetch<ApiResult<CategoryItem>>(`/api/categories/${id}`, fetchOpts),
      create: (body: {
        name: string
        slug?: string
        shopId: string
        description?: string
      }) =>
        $fetch<ApiResult<CategoryItem>>('/api/categories', {
          method: 'POST',
          body,
          ...fetchOpts
        }),
      update: (
        id: string,
        body: {
          name?: string
          slug?: string
          shopId?: string
          description?: string
        }
      ) =>
        $fetch<ApiResult<CategoryItem>>(`/api/categories/${id}`, {
          method: 'PUT',
          body,
          ...fetchOpts
        }),
      remove: (id: string) =>
        $fetch<ApiResult<{ deleted: boolean; id: string }>>(
          `/api/categories/${id}`,
          { method: 'DELETE', ...fetchOpts }
        )
    },
    products: {
      list: (q?: {
        page?: number
        limit?: number
        search?: string
        shopId?: string
        categoryId?: string
      }) =>
        $fetch<ApiResult<Paginated<ProductItem>>>('/api/products', {
          ...fetchOpts,
          query: {
            page: q?.page,
            limit: q?.limit,
            search: q?.search,
            shopId: q?.shopId,
            categoryId: q?.categoryId
          }
        }),
      get: (id: string) =>
        $fetch<ApiResult<ProductItem>>(`/api/products/${id}`, fetchOpts),
      create: (body: {
        shopId: string
        categoryId: string
        name: string
        price: number
        productImage?: string
      }) =>
        $fetch<ApiResult<ProductItem>>('/api/products', {
          method: 'POST',
          body,
          ...fetchOpts
        }),
      update: (
        id: string,
        body: {
          shopId?: string
          categoryId?: string
          name?: string
          price?: number
          productImage?: string
        }
      ) =>
        $fetch<ApiResult<ProductItem>>(`/api/products/${id}`, {
          method: 'PUT',
          body,
          ...fetchOpts
        }),
      remove: (id: string) =>
        $fetch<ApiResult<{ deleted: boolean; id: string }>>(
          `/api/products/${id}`,
          { method: 'DELETE', ...fetchOpts }
        )
    },
    purchases: {
      list: (q?: {
        page?: number
        limit?: number
        search?: string
        shopId?: string
        userId?: string
        productId?: string
      }) =>
        $fetch<ApiResult<Paginated<PurchaseItem>>>('/api/purchases', {
          ...fetchOpts,
          query: {
            page: q?.page,
            limit: q?.limit,
            search: q?.search,
            shopId: q?.shopId,
            userId: q?.userId,
            productId: q?.productId
          }
        }),
      get: (id: string) =>
        $fetch<ApiResult<PurchaseItem>>(`/api/purchases/${id}`, fetchOpts),
      create: (body: {
        shopId: string
        /** App `user`: ignored (self). App `shop_owner`: customer id; omit = self. Staff: required. */
        userId?: string
        productId: string
        quantity: number
        priceAtPurchase: number
        totalAmount?: number
        purchaseDate?: string
        notes?: string
      }) =>
        $fetch<ApiResult<PurchaseItem>>('/api/purchases', {
          method: 'POST',
          body,
          ...fetchOpts
        }),
      update: (
        id: string,
        body: {
          shopId?: string
          userId?: string
          productId?: string
          quantity?: number
          priceAtPurchase?: number
          totalAmount?: number
          purchaseDate?: string
          notes?: string
        }
      ) =>
        $fetch<ApiResult<PurchaseItem>>(`/api/purchases/${id}`, {
          method: 'PUT',
          body,
          ...fetchOpts
        }),
      remove: (id: string) =>
        $fetch<ApiResult<{ deleted: boolean; id: string }>>(
          `/api/purchases/${id}`,
          { method: 'DELETE', ...fetchOpts }
        )
    },
    shopLinks: {
      list: (q?: {
        page?: number
        limit?: number
        shopId?: string
        userId?: string
        status?: string
      }) =>
        $fetch<ApiResult<Paginated<ShopUserLinkItem>>>('/api/shop-links', {
          ...fetchOpts,
          query: {
            page: q?.page,
            limit: q?.limit,
            shopId: q?.shopId,
            userId: q?.userId,
            status: q?.status
          }
        }),
      get: (id: string) =>
        $fetch<ApiResult<ShopUserLinkItem>>(`/api/shop-links/${id}`, fetchOpts),
      invite: (body: { shopId: string; userId: string } | { shopId: string; userIds: string[] }) =>
        $fetch<ApiResult<ShopUserInviteResult>>('/api/shop-links', {
          method: 'POST',
          body,
          ...fetchOpts
        }),
      respond: (id: string, action: 'accept' | 'decline') =>
        $fetch<ApiResult<ShopUserLinkItem>>(`/api/shop-links/${id}`, {
          method: 'PUT',
          body: { action },
          ...fetchOpts
        }),
      revoke: (id: string) =>
        $fetch<ApiResult<{ revoked: boolean; id: string; status?: string }>>(
          `/api/shop-links/${id}`,
          { method: 'DELETE', ...fetchOpts }
        )
    }
  }
}
