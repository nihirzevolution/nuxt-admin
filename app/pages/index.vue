<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(99,102,241,0.2),transparent)] px-4"
  >
    <div class="text-center max-w-lg">
      <h1
        class="text-3xl sm:text-4xl font-bold tracking-tight text-white"
      >
        Native Admin
      </h1>
      <p class="mt-3 text-slate-400 text-lg">
        A fresh Nuxt app. Sign in or create an account to continue.
      </p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <NuxtLink
          v-if="isStaff"
          to="/dashboard"
          class="inline-flex items-center justify-center rounded-lg border border-indigo-500/50 bg-indigo-500/20 px-5 py-2.5 text-sm font-medium text-indigo-200 transition hover:border-indigo-400 hover:bg-indigo-500/30"
        >
          Back office
        </NuxtLink>
        <NuxtLink
          to="/login"
          class="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white shadow shadow-indigo-500/30 transition hover:bg-indigo-400"
        >
          Log in
        </NuxtLink>
        <NuxtLink
          to="/register"
          class="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-900/60 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/80"
        >
          Register
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isStaff } = useAuth()
</script>
