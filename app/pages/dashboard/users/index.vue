<template>
  <div class="space-y-8">
    <!-- Page header -->
    <div
      class="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-indigo-950/30 p-6 sm:p-8"
    >
      <div
        class="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"
      />
      <div
        class="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl"
      />
      <div class="relative">
        <div
          class="mb-1 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-indigo-300/90"
        >
          Team
        </div>
        <h1
          class="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl"
        >
          User management
        </h1>
        <p
          class="mt-1.5 max-w-xl text-sm text-slate-400"
        >Search, invite, and maintain accounts. Only roles you are allowed to assign show in the form.</p>
        <div
          class="mt-4 flex flex-wrap gap-2"
        >
          <div
            class="rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2"
          >
            <div
              class="text-[10px] font-medium uppercase tracking-widest text-slate-500"
            >Total</div>
            <div
              class="text-lg font-semibold text-white"
            >{{ total }}</div>
          </div>
          <div
            class="rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2"
          >
            <div
              class="text-[10px] font-medium uppercase tracking-widest text-slate-500"
            >This page</div>
            <div
              class="text-lg font-semibold text-indigo-300/90"
            >{{ items.length }} <span
              class="text-sm font-normal text-slate-500"
            >/ {{ limit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p
      v-if="loadError"
      class="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300"
    >
      <span
        class="text-lg leading-none"
      >⚠</span>
      {{ loadError }}
    </p>

    <!-- Search -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-stretch"
    >
      <div
        class="relative min-w-0 flex-1"
      >
        <span
          class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          v-model="searchQ"
          type="search"
          placeholder="Search by name or email…"
          class="w-full rounded-xl border border-slate-700/80 bg-slate-950/50 py-2.5 pl-10 pr-3 text-sm text-slate-100 shadow-inner ring-indigo-500/0 transition placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          @keydown.enter="load(1)"
        >
      </div>
      <button
        type="button"
        class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500"
        @click="load(1)"
      >Search</button>
    </div>

    <!-- Form panel -->
    <section
      class="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/40"
    >
      <div
        :class="[
          'border-b border-slate-800/80 px-5 py-4 sm:px-6',
          editId
            ? 'bg-gradient-to-r from-amber-950/40 to-slate-900/40'
            : 'bg-gradient-to-r from-indigo-950/30 to-slate-900/40',
        ]"
      >
        <h2
          class="text-sm font-semibold text-white"
        >
          {{ editId ? 'Edit member' : 'Add new user' }}
        </h2>
        <p
          class="mt-0.5 text-xs text-slate-500"
        >
          {{ editId ? 'Update profile, role, or password' : 'Creates an account and assigns a role' }}
        </p>
      </div>
      <form
        class="space-y-4 p-5 sm:p-6"
        @submit.prevent="onFormSubmit"
      >
        <div
          class="grid gap-4 sm:grid-cols-2"
        >
          <div
            class="space-y-1.5"
          >
            <label
              for="u-name"
              class="text-xs font-medium text-slate-400"
            >Display name</label>
            <input
              id="u-name"
              v-model="form.name"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            >
          </div>
          <div
            class="space-y-1.5"
          >
            <label
              for="u-email"
              class="text-xs font-medium text-slate-400"
            >Email</label>
            <input
              id="u-email"
              v-model="form.email"
              type="email"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            >
          </div>
        </div>
        <div
          class="space-y-1.5"
        >
          <label
            for="u-pw"
            class="text-xs font-medium text-slate-400"
          >{{ editId ? 'New password (optional)' : 'Password' }}</label>
          <input
            id="u-pw"
            v-model="form.password"
            type="password"
            :required="!editId"
            :minlength="form.password ? 8 : 0"
            class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            :placeholder="editId ? 'Leave empty to keep current' : 'Minimum 8 characters'"
          >
        </div>
        <div
          v-if="roleOptions.length"
          class="grid gap-4 sm:grid-cols-2"
        >
          <div
            class="space-y-1.5"
          >
            <label
              for="u-role"
              class="text-xs font-medium text-slate-400"
            >Role</label>
            <div
              class="relative"
            >
              <select
                id="u-role"
                v-model="form.role"
                class="w-full appearance-none rounded-lg border border-slate-600/80 bg-slate-950/60 py-2 pl-3 pr-8 text-sm text-slate-100 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              >
                <option
                  v-for="o in roleOptions"
                  :key="o.slug"
                  :value="o.slug"
                >{{ o.name }} · {{ o.slug }}</option>
              </select>
              <span
                class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              >▾</span>
            </div>
          </div>
          <div
            class="flex flex-col justify-end"
          >
            <span
              class="mb-1.5 text-xs font-medium text-slate-400"
            >Status</span>
            <div
              class="flex h-[42px] items-center justify-between gap-3 rounded-lg border border-slate-600/80 bg-slate-950/60 px-3"
            >
              <span
                class="text-sm text-slate-300"
              >Account active</span>
              <div
                class="relative h-6 w-11 shrink-0"
              >
                <input
                  id="u-active"
                  v-model="form.isActive"
                  type="checkbox"
                  class="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                >
                <div
                  class="h-6 w-11 rounded-full bg-slate-600 transition peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/40"
                />
                <div
                  class="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"
                />
              </div>
            </div>
          </div>
        </div>
        <div
          class="flex flex-wrap items-center gap-3 border-t border-slate-800/60 pt-4"
        >
          <button
            type="submit"
            :disabled="pending"
            class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-5 py-2 text-sm font-medium text-white shadow shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="pending" class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {{ editId ? 'Save changes' : 'Create user' }}
          </button>
          <button
            v-if="editId"
            type="button"
            class="text-sm text-slate-500 transition hover:text-slate-200"
            @click="cancelEdit"
          >Cancel</button>
        </div>
      </form>
    </section>

    <!-- Table card -->
    <div
      class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/20"
    >
      <div
        class="flex items-center justify-between border-b border-slate-800/60 px-4 py-3 sm:px-5"
      >
        <h3
          class="text-sm font-semibold text-slate-200"
        >Directory</h3>
        <span
          class="text-xs text-slate-500"
        >Page {{ page }} of {{ pageCount }}</span>
      </div>

      <div
        v-if="loading"
        class="px-4 py-16 sm:px-5"
      >
        <div
          class="mx-auto max-w-sm space-y-3"
        >
          <div
            v-for="n in 4"
            :key="n"
            class="flex animate-pulse items-center gap-3 rounded-lg bg-slate-800/40 p-3"
          >
            <div
              class="h-10 w-10 rounded-full bg-slate-700/80"
            />
            <div
              class="min-w-0 flex-1 space-y-2"
            >
              <div
                class="h-3.5 w-1/2 rounded bg-slate-700/60"
              />
              <div
                class="h-3 w-2/3 rounded bg-slate-800/60"
              />
            </div>
          </div>
        </div>
        <p
          class="mt-6 text-center text-sm text-slate-500"
        >Loading users…</p>
      </div>

      <div
        v-else-if="!items.length"
        class="px-4 py-16 text-center sm:px-5"
      >
        <div
          class="mx-auto max-w-sm rounded-xl border border-dashed border-slate-700/80 bg-slate-900/30 p-8"
        >
          <p
            class="text-3xl"
          >👤</p>
          <p
            class="mt-3 text-sm font-medium text-slate-300"
          >No users here</p>
          <p
            class="mt-1 text-xs text-slate-500"
          >Try another search, or add someone with the form above.</p>
        </div>
      </div>

      <div
        v-else
        class="overflow-x-auto"
      >
        <table
          class="w-full min-w-[720px] text-left"
        >
          <thead>
            <tr
              class="text-[11px] font-semibold uppercase tracking-widest text-slate-500"
            >
              <th class="w-[38%] px-4 py-3 sm:px-5">Member</th>
              <th class="px-4 py-3 sm:px-5">Role</th>
              <th class="px-4 py-3 sm:px-5">Status</th>
              <th class="hidden w-[20%] px-4 py-3 text-slate-600 sm:table-cell sm:px-5">Updated</th>
              <th class="w-px px-4 py-3 text-right sm:px-5" />
            </tr>
          </thead>
          <tbody
            class="divide-y divide-slate-800/60"
          >
            <tr
              v-for="u in items"
              :key="u.id"
              class="group transition hover:bg-slate-800/25"
            >
              <td class="px-4 py-3 sm:px-5">
                <div
                  class="flex items-center gap-3"
                >
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-md"
                    :class="avatarGradientClass(u.id)"
                  >
                    {{ initials(u.name) }}
                  </div>
                  <div
                    class="min-w-0"
                  >
                    <div
                      class="truncate font-medium text-slate-100"
                    >{{ u.name }}</div>
                    <div
                      class="truncate text-xs text-slate-500"
                    >{{ u.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 sm:px-5">
                <span
                  :class="roleChipClass(u.role)"
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                >{{ roleLabel(u.role) }}</span>
              </td>
              <td class="px-4 py-3 sm:px-5">
                <span
                  v-if="u.isActive"
                  class="inline-flex items-center gap-1.5 text-xs text-emerald-400/90"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-500/50"
                  />Active</span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 text-xs text-slate-500"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full bg-slate-600"
                  />Inactive</span>
              </td>
              <td
                class="hidden px-4 py-3 text-xs text-slate-500 sm:table-cell sm:px-5"
              >{{ shortDate(u.updatedAt) }}</td>
              <td
                class="px-2 py-3 pr-4 text-right sm:px-5"
              >
                <div
                  class="inline-flex items-center justify-end gap-0.5 opacity-90 transition group-hover:opacity-100"
                >
                  <button
                    type="button"
                    class="rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10 hover:text-indigo-300"
                    @click="startEdit(u)"
                  >Edit</button>
                  <span
                    class="text-slate-700"
                  >|</span>
                  <button
                    type="button"
                    class="rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-400/90 transition hover:bg-rose-500/10"
                    :disabled="pending"
                    @click="onDelete(u.id)"
                  >Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="pageCount > 1"
        class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 bg-slate-900/20 px-4 py-3 sm:px-5"
      >
        <span
          class="text-xs text-slate-500"
        >Showing
          <span
            class="text-slate-300"
          >{{ (page - 1) * limit + 1 }}–{{
            Math.min(page * limit, total)
          }}</span>
          of
          <span
            class="text-slate-300"
          >{{ total }}</span>
        </span>
        <div
          class="flex items-center gap-1"
        >
          <button
            type="button"
            :disabled="page <= 1 || pending"
            class="rounded-lg border border-slate-600/60 px-2.5 py-1.5 text-xs text-slate-200 transition enabled:hover:border-slate-500 enabled:hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-30"
            @click="load(page - 1)"
          >← Prev</button>
          <span
            class="min-w-[3.5rem] text-center text-xs text-slate-500"
          >{{ page }} / {{ pageCount }}</span>
          <button
            type="button"
            :disabled="page >= pageCount || pending"
            class="rounded-lg border border-slate-600/60 px-2.5 py-1.5 text-xs text-slate-200 transition enabled:hover:border-slate-500 enabled:hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-30"
            @click="load(page + 1)"
          >Next →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserItem } from '~/composables/useAdminApi'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'staff'] })

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

function initials(name: string) {
  const p = (name || '?').trim().split(/\s+/).slice(0, 2)
  return p.map(s => s[0]).join('').toUpperCase() || '?'
}

const avatarPalette = [
  'from-fuchsia-600 to-purple-800',
  'from-cyan-600 to-blue-800',
  'from-amber-500 to-orange-700',
  'from-emerald-600 to-teal-800',
  'from-rose-500 to-pink-800',
  'from-indigo-500 to-slate-700',
]

function avatarGradientClass(id: string) {
  const n
    = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarPalette.length
  return `bg-gradient-to-br ${avatarPalette[n] ?? avatarPalette[0]}`
}

function roleChipClass(role: string) {
  switch (role) {
    case 'super_admin':
      return 'border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300/95'
    case 'admin':
      return 'border border-indigo-500/30 bg-indigo-500/10 text-indigo-300/95'
    case 'shop_owner':
      return 'border border-amber-500/30 bg-amber-500/10 text-amber-300/95'
    case 'user':
    default:
      return 'border border-slate-600/60 bg-slate-800/50 text-slate-300/95'
  }
}

function roleLabel(slug: string) {
  const f = roleOptions.value.find((r) => r.slug === slug)
  if (f) {
    return f.name
  }
  return slug.replace(/_/g, ' ')
}

function shortDate(d: string | Date | undefined) {
  if (!d) {
    return '—'
  }
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(x)
}

function startEdit(u: UserItem) {
  editId.value = u.id
  form.name = u.name
  form.email = u.email
  form.password = ''
  form.role = u.role
  form.isActive = u.isActive
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
    const res = await adminApi.roleSlugs()
    if (res.ok) {
      roleOptions.value = res.data.items
      if (!editId.value && !form.role) {
        form.role = roleOptions.value.find((x) => x.slug === 'user')?.slug
          || roleOptions.value[0]?.slug
          || 'user'
      }
    }
  } catch {
    // ignore
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
  if (!confirm('Remove this user permanently? This cannot be undone.')) {
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
