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
      v-if="isStaff"
      class="mt-4 text-slate-500"
    >Use the sidebar: <strong
      class="font-medium text-slate-400"
    >Shops</strong> to manage store records (web is staff-only; store owners use the app + <code
        class="text-indigo-400/90"
    >/api/shops</code> with the app). <strong
      class="font-medium text-slate-400"
    >Users</strong> is for <code
      class="text-indigo-400/90"
    >admin</code> and
      <code
        class="text-indigo-400/90"
    >super_admin</code>.
      <strong
        class="font-medium text-slate-400"
    >Roles</strong> (API
      <code
        class="text-indigo-400/90"
    >/api/roles</code>) is <strong
        class="text-amber-500/90"
    >super_admin</strong> only. Users API:
      <code
        class="text-indigo-400/90"
    >/api/users</code>, shops: <code
        class="text-indigo-400/90"
    >/api/shops</code>.
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'dashboard-access']
})

const { user, isStaff } = useAuth()
</script>
