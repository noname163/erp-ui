<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import { salaryService, type SalaryRequest } from '@/services/salary.service'

type SalaryMethod = 'FIXED' | 'PERCENT' | 'FORMULA' | 'PLUS' | 'MINUS'
type SalaryComponentRow = {
  id: number
  name: string
  formula: string
  calculateMethod: SalaryMethod
  isDeduct: boolean
  createdBy: string
  updatedDate: string
}

const loading = ref(false)
const message = ref('')
const error = ref('')
const isModalOpen = ref(false)
const editingId = ref<number | null>(null)
const page = ref(1)
const pageSize = 10
const totalElements = ref(0)
const totalPages = ref(1)

const rows = ref<SalaryComponentRow[]>([])
const headers: UiTableHeader[] = [
  { key: 'name', label: 'Name', thClass: 'min-w-[180px]' },
  { key: 'formula', label: 'Formula', thClass: 'min-w-[220px]' },
  { key: 'calculateMethod', label: 'Method' },
  { key: 'isDeduct', label: 'Is Deduct', align: 'center' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'updatedDate', label: 'Updated Date' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

const calcOptions = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'PERCENT', label: 'Percentage' },
  { value: 'FORMULA', label: 'Formula' },
  { value: 'PLUS', label: 'Plus' },
  { value: 'MINUS', label: 'Minus' },
]

const deductOptions = [
  { value: 'false', label: 'No' },
  { value: 'true', label: 'Yes' },
]

const form = ref<{ name: string; calculateMethod: SalaryMethod; isDeduct: 'true' | 'false' }>({
  name: '',
  calculateMethod: 'FIXED',
  isDeduct: 'false',
})

const modalTitle = computed(() => (editingId.value === null ? 'Create Component' : 'Edit Component'))
const summaryText = computed(() => {
  if (totalElements.value === 0) return 'Showing 0 results'
  const from = (page.value - 1) * pageSize + 1
  const to = Math.min(page.value * pageSize, totalElements.value)
  return `Showing ${from} to ${to} of ${totalElements.value} results`
})

function formatDate(value?: string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

function normalizeRows(res: any): SalaryComponentRow[] {
  const raw = (res?.content ?? res?.data ?? res?.items ?? res ?? []) as any[]
  if (!Array.isArray(raw)) return []

  return raw.map((item: any, index: number) => ({
    id: Number(item?.id ?? item?.code ?? index + 1),
    name: String(item?.name ?? ''),
    formula: String(item?.formula ?? item?.expression ?? '-'),
    calculateMethod: String(item?.calculateMethod ?? 'FIXED').toUpperCase() as SalaryMethod,
    isDeduct: Boolean(item?.isDeduct),
    createdBy: String(item?.createdBy ?? item?.createdByName ?? '-'),
    updatedDate: formatDate(item?.updatedDate ?? item?.updatedAt),
  }))
}

async function loadRows() {
  loading.value = true
  error.value = ''
  try {
    const res = await salaryService.listComponents({
      page: page.value - 1,
      size: pageSize,
      sortDir: 'DESC',
    })
    rows.value = normalizeRows(res)
    totalElements.value = Number(res?.totalElements ?? rows.value.length ?? 0)
    totalPages.value = Math.max(1, Number(res?.totalPages ?? Math.ceil(totalElements.value / pageSize) ?? 1))
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to load salary components'
    rows.value = []
    totalElements.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

function methodLabel(method: SalaryMethod) {
  const match = calcOptions.find((o) => o.value === method)
  return match?.label ?? method
}

function openCreateModal() {
  editingId.value = null
  form.value = {
    name: '',
    calculateMethod: 'FIXED',
    isDeduct: 'false',
  }
  error.value = ''
  message.value = ''
  isModalOpen.value = true
}

function openEditModal(row: SalaryComponentRow) {
  editingId.value = row.id
  form.value = {
    name: row.name,
    calculateMethod: row.calculateMethod,
    isDeduct: row.isDeduct ? 'true' : 'false',
  }
  error.value = ''
  message.value = ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function saveComponent() {
  const trimmedName = form.value.name.trim()
  if (!trimmedName) {
    error.value = 'Name is required'
    return
  }
  if (trimmedName.length > 255) {
    error.value = 'Name must be at most 255 characters'
    return
  }

  loading.value = true
  error.value = ''
  message.value = ''

  const payload: SalaryRequest = {
    name: trimmedName,
    calculateMethod: form.value.calculateMethod,
    isDeduct: form.value.isDeduct === 'true',
  }

  try {
    await salaryService.createComponents([payload])
    message.value = `${editingId.value === null ? 'Created' : 'Saved'} ${payload.name}`
    closeModal()
    await loadRows()
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Create salary component failed'
  } finally {
    loading.value = false
  }
}

function removeRow(id: number) {
  rows.value = rows.value.filter((r) => r.id !== id)
  message.value = 'Component removed'
}

async function changePage(next: number) {
  if (next < 1 || next > totalPages.value || next === page.value) return
  page.value = next
  await loadRows()
}

onMounted(loadRows)
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Salary Components</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage earnings, deductions, and tax calculation rules.</p>
      </div>
      <UiButton variant="primary" :disabled="loading" @click="openCreateModal">Create Component</UiButton>
    </div>

    <div class="ui-card">
      <div class="p-4 md:p-6">
        <div v-if="error" class="text-sm text-red-500 mb-4">{{ error }}</div>
        <div v-if="message" class="text-sm text-green-600 mb-4">{{ message }}</div>

        <UiTable
          :headers="headers"
          :rows="rows"
          row-key="id"
          row-class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
          th-base-class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          td-base-class="px-4 py-4 text-sm"
        >
          <template #cell-name="{ row }">
            <span class="font-semibold">{{ row.name }}</span>
          </template>

          <template #cell-formula="{ row }">
            <code class="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-primary">{{ row.formula }}</code>
          </template>

          <template #cell-calculateMethod="{ row }">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {{ methodLabel(row.calculateMethod) }}
            </span>
          </template>

          <template #cell-isDeduct="{ row }">
            <div class="flex justify-center">
              <span
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold"
                :class="row.isDeduct ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'"
              >
                {{ row.isDeduct ? 'YES' : 'NO' }}
              </span>
            </div>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex justify-end gap-2">
              <button type="button" class="p-1.5 text-slate-400 hover:text-primary transition-colors" @click="openEditModal(row)">
                <UiIcon name="edit" />
              </button>
              <button type="button" class="p-1.5 text-slate-400 hover:text-red-500 transition-colors" @click="removeRow(row.id)">
                <UiIcon name="delete" />
              </button>
            </div>
          </template>
        </UiTable>

        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-primary/10 mt-2">
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ summaryText }}</p>
          <div class="flex items-center gap-2">
            <UiButton variant="outline" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Previous</UiButton>
            <span class="text-sm text-slate-600 dark:text-slate-300">Page {{ page }} / {{ totalPages }}</span>
            <UiButton variant="outline" :disabled="page >= totalPages || loading" @click="changePage(page + 1)">Next</UiButton>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closeModal">
      <div class="w-full max-w-xl ui-card">
        <div class="p-4 md:p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold">{{ modalTitle }}</h2>
            <button type="button" class="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" @click="closeModal">
              <UiIcon name="close" />
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UiInput v-model="form.name" label="Name" required placeholder="Basic Salary" />
            <UiSelect v-model="form.calculateMethod" label="Method" :options="calcOptions" required />
            <UiSelect v-model="form.isDeduct" label="Is Deduct" :options="deductOptions" required />
          </div>

          <div class="flex justify-end gap-3">
            <UiButton variant="outline" @click="closeModal">Cancel</UiButton>
            <UiButton variant="primary" :disabled="loading" @click="saveComponent">{{ editingId === null ? 'Create' : 'Update' }}</UiButton>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
