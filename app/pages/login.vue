<template>
  <div class="space-y-5">
    <div
      class="rounded-lg border border-amber-500/25 bg-amber-950/30 px-3.5 py-3 text-sm text-amber-100/90"
    >
      <p class="font-medium text-amber-200/95">Administrator sign-in</p>
      <p class="mt-1 text-xs leading-relaxed text-amber-200/70">
        This website is only for
        <span class="text-amber-100/90">admin</span> and
        <span class="text-amber-100/90">super_admin</span>. Customer and store accounts use the mobile app — not this site.
      </p>
    </div>

    <div
      v-if="appOnlyMessage"
      class="space-y-3 rounded-lg border border-slate-600/60 bg-slate-800/40 px-3.5 py-4"
    >
      <p class="text-sm text-slate-200">
        {{ appOnlyMessage }}
      </p>
      <a
        v-if="appDownloadUrl && appDownloadUrl !== '#'"
        :href="appDownloadUrl"
        class="inline-flex text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
      >Download the app →</a>
      <p
        v-else
        class="text-xs text-slate-500"
      >Set <code class="text-slate-400">NUXT_PUBLIC_APP_DOWNLOAD_URL</code> in <code class="text-slate-400">.env</code> for your app store link.</p>
    </div>

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
        End users: use the app to register and sign in.
        <NuxtLink
          to="/register"
          class="mt-1 block font-medium text-indigo-400 hover:text-indigo-300"
        >App registration (no web access)</NuxtLink>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const config = useRuntimeConfig()
const api = useApi()
const { setSession } = useAuth()
const route = useRoute()
const form = reactive({
  email: '',
  password: ''
})
const pending = ref(false)
const formError = ref('')
const appOnlyMessage = ref('')
const appDownloadUrl = ref(String(config.public.appDownloadUrl || '#'))

function afterLoginPath(_role: string) {
  const r = route.query.redirect
  if (typeof r === 'string' && r.startsWith('/') && !r.startsWith('//')) {
    return r
  }
  return '/dashboard'
}

async function onSubmit() {
  formError.value = ''
  appOnlyMessage.value = ''
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
    const data = (e as { data?: { ok?: boolean; error?: { code: string; message: string; details?: { downloadUrl?: string } } } })
      .data
    if (data?.ok === false && data.error?.code === 'WEB_STAFF_ONLY') {
      appOnlyMessage.value = data.error.message
      const u = data.error.details as { downloadUrl?: string } | undefined
      appDownloadUrl.value = u?.downloadUrl
        || String(config.public.appDownloadUrl || '#')
      return
    }
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
