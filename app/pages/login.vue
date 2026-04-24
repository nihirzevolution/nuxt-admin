<template>
  <form
    class="space-y-5"
    @submit.prevent="onSubmit"
  >
    <div>
      <label
        for="email"
        class="block text-sm font-medium text-slate-300"
      >Email</label>
      <input
        id="email"
        v-model="form.email"
        name="email"
        type="email"
        autocomplete="email"
        required
        class="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3.5 py-2.5 text-slate-100 shadow-sm transition placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        placeholder="you@example.com"
      >
    </div>
    <div>
      <div class="flex items-center justify-between">
        <label
          for="password"
          class="block text-sm font-medium text-slate-300"
        >Password</label>
        <a
          href="#"
          class="text-sm text-indigo-400 hover:text-indigo-300"
        >Forgot password?</a>
      </div>
      <input
        id="password"
        v-model="form.password"
        name="password"
        type="password"
        autocomplete="current-password"
        required
        class="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3.5 py-2.5 text-slate-100 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        placeholder="••••••••"
      >
    </div>
    <button
      type="submit"
      class="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white shadow shadow-indigo-500/30 transition hover:bg-indigo-400"
    >
      Sign in
    </button>
    <p class="text-center text-sm text-slate-400">
      Don’t have an account?
      <NuxtLink
        to="/register"
        class="font-medium text-indigo-400 hover:text-indigo-300"
      >Register</NuxtLink>
    </p>
  </form>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const form = reactive({
  email: '',
  password: ''
})

function onSubmit() {
  // Frontend only: wire up API when backend is ready
  console.info('login submit (stub)', { email: form.email })
}
</script>
