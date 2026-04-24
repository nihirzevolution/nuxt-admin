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
    <button
      type="submit"
      class="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white shadow shadow-indigo-500/30 transition hover:bg-indigo-400"
    >
      Create account
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
definePageMeta({ layout: 'auth' })

const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: ''
})

const passwordMismatch = computed(
  () =>
    form.password.length > 0
    && form.passwordConfirm.length > 0
    && form.password !== form.passwordConfirm
)

function onSubmit() {
  if (passwordMismatch.value) {
    return
  }
  // Frontend only: wire up API when backend is ready
  console.info('register submit (stub)', {
    name: form.name,
    email: form.email
  })
}
</script>
