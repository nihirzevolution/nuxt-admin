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
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { user } = useAuth()
</script>
