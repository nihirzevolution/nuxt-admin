<template>
  <div
    class="min-h-screen bg-slate-950 text-slate-100 flex"
  >
    <aside
      class="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/90"
    >
      <div class="border-b border-slate-800 p-4">
        <NuxtLink
          to="/dashboard"
          class="text-sm font-semibold tracking-tight text-white"
        >
          Native Admin
        </NuxtLink>
      </div>
      <nav class="flex flex-1 flex-col gap-0.5 p-2">
        <NuxtLink
          to="/dashboard"
          class="rounded-lg px-3 py-2.5 text-sm font-medium transition"
          :class="isDashHome ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'"
        >
          Overview
        </NuxtLink>
        <NuxtLink
          v-if="canUseShops"
          to="/dashboard/shops"
          class="rounded-lg px-3 py-2.5 text-sm font-medium transition"
          :class="path.startsWith('/dashboard/shops') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'"
        >
          Shops
        </NuxtLink>
        <NuxtLink
          v-if="isStaff"
          to="/dashboard/categories"
          class="rounded-lg px-3 py-2.5 text-sm font-medium transition"
          :class="path.startsWith('/dashboard/categories') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'"
        >
          Categories
        </NuxtLink>
        <NuxtLink
          v-if="isStaff"
          to="/dashboard/products"
          class="rounded-lg px-3 py-2.5 text-sm font-medium transition"
          :class="path.startsWith('/dashboard/products') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'"
        >
          Products
        </NuxtLink>
        <NuxtLink
          v-if="isStaff"
          to="/dashboard/purchases"
          class="rounded-lg px-3 py-2.5 text-sm font-medium transition"
          :class="path.startsWith('/dashboard/purchases') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'"
        >
          Purchases
        </NuxtLink>
        <NuxtLink
          v-if="isStaff"
          to="/dashboard/shop-links"
          class="rounded-lg px-3 py-2.5 text-sm font-medium transition"
          :class="path.startsWith('/dashboard/shop-links') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'"
        >
          Shop links
        </NuxtLink>
        <NuxtLink
          v-if="isSuperAdmin"
          to="/dashboard/roles"
          class="rounded-lg px-3 py-2.5 text-sm font-medium transition"
          :class="path.startsWith('/dashboard/roles') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'"
        >
          Roles
        </NuxtLink>
        <NuxtLink
          v-if="isStaff"
          to="/dashboard/users"
          class="rounded-lg px-3 py-2.5 text-sm font-medium transition"
          :class="path.startsWith('/dashboard/users') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'"
        >
          Users
        </NuxtLink>
      </nav>
      <div
        class="border-t border-slate-800/80 p-3 text-xs text-slate-500"
      >
        <NuxtLink
          to="/"
          class="text-indigo-400/90 transition hover:text-indigo-300"
        >Back to site</NuxtLink>
      </div>
    </aside>

    <div
      class="flex min-w-0 flex-1 flex-col"
    >
      <header
        class="shrink-0 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur"
      >
        <div
          class="flex items-center justify-between gap-4 px-6 py-3"
        >
          <div class="text-sm text-slate-500" />
          <div class="flex items-center gap-3 text-sm text-slate-300">
            <span
              v-if="user"
              class="text-slate-500"
            >{{ user.name }}</span>
            <span
              v-if="user"
              class="rounded-md bg-slate-800/80 px-2 py-0.5 text-xs text-slate-400"
            >{{ user.role }}</span>
            <button
              type="button"
              class="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500"
              @click="onLogout"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main
        class="flex-1 p-6"
      >
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, clearSession, isStaff, isSuperAdmin, canUseShops } = useAuth()
const route = useRoute()
const path = computed(() => route.path)
const isDashHome = computed(
  () => path.value === '/dashboard' || path.value === '/dashboard/'
)

function onLogout() {
  clearSession()
  return navigateTo('/login')
}
</script>
