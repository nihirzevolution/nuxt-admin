<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-6">
      <h1 class="text-2xl font-semibold tracking-tight text-white">
        Shop ↔ user links
      </h1>
      <p class="mt-1 text-sm text-slate-400">
        Shop adds users (pending) → user accepts in app. Only an <span class="text-slate-200">active</span> link allows purchases. Use search to pick users, then invite in bulk.
      </p>
    </div>

    <p
      v-if="loadError"
      class="rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-300"
    >
      {{ loadError }}
    </p>
    <p
      v-if="inviteMessage"
      class="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200"
    >
      {{ inviteMessage }}
    </p>

    <section class="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/40">
      <div class="border-b border-slate-800/80 px-5 py-4 sm:px-6">
        <h2 class="text-sm font-semibold text-white">
          Send invites
        </h2>
        <p class="mt-1 text-xs text-slate-500">
          Choose a shop, search users, add to list, then invite.
        </p>
      </div>
      <div class="space-y-4 p-5 sm:p-6">
        <div class="grid gap-4 sm:max-w-md">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-slate-400">Shop *</label>
            <select
              v-model="formShopId"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
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
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div class="min-w-0 flex-1 space-y-1.5">
            <label class="text-xs font-medium text-slate-400">Search users (name / email)</label>
            <input
              v-model="userSearchQ"
              type="search"
              class="w-full rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              placeholder="Type and press Search…"
              @keydown.enter.prevent="searchUsers"
            >
          </div>
          <button
            type="button"
            class="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
            :disabled="userSearchPending"
            @click="searchUsers"
          >
            Search
          </button>
        </div>

        <div
          v-if="searchHits.length"
          class="max-h-48 overflow-y-auto rounded-lg border border-slate-800/80"
        >
          <button
            v-for="u in searchHits"
            :key="u.id"
            type="button"
            class="flex w-full items-center justify-between border-b border-slate-800/50 px-3 py-2 text-left text-sm last:border-0 hover:bg-slate-800/40"
            :disabled="selectedUsers.some(s => s.id === u.id)"
            @click="addUser(u)"
          >
            <span class="text-slate-200">{{ u.name }} <span class="text-slate-500">{{ u.email }}</span></span>
            <span
              v-if="selectedUsers.some(s => s.id === u.id)"
              class="text-xs text-slate-500"
            >Added</span>
            <span
              v-else
              class="text-xs text-indigo-400"
            >+ Add</span>
          </button>
        </div>

        <div v-if="selectedUsers.length">
          <p class="mb-2 text-xs font-medium text-slate-500">
            Selected ({{ selectedUsers.length }})
          </p>
          <ul class="flex flex-wrap gap-2">
            <li
              v-for="u in selectedUsers"
              :key="u.id"
              class="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200"
            >
              {{ u.name }}
              <button
                type="button"
                class="text-rose-400 hover:text-rose-300"
                @click="removeUser(u.id)"
              >
                ×
              </button>
            </li>
          </ul>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            :disabled="!formShopId || !selectedUsers.length || invitePending"
            @click="sendInvites"
          >
            {{ invitePending ? 'Sending…' : 'Send invites' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400"
            @click="clearSelection"
          >
            Clear selection
          </button>
        </div>
      </div>
    </section>

    <div class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/30">
      <div class="border-b border-slate-800/80 px-5 py-3">
        <h2 class="text-sm font-semibold text-white">
          Links for shop
        </h2>
      </div>
      <div class="flex flex-wrap gap-2 border-b border-slate-800/60 px-5 py-3">
        <select
          v-model="listShopId"
          class="rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
          @change="loadList(1)"
        >
          <option value="">
            Select shop to list
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
          v-model="listStatus"
          class="rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
          @change="loadList(1)"
        >
          <option value="">
            All statuses
          </option>
          <option value="pending">
            pending
          </option>
          <option value="active">
            active
          </option>
          <option value="declined">
            declined
          </option>
          <option value="revoked">
            revoked
          </option>
        </select>
        <button
          type="button"
          class="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300"
          :disabled="!listShopId"
          @click="loadList(1)"
        >
          Refresh
        </button>
      </div>
      <div
        v-if="listLoading"
        class="p-4"
      >
        <div class="h-10 animate-pulse rounded bg-slate-800/60" />
      </div>
      <div
        v-else-if="!listShopId"
        class="px-5 py-8 text-sm text-slate-500"
      >
        Select a shop to see members / invite status.
      </div>
      <div
        v-else-if="!listItems.length"
        class="px-5 py-8 text-sm text-slate-500"
      >
        No links.
      </div>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-900/50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-4 py-2">
                User
              </th>
              <th class="px-4 py-2">
                Status
              </th>
              <th class="px-4 py-2 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/70">
            <tr
              v-for="row in listItems"
              :key="row.id"
            >
              <td class="px-4 py-2 text-slate-200">
                {{ row.userName || '—' }} <span class="text-slate-500">{{ row.userEmail }}</span>
              </td>
              <td class="px-4 py-2">
                <span
                  class="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
                >{{ row.status }}</span>
              </td>
              <td class="px-4 py-2 text-right">
                <button
                  v-if="row.status === 'pending' || row.status === 'active'"
                  type="button"
                  :disabled="revokeId === row.id"
                  class="text-xs text-rose-300 hover:underline disabled:opacity-50"
                  @click="onRevoke(row.id)"
                >
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShopItem, ShopUserLinkItem, UserItem } from '~/composables/useAdminApi'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'staff'] })

const adminApi = useAdminApi()
const loadError = ref('')
const inviteMessage = ref('')
const shopOptions = ref<ShopItem[]>([])

const formShopId = ref('')
const listShopId = ref('')
const listStatus = ref('')
const listItems = ref<ShopUserLinkItem[]>([])
const listLoading = ref(false)

const userSearchQ = ref('')
const userSearchPending = ref(false)
const searchHits = ref<UserItem[]>([])

const selectedUsers = ref<UserItem[]>([])
const invitePending = ref(false)
const revokeId = ref('')

function parseError(e: unknown) {
  const d = (e as { data?: { ok?: boolean; error?: { message: string } } })?.data
  if (d?.ok === false && d.error) {
    return d.error.message
  }
  return (e as Error).message || 'Request failed'
}

async function loadShops() {
  const res = await adminApi.shops.list({ page: 1, limit: 200 })
  if (res.ok) {
    shopOptions.value = res.data.items
  }
}

function addUser(u: UserItem) {
  if (selectedUsers.value.some(s => s.id === u.id)) {
    return
  }
  selectedUsers.value = [...selectedUsers.value, u]
}

function removeUser(id: string) {
  selectedUsers.value = selectedUsers.value.filter(u => u.id !== id)
}

function clearSelection() {
  selectedUsers.value = []
  searchHits.value = []
  inviteMessage.value = ''
}

async function searchUsers() {
  const q = userSearchQ.value.trim()
  if (!q) {
    return
  }
  userSearchPending.value = true
  loadError.value = ''
  try {
    const res = await adminApi.users.list({ page: 1, limit: 20, search: q })
    if (res.ok) {
      searchHits.value = res.data.items
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    userSearchPending.value = false
  }
}

async function sendInvites() {
  if (!formShopId.value || !selectedUsers.value.length) {
    return
  }
  invitePending.value = true
  inviteMessage.value = ''
  loadError.value = ''
  try {
    const res = await adminApi.shopLinks.invite({
      shopId: formShopId.value,
      userIds: selectedUsers.value.map(u => u.id)
    })
    if (res.ok) {
      const { results } = res.data
      const okN = results.filter(r => r.ok).length
      const failN = results.length - okN
      inviteMessage.value
        = `Invites: ${okN} sent${failN ? `, ${failN} failed (see console)` : ''}.`
      if (failN) {
        console.warn(results.filter(r => !r.ok))
      }
      if (listShopId.value === formShopId.value) {
        await loadList(1)
      }
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    invitePending.value = false
  }
}

async function loadList(_p: number) {
  if (!listShopId.value) {
    listItems.value = []
    return
  }
  listLoading.value = true
  try {
    const res = await adminApi.shopLinks.list({
      page: 1,
      limit: 100,
      shopId: listShopId.value,
      status: listStatus.value || undefined
    })
    if (res.ok) {
      listItems.value = res.data.items
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    listLoading.value = false
  }
}

async function onRevoke(id: string) {
  if (!confirm('Revoke this link? User will need a new invite.')) {
    return
  }
  revokeId.value = id
  try {
    const res = await adminApi.shopLinks.revoke(id)
    if (res.ok) {
      await loadList(1)
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    revokeId.value = ''
  }
}

onMounted(async () => {
  try {
    await loadShops()
  } catch (e) {
    loadError.value = parseError(e)
  }
})
</script>
