<template>
  <div>
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1
        class="text-2xl font-semibold tracking-tight text-white"
      >
        Roles
      </h1>
    </div>

    <p
      v-if="loadError"
      class="mb-4 text-sm text-red-400"
    >{{ loadError }}</p>

    <section
      class="mb-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4"
    >
      <h2
        class="text-sm font-medium text-slate-300"
      >
        {{ editId ? 'Edit role' : 'Create role' }}
      </h2>
      <form
        class="mt-3 flex flex-col gap-3"
        @submit.prevent="onFormSubmit"
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              for="r-name"
              class="text-xs text-slate-500"
            >Name</label>
            <input
              id="r-name"
              v-model="form.name"
              class="mt-0.5 w-full rounded-md border border-slate-600 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100"
              required
            >
          </div>
          <div>
            <label
              for="r-slug"
              class="text-xs text-slate-500"
            >Slug
              <span
                v-if="editingItem?.isSystem"
                class="text-slate-600"
              >(system — locked)</span>
            </label>
            <input
              id="r-slug"
              v-model="form.slug"
              :disabled="Boolean(editingItem?.isSystem)"
              class="mt-0.5 w-full rounded-md border border-slate-600 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
          </div>
        </div>
        <div>
          <label
            for="r-desc"
            class="text-xs text-slate-500"
          >Description</label>
          <input
            id="r-desc"
            v-model="form.description"
            class="mt-0.5 w-full rounded-md border border-slate-600 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100"
          >
        </div>
        <div
          v-if="!editingItem?.isSystem"
          class="flex items-center gap-2"
        >
          <input
            id="r-active"
            v-model="form.isActive"
            type="checkbox"
            class="rounded border-slate-600"
          >
          <label
            for="r-active"
            class="text-sm text-slate-300"
          >Active</label>
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
            <th class="px-3 py-2.5">Slug</th>
            <th class="px-3 py-2.5">System</th>
            <th class="px-3 py-2.5">Active</th>
            <th class="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in items"
            :key="r.id"
            class="border-b border-slate-800/50 odd:bg-slate-900/20"
          >
            <td class="px-3 py-2.5 text-slate-200">{{ r.name }}</td>
            <td
              class="px-3 py-2.5 font-mono text-xs text-slate-400"
            >{{ r.slug }}</td>
            <td class="px-3 py-2.5">{{ r.isSystem ? 'Yes' : '—' }}</td>
            <td class="px-3 py-2.5">{{ r.isActive ? 'Yes' : 'No' }}</td>
            <td
              class="px-3 py-2.5 text-right"
            >
              <button
                type="button"
                class="mr-2 text-indigo-400 hover:underline"
                @click="startEdit(r)"
              >Edit</button>
              <button
                v-if="!r.isSystem"
                type="button"
                class="text-red-400/90 hover:underline"
                :disabled="pending"
                @click="onDelete(r.id)"
              >Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RoleItem } from '~/composables/useAdminApi'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] })

const adminApi = useAdminApi()
const items = ref<RoleItem[]>([])
const loading = ref(true)
const pending = ref(false)
const loadError = ref('')

const editId = ref<string | null>(null)
const editingItem = computed(
  () => (editId.value ? items.value.find((x) => x.id === editId.value) : null)
)
const form = reactive({
  name: '',
  slug: '',
  description: '',
  isActive: true
})
async function onFormSubmit() {
  if (editId.value) {
    await onUpdate()
  } else {
    await onCreate()
  }
}

function startEdit(r: RoleItem) {
  editId.value = r.id
  form.name = r.name
  form.slug = r.slug
  form.description = r.description
  form.isActive = r.isActive
}

function cancelEdit() {
  editId.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  form.isActive = true
}

function parseError(e: unknown) {
  const d = (e as { data?: { ok?: boolean; error?: { message: string } } })?.data
  if (d?.ok === false && d.error) {
    return d.error.message
  }
  return (e as Error).message || 'Request failed'
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await adminApi.roles.list({ page: 1, limit: 100 })
    if (res.ok) {
      items.value = res.data.items
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    loading.value = false
  }
}

async function onCreate() {
  pending.value = true
  try {
    const res = await adminApi.roles.create({
      name: form.name,
      slug: form.slug || undefined,
      description: form.description
    })
    if (res.ok) {
      cancelEdit()
      await load()
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
    const res = await adminApi.roles.update(editId.value, {
      name: form.name,
      slug: editingItem.value?.isSystem ? undefined : (form.slug || undefined),
      description: form.description,
      isActive: editingItem.value?.isSystem ? undefined : form.isActive
    })
    if (res.ok) {
      cancelEdit()
      await load()
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    pending.value = false
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this role? Users with this role must be moved first.')) {
    return
  }
  pending.value = true
  try {
    const res = await adminApi.roles.remove(id)
    if (res.ok) {
      if (editId.value === id) {
        cancelEdit()
      }
      await load()
    }
  } catch (e) {
    loadError.value = parseError(e)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  void load()
})
</script>
