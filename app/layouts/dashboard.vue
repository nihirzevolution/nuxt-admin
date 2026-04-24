<template>
  <div
    class="min-h-screen bg-slate-950 text-slate-100 flex flex-col"
  >
    <header
      class="shrink-0 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur"
    >
      <div
        class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3"
      >
        <NuxtLink
          to="/dashboard"
          class="text-sm font-semibold tracking-tight text-white"
        >
          Native Admin
        </NuxtLink>
        <nav class="flex items-center gap-3 text-sm text-slate-300">
          <NuxtLink
            to="/"
            class="transition hover:text-indigo-300"
          >Home</NuxtLink>
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
        </nav>
      </div>
    </header>
    <main
      class="mx-auto w-full max-w-5xl flex-1 px-4 py-8"
    >
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, clearSession } = useAuth()

function onLogout() {
  clearSession()
  return navigateTo('/login')
}
</script>
