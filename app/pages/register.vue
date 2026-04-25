<template>
  <div
    v-if="!success"
  >
    <div
      class="mb-5 rounded-lg border border-amber-500/25 bg-amber-950/30 px-3.5 py-3 text-sm text-amber-100/90"
    >
      <p class="font-medium text-amber-200/95">App registration</p>
      <p class="mt-1 text-xs leading-relaxed text-amber-200/70">
        This page creates your account in our system. The customer portal is the mobile app — you will not get access to this admin website.
      </p>
    </div>
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
  </div>

  <div
    v-else
    class="space-y-5 text-center"
  >
    <p class="text-base text-emerald-400/90">
      {{ successMessage }}
    </p>
    <p
      v-if="assignedRole"
      class="text-sm text-slate-400"
    >Your account role: <span
        class="font-mono text-slate-200"
      >{{ assignedRole }}</span></p>
    <a
      :href="downloadUrl"
      class="block text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
    >Click here to download the application &rarr;</a>
    <p
      class="text-xs text-slate-500"
    >(This link is a placeholder; set
      <code
        class="text-slate-400"
      >NUXT_PUBLIC_APP_DOWNLOAD_URL</code> in
      <code
        class="text-slate-400"
      >.env</code> for your app package URL.)
    </p>
    <NuxtLink
      to="/"
      class="inline-flex justify-center rounded-lg border border-slate-600 bg-slate-800/50 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500"
    >Go to home</NuxtLink>
  </div>
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
const success = ref(false)
const successMessage = ref('')
const downloadUrl = ref('#')
const assignedRole = ref('')

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
      if (res.data.token) {
        setSession(res.data.token, res.data.user)
      }
      successMessage.value = res.data.message
        || 'Thank you! Use the app to sign in.'
      downloadUrl.value = res.data.downloadUrl || '#'
      assignedRole.value = res.data.user.role
      success.value = true
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
