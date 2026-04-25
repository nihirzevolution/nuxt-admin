<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-6">
      <h1 class="text-2xl font-semibold tracking-tight text-white">
        Products
      </h1>
      <p class="mt-1 text-sm text-slate-400">
        CRUD via <code class="text-indigo-400/90">/api/products</code> — linked to shop and category.
      </p>
    </div>

    <p
      v-if="loadError"
      class="rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-300"
    >
      {{ loadError }}
    </p>

    <div class="flex flex-col flex-wrap gap-3 lg:flex-row">
      <input
        v-model="searchQ"
        type="search"
        placeholder="Search name or image URL…"
        class="min-w-0 flex-1 rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        @keydown.enter="load(1)"
      >
      <select
        v-model="filterShopId"
        class="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-200 lg:w-56"
        @change="onFilterShopChange"
      >
        <option value="">
          All shops
        </option>
        <option
          v-for="s in shopOptions"
          :key="s.id"
          :value="s.id"
        >
          {{ s.name }}
        </option>
      </select>
      <select
        v-model="filterCategoryId"
        class="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-200 lg:w-56"
        :disabled="!filterShopId"
        @change="load(1)"
      >
        <option value="">
          All categories
        </option>
        <option
          v-for="c in filterCategoryOptions"
          :key="c.id"
          :value="c.id"
        >
          {{ c.name }}
        </option>
      </select>
      <button
        type="button"
        class="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
        @click="load(1)"
      >
        Search
      </button>
    </div>

    <section class="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/40">
      <div class="border-b border-slate-800/80 px-5 py-4 sm:px-6">
        <h2 class="text-sm font-semibold text-white">
          {{ editId ? 'Edit product' : 'Add product' }}
        </h2>
      </div>
      <form
        class="space-y-4 p-5 sm:p-6"
        @submit.prevent="onSubmit"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-slate-400">Shop *</label>
            <select
              v-model="form.shopId"
              required
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              @change="onFormShopChange"
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
                {{ s.name }}
              </option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-slate-400">Category *</label>
            <select
              v-model="form.categoryId"
              required
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              :disabled="!form.shopId"
            >
              <option
                disabled
                value=""
              >
                Select category
              </option>
              <option
                v-for="c in formCategoryOptions"
                :key="c.id"
                :value="c.id"
              >
                {{ c.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5 sm:col-span-2">
            <label class="text-xs font-medium text-slate-400">Product name *</label>
            <input
              v-model="form.name"
              required
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-slate-400">Price *</label>
            <input
              v-model.number="form.price"
              type="number"
              min="0"
              step="0.01"
              required
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-slate-400">Product image (URL)</label>
            <input
              v-model="form.productImage"
              type="url"
              placeholder="https://…"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
          </div>
        </div>
        <div class="flex justify-end gap-2 border-t border-slate-800/60 pt-4">
          <button
            v-if="editId"
            type="button"
            class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
            @click="resetForm"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="pending"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {{ editId ? 'Save' : 'Create' }}
          </button>
        </div>
      </form>
    </section>

    <div class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/30">
      <div class="border-b border-slate-800/80 px-5 py-3">
        <h2 class="text-sm font-semibold text-white">
          List
        </h2>
      </div>
      <div
        v-if="loading"
        class="space-y-2 p-4"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="h-14 animate-pulse rounded bg-slate-800/60"
        />
      </div>
      <div
        v-else-if="!items.length"
        class="px-5 py-8 text-sm text-slate-500"
      >
        No products.
      </div>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3 sm:px-5">
                Image
              </th>
              <th class="px-4 py-3">
                Name
              </th>
              <th class="px-4 py-3">
                Price
              </th>
              <th class="hidden px-4 py-3 md:table-cell">
                Category
              </th>
              <th class="hidden px-4 py-3 lg:table-cell">
                Shop
              </th>
              <th class="px-4 py-3 text-right sm:px-5">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/70">
            <tr
              v-for="p in items"
              :key="p.id"
            >
              <td class="px-4 py-2 sm:px-5">
                <img
                  v-if="p.productImage"
                  :src="p.productImage"
                  alt=""
                  class="h-10 w-10 rounded object-cover bg-slate-800"
                >
                <span
                  v-else
                  class="inline-flex h-10 w-10 items-center justify-center rounded bg-slate-800 text-xs text-slate-500"
                >—</span>
              </td>
              <td class="px-4 py-2 font-medium text-slate-100">
                {{ p.name }}
              </td>
              <td class="px-4 py-2 text-slate-300">
                {{ formatPrice(p.price) }}
              </td>
              <td class="hidden px-4 py-2 text-slate-400 md:table-cell">
                {{ p.categoryName || p.categoryId }}
              </td>
              <td class="hidden px-4 py-2 text-slate-400 lg:table-cell">
                {{ p.shopName || p.shopId }}
              </td>
              <td class="px-4 py-2 text-right sm:px-5">
                <button
                  type="button"
                  class="mr-2 text-xs text-indigo-300 hover:underline"
                  @click="startEdit(p)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  :disabled="pending"
                  class="text-xs text-rose-300 hover:underline disabled:opacity-50"
                  @click="onDelete(p.id)"
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
        <span>Page {{ page }} / {{ pageCount }} · Total {{ total }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="page <= 1 || pending"
            class="rounded border border-slate-600 px-2 py-1 disabled:opacity-40"
            @click="load(page - 1)"
          >
            Prev
          </button>
          <button
            type="button"
            :disabled="page >= pageCount || pending"
            class="rounded border border-slate-600 px-2 py-1 disabled:opacity-40"
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
import type { CategoryItem, ProductItem, ShopItem } from '~/composables/useAdminApi'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'staff'] })

const adminApi = useAdminApi()
const items = ref<ProductItem[]>([])
const shopOptions = ref<ShopItem[]>([])
const formCategoryOptions = ref<CategoryItem[]>([])
const filterCategoryOptions = ref<CategoryItem[]>([])
const loading = ref(true)
const pending = ref(false)
const loadError = ref('')
const page = ref(1)
const pageCount = ref(1)
const total = ref(0)
const limit = 10
const searchQ = ref('')
const filterShopId = ref('')
const filterCategoryId = ref('')

const editId = ref<string | null>(null)
const form = reactive({
  shopId: '',
  categoryId: '',
  name: '',
  price: 0,
  productImage: ''
})

function formatPrice(n: number) {
  const x = Number(n)
  if (!Number.isFinite(x)) {
    return '—'
  }
  return x.toFixed(2)
}

function parseError(e: unknown) {
  const d = (e as { data?: { ok?: boolean; error?: { message: string } } })?.data
  if (d?.ok === false && d.error) {
    return d.error.message
  }
  return (e as Error).message || 'Request failed'
}

async function loadShops() {
  const res = await adminApi.shops.list({ page: 1, limit: 100 })
  if (res.ok) {
    shopOptions.value = res.data.items
    if (!form.shopId && shopOptions.value[0]) {
      form.shopId = shopOptions.value[0].id
    }
  }
}

async function loadCategoriesForShop(shopId: string, target: 'form' | 'filter') {
  if (!shopId) {
    if (target === 'form') {
      formCategoryOptions.value = []
    } else {
      filterCategoryOptions.value = []
    }
    return
  }
  const res = await adminApi.categories.list({ shopId, page: 1, limit: 200 })
  if (!res.ok) {
    return
  }
  if (target === 'form') {
    formCategoryOptions.value = res.data.items
    if (!res.data.items.some(c => c.id === form.categoryId)) {
      form.categoryId = res.data.items[0]?.id || ''
    }
  } else {
    filterCategoryOptions.value = res.data.items
    if (filterCategoryId.value && !res.data.items.some(c => c.id === filterCategoryId.value)) {
      filterCategoryId.value = ''
    }
  }
}

function onFormShopChange() {
  void loadCategoriesForShop(form.shopId, 'form')
}

function onFilterShopChange() {
  filterCategoryId.value = ''
  void loadCategoriesForShop(filterShopId.value, 'filter').then(() => load(1))
}

function startEdit(p: ProductItem) {
  editId.value = p.id
  form.shopId = p.shopId
  form.categoryId = p.categoryId
  form.name = p.name
  form.price = p.price
  form.productImage = p.productImage || ''
  void loadCategoriesForShop(form.shopId, 'form')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetForm() {
  editId.value = null
  form.name = ''
  form.price = 0
  form.productImage = ''
  form.shopId = shopOptions.value[0]?.id || ''
  form.categoryId = ''
  void loadCategoriesForShop(form.shopId, 'form')
}

async function load(p = 1) {
  page.value = p
  loading.value = true
  loadError.value = ''
  try {
    const res = await adminApi.products.list({
      page: p,
      limit,
      search: searchQ.value || undefined,
      shopId: filterShopId.value || undefined,
      categoryId: filterCategoryId.value || undefined
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
    const body = {
      shopId: form.shopId,
      categoryId: form.categoryId,
      name: form.name,
      price: Number(form.price),
      productImage: form.productImage || undefined
    }
    if (editId.value) {
      const res = await adminApi.products.update(editId.value, body)
      if (res.ok) {
        resetForm()
        await load(page.value)
      }
    } else {
      const res = await adminApi.products.create(body)
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
  if (!confirm('Delete this product?')) {
    return
  }
  pending.value = true
  try {
    const res = await adminApi.products.remove(id)
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
    await loadCategoriesForShop(form.shopId, 'form')
    await load(1)
  } catch (e) {
    loadError.value = parseError(e)
    loading.value = false
  }
})
</script>
