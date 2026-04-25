<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-6">
      <h1 class="text-2xl font-semibold tracking-tight text-white">
        Purchases
      </h1>
      <p class="mt-1 text-sm text-slate-400">
        Ledger-style lines via <code class="text-indigo-400/90">/api/purchases</code> — shop, customer (<code class="text-slate-500">userId</code>), product, quantity, price snapshot. Soft-deleted rows are hidden from lists.
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
        placeholder="Search notes…"
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
        v-model="filterUserId"
        class="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-200 lg:w-56"
        @change="load(1)"
      >
        <option value="">
          All customers
        </option>
        <option
          v-for="u in userOptions"
          :key="u.id"
          :value="u.id"
        >
          {{ u.name }} ({{ u.email }})
        </option>
      </select>
      <select
        v-model="filterProductId"
        class="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-200 lg:w-56"
        :disabled="!filterShopId"
        @change="load(1)"
      >
        <option value="">
          All products
        </option>
        <option
          v-for="p in filterProductOptions"
          :key="p.id"
          :value="p.id"
        >
          {{ p.name }}
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
          {{ editId ? 'Edit purchase' : 'Add purchase' }}
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
            <label class="text-xs font-medium text-slate-400">Customer (user) *</label>
            <select
              v-model="form.userId"
              required
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
              <option
                disabled
                value=""
              >
                Select user
              </option>
              <option
                v-for="u in userOptions"
                :key="u.id"
                :value="u.id"
              >
                {{ u.name }} — {{ u.email }}
              </option>
            </select>
          </div>
          <div class="space-y-1.5 sm:col-span-2">
            <label class="text-xs font-medium text-slate-400">Product *</label>
            <select
              v-model="form.productId"
              required
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              :disabled="!form.shopId"
            >
              <option
                disabled
                value=""
              >
                Select product
              </option>
              <option
                v-for="p in formProductOptions"
                :key="p.id"
                :value="p.id"
              >
                {{ p.name }} — {{ formatPrice(p.price) }}
              </option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-slate-400">Quantity *</label>
            <input
              v-model.number="form.quantity"
              type="number"
              min="0.01"
              step="0.01"
              required
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-slate-400">Price at purchase *</label>
            <input
              v-model.number="form.priceAtPurchase"
              type="number"
              min="0"
              step="0.01"
              required
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
          </div>
          <div class="space-y-1.5 sm:col-span-2">
            <label class="text-xs font-medium text-slate-400">Purchase date</label>
            <input
              v-model="form.purchaseDateLocal"
              type="datetime-local"
              class="w-full max-w-md rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
          </div>
          <div class="space-y-1.5 sm:col-span-2">
            <label class="text-xs font-medium text-slate-400">Notes</label>
            <input
              v-model="form.notes"
              type="text"
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
        No purchases.
      </div>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-4 py-3 sm:px-5">
                Date
              </th>
              <th class="px-4 py-3">
                Product
              </th>
              <th class="px-4 py-3">
                Qty
              </th>
              <th class="px-4 py-3">
                Line total
              </th>
              <th class="hidden px-4 py-3 md:table-cell">
                Customer
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
              v-for="row in items"
              :key="row.id"
            >
              <td class="px-4 py-2 sm:px-5 text-slate-400">
                {{ formatDate(row.purchaseDate) }}
              </td>
              <td class="px-4 py-2 font-medium text-slate-100">
                {{ row.productName || row.productId }}
              </td>
              <td class="px-4 py-2 text-slate-300">
                {{ row.quantity }}
              </td>
              <td class="px-4 py-2 text-slate-300">
                {{ formatPrice(row.totalAmount) }}
              </td>
              <td class="hidden px-4 py-2 text-slate-400 md:table-cell">
                {{ row.userName || row.userId }}
              </td>
              <td class="hidden px-4 py-2 text-slate-400 lg:table-cell">
                {{ row.shopName || row.shopId }}
              </td>
              <td class="px-4 py-2 text-right sm:px-5">
                <button
                  type="button"
                  class="mr-2 text-xs text-indigo-300 hover:underline"
                  @click="startEdit(row)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  :disabled="pending"
                  class="text-xs text-rose-300 hover:underline disabled:opacity-50"
                  @click="onDelete(row.id)"
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
import type { ProductItem, PurchaseItem, ShopItem, UserItem } from '~/composables/useAdminApi'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'staff'] })

const adminApi = useAdminApi()
const items = ref<PurchaseItem[]>([])
const shopOptions = ref<ShopItem[]>([])
const userOptions = ref<UserItem[]>([])
const formProductOptions = ref<ProductItem[]>([])
const filterProductOptions = ref<ProductItem[]>([])
const loading = ref(true)
const pending = ref(false)
const loadError = ref('')
const page = ref(1)
const pageCount = ref(1)
const total = ref(0)
const limit = 10
const searchQ = ref('')
const filterShopId = ref('')
const filterUserId = ref('')
const filterProductId = ref('')

const editId = ref<string | null>(null)
const form = reactive({
  shopId: '',
  userId: '',
  productId: '',
  quantity: 1,
  priceAtPurchase: 0,
  notes: '',
  purchaseDateLocal: ''
})

function formatPrice(n: number) {
  const x = Number(n)
  if (!Number.isFinite(x)) {
    return '—'
  }
  return x.toFixed(2)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  return d.toLocaleString()
}

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return ''
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const h = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${y}-${m}-${day}T${h}:${min}`
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

async function loadUsers() {
  const res = await adminApi.users.list({ page: 1, limit: 100 })
  if (res.ok) {
    userOptions.value = res.data.items
    if (!form.userId && userOptions.value[0]) {
      form.userId = userOptions.value[0].id
    }
  }
}

async function loadProductsForShop(shopId: string, target: 'form' | 'filter') {
  if (!shopId) {
    if (target === 'form') {
      formProductOptions.value = []
    } else {
      filterProductOptions.value = []
    }
    return
  }
  const res = await adminApi.products.list({ shopId, page: 1, limit: 200 })
  if (!res.ok) {
    return
  }
  if (target === 'form') {
    formProductOptions.value = res.data.items
    if (!res.data.items.some(p => p.id === form.productId)) {
      form.productId = res.data.items[0]?.id || ''
    }
  } else {
    filterProductOptions.value = res.data.items
    if (filterProductId.value && !res.data.items.some(p => p.id === filterProductId.value)) {
      filterProductId.value = ''
    }
  }
}

function onFormShopChange() {
  void loadProductsForShop(form.shopId, 'form')
}

function onFilterShopChange() {
  filterProductId.value = ''
  void loadProductsForShop(filterShopId.value, 'filter').then(() => load(1))
}

function startEdit(row: PurchaseItem) {
  editId.value = row.id
  form.shopId = row.shopId
  form.userId = row.userId
  form.productId = row.productId
  form.quantity = row.quantity
  form.priceAtPurchase = row.priceAtPurchase
  form.notes = row.notes || ''
  form.purchaseDateLocal = toDatetimeLocalValue(row.purchaseDate)
  void loadProductsForShop(form.shopId, 'form')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetForm() {
  editId.value = null
  form.quantity = 1
  form.priceAtPurchase = 0
  form.notes = ''
  form.purchaseDateLocal = ''
  form.shopId = shopOptions.value[0]?.id || ''
  form.userId = userOptions.value[0]?.id || ''
  form.productId = ''
  void loadProductsForShop(form.shopId, 'form')
}

async function load(p = 1) {
  page.value = p
  loading.value = true
  loadError.value = ''
  try {
    const res = await adminApi.purchases.list({
      page: p,
      limit,
      search: searchQ.value || undefined,
      shopId: filterShopId.value || undefined,
      userId: filterUserId.value || undefined,
      productId: filterProductId.value || undefined
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

function purchaseDateIsoFromForm() {
  if (!form.purchaseDateLocal) {
    return undefined
  }
  const d = new Date(form.purchaseDateLocal)
  if (Number.isNaN(d.getTime())) {
    return undefined
  }
  return d.toISOString()
}

async function onSubmit() {
  pending.value = true
  try {
    const bodyBase = {
      shopId: form.shopId,
      userId: form.userId,
      productId: form.productId,
      quantity: Number(form.quantity),
      priceAtPurchase: Number(form.priceAtPurchase),
      notes: form.notes || undefined,
      purchaseDate: purchaseDateIsoFromForm()
    }
    if (editId.value) {
      const res = await adminApi.purchases.update(editId.value, bodyBase)
      if (res.ok) {
        resetForm()
        await load(page.value)
      }
    } else {
      const res = await adminApi.purchases.create(bodyBase)
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
  if (!confirm('Soft-delete this purchase?')) {
    return
  }
  pending.value = true
  try {
    const res = await adminApi.purchases.remove(id)
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
    await loadUsers()
    await loadProductsForShop(form.shopId, 'form')
    await loadProductsForShop(filterShopId.value, 'filter')
    await load(1)
  } catch (e) {
    loadError.value = parseError(e)
    loading.value = false
  }
})
</script>
