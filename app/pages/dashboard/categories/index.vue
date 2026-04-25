<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-6">
      <h1 class="text-2xl font-semibold tracking-tight text-white">
        Category master
      </h1>
      <p class="mt-1 text-sm text-slate-400">
        API-based CRUD for category records (`name`, `slug`, `shopId`, `description`).
      </p>
    </div>

    <p
      v-if="loadError"
      class="rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-300"
    >
      {{ loadError }}
    </p>

    <div class="flex flex-col gap-3 lg:flex-row">
      <div class="flex-1">
        <input
          v-model="searchQ"
          type="search"
          placeholder="Search by name, slug, description"
          class="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          @keydown.enter="load(1)"
        >
      </div>
      <div class="lg:w-72">
        <select
          v-model="filterShopId"
          class="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          @change="load(1)"
        >
          <option value="">
            All shops
          </option>
          <option
            v-for="s in shopOptions"
            :key="s.id"
            :value="s.id"
          >
            {{ s.name }} {{ s.ownerName ? `— ${s.ownerName}` : '' }}
          </option>
        </select>
      </div>
      <button
        type="button"
        class="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        @click="load(1)"
      >
        Search
      </button>
    </div>

    <section class="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/40">
      <div class="border-b border-slate-800/80 bg-slate-900/60 px-5 py-4 sm:px-6">
        <h2 class="text-sm font-semibold text-white">
          {{ editId ? 'Edit category' : 'Add category' }}
        </h2>
      </div>
      <form
        class="space-y-4 p-5 sm:p-6"
        @submit.prevent="onSubmit"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-slate-400">Name *</label>
            <input
              v-model="form.name"
              required
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-slate-400">Slug</label>
            <input
              v-model="form.slug"
              placeholder="auto from name if empty"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium text-slate-400">Shop *</label>
          <select
            v-model="form.shopId"
            required
            class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option
              disabled
              value=""
            >
              Select shop
            </option>
            <option
              v-for="s in shopOptions"
              :key="s.id"
              :value="s.id"
            >
              {{ s.name }} {{ s.ownerName ? `— ${s.ownerName}` : '' }}
            </option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium text-slate-400">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div class="flex justify-end gap-2 border-t border-slate-800/60 pt-4">
          <button
            v-if="editId"
            type="button"
            class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500"
            @click="resetForm"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="pending"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {{ editId ? 'Update category' : 'Create category' }}
          </button>
        </div>
      </form>
    </section>

    <div class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/30">
      <div class="border-b border-slate-800/80 px-5 py-3 sm:px-6">
        <h2 class="text-sm font-semibold text-white">
          Categories
        </h2>
      </div>
      <div
        v-if="loading"
        class="space-y-2 p-4"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="h-12 animate-pulse rounded bg-slate-800/60"
        />
      </div>
      <div
        v-else-if="!items.length"
        class="px-5 py-8 text-sm text-slate-500"
      >
        No categories found.
      </div>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3 sm:px-5">
                Name
              </th>
              <th class="px-4 py-3">
                Slug
              </th>
              <th class="hidden px-4 py-3 md:table-cell">
                Shop
              </th>
              <th class="hidden px-4 py-3 lg:table-cell">
                Description
              </th>
              <th class="px-4 py-3 text-right sm:px-5">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/70">
            <tr
              v-for="c in items"
              :key="c.id"
            >
              <td class="px-4 py-3 font-medium text-slate-100 sm:px-5">
                {{ c.name }}
              </td>
              <td class="px-4 py-3 text-slate-300">
                {{ c.slug }}
              </td>
              <td class="hidden px-4 py-3 text-slate-400 md:table-cell">
                {{ c.shopName || c.shopId }}
              </td>
              <td class="hidden max-w-sm truncate px-4 py-3 text-slate-500 lg:table-cell">
                {{ c.description || '—' }}
              </td>
              <td class="px-4 py-3 text-right sm:px-5">
                <button
                  type="button"
                  class="mr-2 rounded px-2 py-1 text-xs text-indigo-300 hover:bg-indigo-500/10"
                  @click="startEdit(c)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  :disabled="pending"
                  class="rounded px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                  @click="onDelete(c.id)"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="!loading && pageCount > 1"
        class="flex items-center justify-between border-t border-slate-800/70 px-4 py-3 text-xs text-slate-500"
      >
        <span>
          Page {{ page }} / {{ pageCount }} · Total {{ total }}
        </span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="page <= 1 || pending"
            class="rounded border border-slate-600/70 px-2 py-1 text-slate-200 disabled:opacity-40"
            @click="load(page - 1)"
          >
            Prev
          </button>
          <button
            type="button"
            :disabled="page >= pageCount || pending"
            class="rounded border border-slate-600/70 px-2 py-1 text-slate-200 disabled:opacity-40"
            @click="load(page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CategoryItem, ShopItem } from '~/composables/useAdminApi'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'staff'] })

const adminApi = useAdminApi()
const items = ref<CategoryItem[]>([])
const shopOptions = ref<ShopItem[]>([])
const loading = ref(true)
const pending = ref(false)
const loadError = ref('')
const page = ref(1)
const pageCount = ref(1)
const total = ref(0)
const limit = 10
const searchQ = ref('')
const filterShopId = ref('')

const editId = ref<string | null>(null)
const form = reactive({
  name: '',
  slug: '',
  shopId: '',
  description: ''
})

function parseError(e: unknown) {
  const d = (e as { data?: { ok?: boolean; error?: { message: string } } })?.data
  if (d?.ok === false && d.error) {
    return d.error.message
  }
  return (e as Error).message || 'Request failed'
}

function startEdit(item: CategoryItem) {
  editId.value = item.id
  form.name = item.name
  form.slug = item.slug
  form.shopId = item.shopId
  form.description = item.description
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetForm() {
  editId.value = null
  form.name = ''
  form.slug = ''
  form.shopId = shopOptions.value[0]?.id || ''
  form.description = ''
}

async function loadShops() {
  const res = await adminApi.shops.list({ page: 1, limit: 100 })
  if (res.ok) {
    shopOptions.value = res.data.items
    if (!form.shopId && shopOptions.value.length) {
      form.shopId = shopOptions.value[0].id
    }
  }
}

async function load(p = 1) {
  page.value = p
  loading.value = true
  loadError.value = ''
  try {
    const res = await adminApi.categories.list({
      page: p,
      limit,
      search: searchQ.value || undefined,
      shopId: filterShopId.value || undefined
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

async function onSubmit() {
  pending.value = true
  try {
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      shopId: form.shopId,
      description: form.description || undefined
    }
    if (editId.value) {
      const res = await adminApi.categories.update(editId.value, payload)
      if (res.ok) {
        resetForm()
        await load(page.value)
      }
    } else {
      const res = await adminApi.categories.create(payload)
      if (res.ok) {
        resetForm()
        await load(1)
      }
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    pending.value = false
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this category?')) {
    return
  }
  pending.value = true
  try {
    const res = await adminApi.categories.remove(id)
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

onMounted(async () => {
  try {
    await loadShops()
    await load(1)
  } catch (e) {
    loadError.value = parseError(e)
    loading.value = false
  }
})
</script>
