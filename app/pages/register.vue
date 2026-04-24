<template>
  <form
    class="space-y-5"
    @submit.prevent="onSubmit"
  >
    <div>
      <label
        for="name"
        class="block text-sm font-medium text-slate-300"
      >Full name</label>
      <input
        id="name"
        v-model="form.name"
        name="name"
        type="text"
        autocomplete="name"
        required
        class="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3.5 py-2.5 text-slate-100 shadow-sm transition placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        placeholder="Jane Doe"
      >
    </div>
    <div>
      <label
        for="reg-email"
        class="block text-sm font-medium text-slate-300"
      >Email</label>
      <input
        id="reg-email"
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
      <label
        for="reg-password"
        class="block text-sm font-medium text-slate-300"
      >Password</label>
      <input
        id="reg-password"
        v-model="form.password"
        name="password"
        type="password"
        autocomplete="new-password"
        required
        minlength="8"
        class="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3.5 py-2.5 text-slate-100 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        placeholder="At least 8 characters"
      >
    </div>
    <div>
      <label
        for="password-confirm"
        class="block text-sm font-medium text-slate-300"
      >Confirm password</label>
      <input
        id="password-confirm"
        v-model="form.passwordConfirm"
        name="passwordConfirm"
        type="password"
        autocomplete="new-password"
        required
        class="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3.5 py-2.5 text-slate-100 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        placeholder="Repeat password"
      >
    </div>
    <p
      v-if="passwordMismatch"
      class="text-sm text-amber-400/90"
    >
      Passwords do not match.
    </p>
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
      {{ pending ? 'Creating account…' : 'Create account' }}
    </button>
    <p class="text-center text-sm text-slate-400">
      Already have an account?
      <NuxtLink
        to="/login"
        class="font-medium text-indigo-400 hover:text-indigo-300"
      >Log in</NuxtLink>
    </p>
  </form>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const api = useApi()
const { setSession } = useAuth()
const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: ''
})
const pending = ref(false)
const formError = ref('')

const passwordMismatch = computed(
  () =>
    form.password.length > 0
    && form.passwordConfirm.length > 0
    && form.password !== form.passwordConfirm
)

async function onSubmit() {
  formError.value = ''
  if (passwordMismatch.value) {
    return
  }
  pending.value = true
  try {
    const res = await api.register({
      name: form.name,
      email: form.email,
      password: form.password
    })
    if (res.ok) {
      setSession(res.data.token, res.data.user)
      await navigateTo('/dashboard')
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
