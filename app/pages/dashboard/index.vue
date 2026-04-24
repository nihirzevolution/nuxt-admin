<template>
  <div>
    <h1
      class="text-2xl font-semibold tracking-tight text-white"
    >
      Dashboard
    </h1>
    <p
      v-if="user"
      class="mt-2 text-slate-400"
    >
      You are signed in as
      <span class="text-slate-200">{{ user.email }}</span
      >.
    </p>
    <p
      v-if="isAdmin"
      class="mt-4 text-slate-500"
    >Use the sidebar to open <strong
      class="font-medium text-slate-400"
    >Roles</strong> and <strong
      class="font-medium text-slate-400"
    >Users</strong> — each module is backed by its own REST API under
      <code
        class="text-indigo-400/90"
      >/api/roles</code> and
      <code
        class="text-indigo-400/90"
      >/api/users</code>
      for Postman and integration tests.
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { user, isAdmin } = useAuth()
</script>
