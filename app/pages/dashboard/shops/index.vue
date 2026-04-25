<template>
  <div class="space-y-8">
    <div
      class="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-emerald-950/30 p-6 sm:p-8"
    >
      <div
        class="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
      />
      <div
        class="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl"
      />
      <div class="relative">
        <div
          class="mb-1 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-emerald-300/90"
        >
          Vendors
        </div>
        <h1
          class="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl"
        >
          Shops
        </h1>
        <p
          class="mt-1.5 max-w-xl text-sm text-slate-400"
        >Link each store to a user, keep address and contact details current.</p>
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
              class="text-lg font-semibold text-emerald-300/90"
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

    <div
      class="flex flex-col gap-3 lg:flex-row lg:items-stretch"
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
          placeholder="Search name, address, phone, city…"
          class="w-full rounded-xl border border-slate-700/80 bg-slate-950/50 py-2.5 pl-10 pr-3 text-sm text-slate-100 shadow-inner ring-emerald-500/0 transition placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          @keydown.enter="load(1)"
        >
      </div>
      <div
        v-if="isStaff"
        class="shrink-0"
      >
        <label
          for="filter-owner"
          class="mb-1 block text-[10px] font-medium uppercase tracking-widest text-slate-500"
        >Filter by owner</label>
        <select
          id="filter-owner"
          v-model="filterUserId"
          class="h-[42px] w-full min-w-[12rem] rounded-xl border border-slate-700/80 bg-slate-950/50 px-3 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 lg:min-w-[16rem]"
          @change="load(1)"
        >
          <option
            value=""
          >All owners</option>
          <option
            v-for="u in userOptions"
            :key="u.id"
            :value="u.id"
          >{{ u.name }} — {{ u.email }}</option>
        </select>
      </div>
      <button
        type="button"
        class="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 self-end rounded-xl bg-emerald-600 px-5 text-sm font-medium text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
        @click="load(1)"
      >Search</button>
    </div>

    <section
      class="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/40"
    >
      <div
        :class="[
          'border-b border-slate-800/80 px-5 py-4 sm:px-6',
          editId
            ? 'bg-gradient-to-r from-amber-950/40 to-slate-900/40'
            : 'bg-gradient-to-r from-emerald-950/30 to-slate-900/40',
        ]"
      >
        <h2
          class="text-sm font-semibold text-white"
        >
          {{ editId ? 'Edit shop' : 'Add shop' }}
        </h2>
        <p
          class="mt-0.5 text-xs text-slate-500"
        >
          {{ isStaff
            ? (editId
              ? 'Reassign owner or change storefront details (staff can delete from the list)'
              : 'Required: owner user, shop name, address, phone')
            : (editId
                ? 'Update your shop profile'
                : 'Creates a shop for your account') }}
        </p>
      </div>
      <form
        class="space-y-4 p-5 sm:p-6"
        @submit.prevent="onFormSubmit"
      >
        <div
          v-if="isStaff"
          class="space-y-1.5"
        >
          <label
            for="s-user"
            class="text-xs font-medium text-slate-400"
          >Owner (user) <span
            v-if="!editId"
            class="text-rose-400/90"
          >*</span></label>
          <select
            id="s-user"
            v-model="form.userId"
            class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            :required="!editId"
          >
            <option
              disabled
              value=""
            >Select user</option>
            <option
              v-for="u in userOptions"
              :key="u.id"
              :value="u.id"
            >{{ u.name }} — {{ u.email }} ({{ u.role }})</option>
          </select>
        </div>

        <div
          class="grid gap-4 sm:grid-cols-2"
        >
          <div
            class="space-y-1.5 sm:col-span-2"
          >
            <label
              for="s-name"
              class="text-xs font-medium text-slate-400"
            >Shop name *</label>
            <input
              id="s-name"
              v-model="form.name"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            >
          </div>
          <div
            class="space-y-1.5 sm:col-span-2"
          >
            <label
              for="s-address"
              class="text-xs font-medium text-slate-400"
            >Address *</label>
            <textarea
              id="s-address"
              v-model="form.address"
              rows="2"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>
          <div
            class="space-y-1.5"
          >
            <label
              for="s-phone"
              class="text-xs font-medium text-slate-400"
            >Phone *</label>
            <input
              id="s-phone"
              v-model="form.phone"
              type="tel"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            >
          </div>
          <div
            class="space-y-1.5"
          >
            <label
              for="s-email"
              class="text-xs font-medium text-slate-400"
            >Contact email (optional)</label>
            <input
              id="s-email"
              v-model="form.email"
              type="email"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
          </div>
        </div>
        <div
          class="grid gap-4 sm:grid-cols-2"
        >
          <div
            class="space-y-1.5"
          >
            <label
              for="s-city"
              class="text-xs font-medium text-slate-400"
            >City</label>
            <input
              id="s-city"
              v-model="form.city"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
          </div>
          <div
            class="space-y-1.5"
          >
            <label
              for="s-country"
              class="text-xs font-medium text-slate-400"
            >Country</label>
            <input
              id="s-country"
              v-model="form.country"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
          </div>
        </div>
        <div
          class="space-y-1.5"
        >
          <label
            for="s-desc"
            class="text-xs font-medium text-slate-400"
          >Description</label>
          <textarea
            id="s-desc"
            v-model="form.description"
            rows="2"
            class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="Short public blurb, hours, etc."
          />
        </div>

        <div
          class="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-4"
        >
          <label
            class="inline-flex cursor-pointer select-none items-center gap-3"
          >
            <div
              class="relative inline-block h-7 w-12 shrink-0"
            >
              <input
                v-model="form.isActive"
                type="checkbox"
                class="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              >
              <div
                class="h-7 w-12 rounded-full border border-slate-600/80 bg-slate-800 transition peer-checked:border-emerald-500/50 peer-checked:bg-emerald-600/80"
              />
              <div
                class="pointer-events-none absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition peer-checked:translate-x-5"
              />
            </div>
            <span
              class="text-sm text-slate-300"
            >Active / visible</span>
          </label>
          <div
            class="flex flex-wrap gap-2"
          >
            <button
              v-if="editId"
              type="button"
              class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/50"
              @click="cancelEdit"
            >Cancel</button>
            <button
              type="submit"
              class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
              :disabled="pending"
            >{{ editId ? 'Save changes' : 'Create shop' }}</button>
          </div>
        </div>
      </form>
    </section>

    <div
      class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/30"
    >
      <div
        class="border-b border-slate-800/80 px-5 py-3 sm:px-6"
      >
        <h2
          class="text-sm font-semibold text-white"
        >Directory</h2>
        <p
          class="text-xs text-slate-500"
        >{{ isStaff
          ? 'All shops; filter by owner or use search. Staff can reassign or remove.'
          : 'Shops you own' }}</p>
      </div>
      <div
        v-if="loading"
        class="p-4 space-y-2"
      >
        <div
          v-for="n in 4"
          :key="n"
          class="h-12 animate-pulse rounded-lg bg-slate-800/50"
        />
      </div>
      <div
        v-else-if="!items.length"
        class="px-5 py-10 text-center text-sm text-slate-500"
      >No shops yet. Use the form above to add the first one.</div>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table
          class="min-w-full text-left text-sm"
        >
          <thead
            class="bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500"
          >
            <tr>
              <th
                class="px-4 py-3 pl-5 sm:pl-6"
              >Shop</th>
              <th
                v-if="isStaff"
                class="hidden px-4 py-3 sm:table-cell"
              >Owner</th>
              <th
                class="hidden min-w-[10rem] px-4 py-3 md:table-cell"
              >Address</th>
              <th
                class="px-4 py-3"
              >Phone</th>
              <th
                class="hidden px-4 py-3 sm:table-cell"
              >Status</th>
              <th
                class="hidden px-4 py-3 sm:table-cell"
              >Updated</th>
              <th
                class="w-[1%] py-3 pr-5 text-right sm:pr-6"
              />
            </tr>
          </thead>
          <tbody
            class="divide-y divide-slate-800/80"
          >
            <tr
              v-for="s in items"
              :key="s.id"
              class="group transition hover:bg-slate-800/20"
            >
              <td
                class="px-4 py-3 pl-5 sm:pl-6"
              >
                <div
                  class="font-medium text-slate-100"
                >{{ s.name }}</div>
                <div
                  v-if="s.description"
                  class="line-clamp-1 max-w-xs text-xs text-slate-500"
                >{{ s.description }}</div>
              </td>
              <td
                v-if="isStaff"
                class="hidden max-w-[14rem] px-4 py-3 text-slate-400 sm:table-cell"
              >
                <div
                  class="truncate"
                >{{ s.ownerName || '—' }}</div>
                <div
                  class="truncate text-xs text-slate-500"
                >{{ s.ownerEmail || '' }}</div>
              </td>
              <td
                class="hidden max-w-xs px-4 py-3 text-xs text-slate-400 md:table-cell"
              >{{ s.address }}</td>
              <td
                class="px-4 py-3 text-slate-300"
              >{{ s.phone }}</td>
              <td
                class="hidden px-4 py-3 sm:table-cell"
              >
                <span
                  v-if="s.isActive"
                  class="inline-flex items-center gap-1.5 text-xs text-emerald-300/90"
                ><span
                  class="h-1.5 w-1.5 rounded-full bg-emerald-400"
                />Active</span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 text-xs text-slate-500"
                ><span
                  class="h-1.5 w-1.5 rounded-full bg-slate-600"
                />Inactive</span>
              </td>
              <td
                class="hidden px-4 py-3 text-xs text-slate-500 sm:table-cell"
              >{{ shortDate(s.updatedAt) }}</td>
              <td
                class="px-2 py-3 pr-5 text-right sm:pr-6"
              >
                <div
                  class="inline-flex items-center justify-end gap-0.5 opacity-90 group-hover:opacity-100"
                >
                  <button
                    type="button"
                    class="rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-400/90 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                    @click="startEdit(s)"
                  >Edit</button>
                  <span
                    class="text-slate-700"
                  >|</span>
                  <button
                    type="button"
                    class="rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-400/90 transition hover:bg-rose-500/10"
                    :disabled="pending"
                    @click="onDelete(s.id)"
                  >Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!loading && items.length && pageCount > 1"
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
import type { ShopItem, UserItem } from '~/composables/useAdminApi'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'dashboard-access'] })

const adminApi = useAdminApi()
const { isStaff, user: me } = useAuth()
const items = ref<ShopItem[]>([])
const userOptions = ref<UserItem[]>([])
const loading = ref(true)
const pending = ref(false)
const loadError = ref('')
const page = ref(1)
const pageCount = ref(1)
const total = ref(0)
const limit = 10
const searchQ = ref('')
const filterUserId = ref('')

const editId = ref<string | null>(null)
const form = reactive({
  userId: '' as string,
  name: '',
  address: '',
  phone: '',
  email: '',
  description: '',
  city: '',
  country: '',
  isActive: true
})

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

function startEdit(s: ShopItem) {
  editId.value = s.id
  form.userId = s.userId
  form.name = s.name
  form.address = s.address
  form.phone = s.phone
  form.email = s.email || ''
  form.description = s.description || ''
  form.city = s.city || ''
  form.country = s.country || ''
  form.isActive = s.isActive
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetForm() {
  editId.value = null
  form.name = ''
  form.address = ''
  form.phone = ''
  form.email = ''
  form.description = ''
  form.city = ''
  form.country = ''
  form.isActive = true
  if (isStaff.value) {
    form.userId = userOptions.value[0]?.id || ''
  } else {
    form.userId = me.value?.id || ''
  }
}

function cancelEdit() {
  resetForm()
}

function parseError(e: unknown) {
  const d = (e as { data?: { ok?: boolean; error?: { message: string } } })?.data
  if (d?.ok === false && d.error) {
    return d.error.message
  }
  return (e as Error).message || 'Request failed'
}

async function loadUsers() {
  if (!isStaff.value) {
    return
  }
  try {
    const res = await adminApi.users.list({ page: 1, limit: 100, search: undefined })
    if (res.ok) {
      userOptions.value = res.data.items
      if (!editId.value && !form.userId && res.data.items.length) {
        form.userId = res.data.items[0]!.id
      }
    }
  } catch {
    userOptions.value = []
  }
}

async function load(p = 1) {
  page.value = p
  loading.value = true
  loadError.value = ''
  try {
    const res = await adminApi.shops.list({
      page: p,
      limit,
      search: searchQ.value || undefined,
      userId: isStaff.value && filterUserId.value
        ? filterUserId.value
        : undefined
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
    const res = isStaff.value
      ? await adminApi.shops.create({
          userId: form.userId,
          name: form.name,
          address: form.address,
          phone: form.phone,
          email: form.email || undefined,
          description: form.description || undefined,
          city: form.city || undefined,
          country: form.country || undefined,
          isActive: form.isActive
        })
      : await adminApi.shops.create({
          name: form.name,
          address: form.address,
          phone: form.phone,
          email: form.email || undefined,
          description: form.description || undefined,
          city: form.city || undefined,
          country: form.country || undefined,
          isActive: form.isActive
        })
    if (res.ok) {
      resetForm()
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
    const res = isStaff.value
      ? await adminApi.shops.update(editId.value, {
          userId: form.userId,
          name: form.name,
          address: form.address,
          phone: form.phone,
          email: form.email,
          description: form.description,
          city: form.city,
          country: form.country,
          isActive: form.isActive
        })
      : await adminApi.shops.update(editId.value, {
          name: form.name,
          address: form.address,
          phone: form.phone,
          email: form.email,
          description: form.description,
          city: form.city,
          country: form.country,
          isActive: form.isActive
        })
    if (res.ok) {
      resetForm()
      await load(page.value)
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    pending.value = false
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this shop permanently? This cannot be undone.')) {
    return
  }
  pending.value = true
  try {
    const res = await adminApi.shops.remove(id)
    if (res.ok) {
      if (editId.value === id) {
        resetForm()
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
  if (isStaff.value) {
    void loadUsers().then(() => load(1))
  } else {
    resetForm()
    void load(1)
  }
})
</script>
