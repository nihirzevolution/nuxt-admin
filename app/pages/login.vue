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
    <p
      v-if="formError"
      class="text-sm text-red-400"
    >
      {{ formError }}
    </p>
    <button
      type="submit"
      :disabled="pending"
      class="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white shadow shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {{ pending ? 'Signing in…' : 'Sign in' }}
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
definePageMeta({ layout: 'auth', middleware: 'guest' })

const api = useApi()
const { setSession } = useAuth()
const route = useRoute()
const form = reactive({
  email: '',
  password: ''
})
const pending = ref(false)
const formError = ref('')

function afterLoginPath(role: string) {
  const isStaff = role === 'admin' || role === 'super_admin'
  if (!isStaff) {
    return '/'
  }
  const r = route.query.redirect
  if (typeof r === 'string' && r.startsWith('/') && !r.startsWith('//')) {
    return r
  }
  return '/dashboard'
}

async function onSubmit() {
  formError.value = ''
  pending.value = true
  try {
    const res = await api.login({
      email: form.email,
      password: form.password
    })
    if (res.ok) {
      setSession(res.data.token, res.data.user)
      await navigateTo(afterLoginPath(res.data.user.role))
    }
  } catch (e: unknown) {
    const data = (e as { data?: { ok?: boolean; error?: { message: string } } })
      .data
    if (data && 'ok' in data && data.ok === false && data.error) {
      formError.value = data.error.message
    } else {
      formError.value = 'Something went wrong. Try again.'
    }
  } finally {
    pending.value = false
  }
}
</script>
