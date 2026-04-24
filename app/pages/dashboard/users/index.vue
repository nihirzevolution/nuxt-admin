<template>
  <div>
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1
        class="text-2xl font-semibold tracking-tight text-white"
      >
        Users
      </h1>
    </div>

    <p
      v-if="loadError"
      class="mb-4 text-sm text-red-400"
    >{{ loadError }}</p>

    <div
      class="mb-4 flex flex-wrap gap-2"
    >
      <input
        v-model="searchQ"
        type="search"
        placeholder="Search name or email"
        class="min-w-[200px] flex-1 rounded-md border border-slate-600 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100"
        @keydown.enter="load(1)"
      >
      <button
        type="button"
        class="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/60"
        @click="load(1)"
      >Search</button>
    </div>

    <section
      class="mb-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4"
    >
      <h2
        class="text-sm font-medium text-slate-300"
      >
        {{ editId ? 'Edit user' : 'Create user' }}
      </h2>
      <form
        class="mt-3 flex flex-col gap-3"
        @submit.prevent="onFormSubmit"
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              class="text-xs text-slate-500"
            >Name</label>
            <input
              v-model="form.name"
              class="mt-0.5 w-full rounded-md border border-slate-600 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100"
              required
            >
          </div>
          <div>
            <label
              class="text-xs text-slate-500"
            >Email</label>
            <input
              v-model="form.email"
              type="email"
              class="mt-0.5 w-full rounded-md border border-slate-600 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100"
              required
            >
          </div>
        </div>
        <div>
          <label
            class="text-xs text-slate-500"
          >{{ editId ? 'New password (optional)' : 'Password' }}</label>
          <input
            v-model="form.password"
            type="password"
            :required="!editId"
            :minlength="form.password ? 8 : 0"
            class="mt-0.5 w-full rounded-md border border-slate-600 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100"
            :placeholder="editId ? 'Leave empty to keep current' : 'Min. 8 characters'"
          >
        </div>
        <div
          v-if="roleOptions.length"
          class="grid gap-3 sm:grid-cols-2"
        >
          <div>
            <label
              class="text-xs text-slate-500"
            >Role (slug)</label>
            <select
              v-model="form.role"
              class="mt-0.5 w-full rounded-md border border-slate-600 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100"
              required
            >
              <option
                v-for="o in roleOptions"
                :key="o.slug"
                :value="o.slug"
              >{{ o.name }} ({{ o.slug }})</option>
            </select>
          </div>
          <div class="flex items-end">
            <label
              class="mb-0.5 flex items-center gap-2 text-sm text-slate-300"
            >
              <input
                v-model="form.isActive"
                type="checkbox"
                class="rounded border-slate-600"
              >Active</label>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="submit"
            :disabled="pending"
            class="rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
          >{{ editId ? 'Update' : 'Create' }}</button>
          <button
            v-if="editId"
            type="button"
            class="text-sm text-slate-500 hover:text-slate-300"
            @click="cancelEdit"
          >Cancel</button>
        </div>
      </form>
    </section>

    <div
      v-if="loading"
      class="text-slate-500"
    >Loading…</div>

    <div
      v-else
      class="overflow-x-auto rounded-xl border border-slate-800"
    >
      <table class="w-full min-w-[640px] text-left text-sm text-slate-300">
        <thead class="border-b border-slate-800 bg-slate-900/60 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-3 py-2.5">Name</th>
            <th class="px-3 py-2.5">Email</th>
            <th class="px-3 py-2.5">Role</th>
            <th class="px-3 py-2.5">Active</th>
            <th class="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in items"
            :key="u.id"
            class="border-b border-slate-800/50 odd:bg-slate-900/20"
          >
            <td class="px-3 py-2.5 text-slate-200">{{ u.name }}</td>
            <td class="px-3 py-2.5 text-slate-400">{{ u.email }}</td>
            <td
              class="px-3 py-2.5 font-mono text-xs"
            >{{ u.role }}</td>
            <td class="px-3 py-2.5">{{ u.isActive ? 'Yes' : 'No' }}</td>
            <td
              class="px-3 py-2.5 text-right"
            >
              <button
                type="button"
                class="mr-2 text-indigo-400 hover:underline"
                @click="startEdit(u)"
              >Edit</button>
              <button
                type="button"
                class="text-red-400/90 hover:underline"
                :disabled="pending"
                @click="onDelete(u.id)"
              >Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="pageCount > 1"
      class="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400"
    >
      <button
        type="button"
        :disabled="page <= 1"
        class="rounded border border-slate-600 px-2 py-0.5 disabled:opacity-40"
        @click="load(page - 1)"
      >Prev</button>
      <span>Page {{ page }} / {{ pageCount }}</span>
      <button
        type="button"
        :disabled="page >= pageCount"
        class="rounded border border-slate-600 px-2 py-0.5 disabled:opacity-40"
        @click="load(page + 1)"
      >Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserItem } from '~/composables/useAdminApi'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] })

const adminApi = useAdminApi()
const items = ref<UserItem[]>([])
const roleOptions = ref<{ slug: string; name: string }[]>([])
const loading = ref(true)
const pending = ref(false)
const loadError = ref('')
const page = ref(1)
const pageCount = ref(1)
const total = ref(0)
const limit = 10
const searchQ = ref('')

const editId = ref<string | null>(null)
const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'user',
  isActive: true
})

function startEdit(u: UserItem) {
  editId.value = u.id
  form.name = u.name
  form.email = u.email
  form.password = ''
  form.role = u.role
  form.isActive = u.isActive
}

function cancelEdit() {
  editId.value = null
  form.name = ''
  form.email = ''
  form.password = ''
  form.role = roleOptions.value[0]?.slug || 'user'
  form.isActive = true
}

function parseError(e: unknown) {
  const d = (e as { data?: { ok?: boolean; error?: { message: string } } })?.data
  if (d?.ok === false && d.error) {
    return d.error.message
  }
  return (e as Error).message || 'Request failed'
}

async function loadRoles() {
  try {
    const res = await adminApi.roles.list({ page: 1, limit: 200 })
    if (res.ok) {
      roleOptions.value = res.data.items.map((r) => ({
        slug: r.slug,
        name: r.name
      }))
      if (!editId.value && !form.role) {
        form.role = roleOptions.value.find((x) => x.slug === 'user')?.slug
          || roleOptions.value[0]?.slug
          || 'user'
      }
    }
  } catch {
    // ignore: legacy slugs still work
  }
}

async function load(p = 1) {
  page.value = p
  loading.value = true
  loadError.value = ''
  try {
    const res = await adminApi.users.list({
      page: p,
      limit,
      search: searchQ.value || undefined
    })
    if (res.ok) {
      items.value = res.data.items
      total.value = res.data.total
      pageCount.value = Math.max(1, Math.ceil(res.data.total / res.data.limit))
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    loading.value = false
  }
}

async function onFormSubmit() {
  if (editId.value) {
    await onUpdate()
  } else {
    await onCreate()
  }
}

async function onCreate() {
  pending.value = true
  try {
    const res = await adminApi.users.create({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      isActive: form.isActive
    })
    if (res.ok) {
      cancelEdit()
      await load(1)
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    pending.value = false
  }
}

async function onUpdate() {
  if (!editId.value) {
    return
  }
  pending.value = true
  try {
    const res = await adminApi.users.update(editId.value, {
      name: form.name,
      email: form.email,
      role: form.role,
      isActive: form.isActive,
      password: form.password || undefined
    })
    if (res.ok) {
      cancelEdit()
      await load(page.value)
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    pending.value = false
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this user? This cannot be undone.')) {
    return
  }
  pending.value = true
  try {
    const res = await adminApi.users.remove(id)
    if (res.ok) {
      if (editId.value === id) {
        cancelEdit()
      }
      await load(page.value)
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  void loadRoles().then(() => load(1))
})
</script>
