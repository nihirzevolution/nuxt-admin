<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)] px-4 py-12"
  >
    <div class="w-full max-w-md">
      <NuxtLink
        to="/"
        class="mb-8 flex justify-center text-sm font-medium text-slate-400 transition hover:text-indigo-300"
      >
        ← Back to home
      </NuxtLink>

      <div
        class="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-8 shadow-xl shadow-indigo-950/40 backdrop-blur-sm"
      >
        <div class="mb-8 text-center">
          <h1
            class="text-2xl font-semibold tracking-tight text-white"
          >
            {{ title }}
          </h1>
          <p
            v-if="subtitle"
            class="mt-1 text-sm text-slate-400"
          >
            {{ subtitle }}
          </p>
        </div>
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const meta: Record<string, { title: string; subtitle: string }> = {
  '/login': { title: 'Sign in', subtitle: 'Enter your account details' },
  '/register': { title: 'Create an account', subtitle: 'Get started in a few steps' }
}

const title = computed(
  () => meta[route.path]?.title ?? 'Account'
)
const subtitle = computed(
  () => meta[route.path]?.subtitle ?? ''
)
</script>
