<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { AppRoute } from '@/types'
import { employeeService } from '@/services/employee.service'
import { useI18n } from '@/i18n'

type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'

type EmployeeRow = {
  id: string
  code: string
  name: string
  email: string
  age: number | null
  department: string
  skills: string[]
  status: EmployeeStatus
  createdAt: string
  createdBy: string
  avatarUrl?: string
}

const router = useRouter()
const { t } = useI18n();
const query = ref('')
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const pageSize = 10
const isFilterOpen = ref(false)
const rows = ref<EmployeeRow[]>([])

const filters = ref({
  name: '',
  minAge: '',
  maxAge: '',
  department: 'ALL',
  skill: '',
  status: 'ALL',
})

const seedRows: EmployeeRow[] = []
const headers: UiTableHeader[] = [
  { key: 'id', label: 'ID' },
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'age', label: 'Age', align: 'center' },
  { key: 'department', label: 'Department' },
  { key: 'skills', label: 'Skills' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

const departmentOptions = computed(() => [
  { value: 'ALL', label: t('employees.list.filters.allDepartments') },
  ...Array.from(new Set(rows.value.map((row) => row.department).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right))
    .map((department) => ({ value: department, label: department })),
])

const statusOptions = computed(() => [
  { value: 'ALL', label: t('employees.list.filters.allStatuses') },
  { value: 'ACTIVE', label: t('common.status.active') },
  { value: 'ON_LEAVE', label: t('common.status.onLeave') },
  { value: 'INACTIVE', label: t('common.status.inactive') },
])

function getString(obj: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return fallback
}

function getNumber(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value)
  }

  return null
}

function getSkills(obj: Record<string, unknown>) {
  const raw = obj.skills
  if (!Array.isArray(raw)) return []

  return raw
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
}

function normalizeStatus(raw: string): EmployeeStatus {
  const value = raw.toUpperCase()
  if (value === 'ACTIVE') return 'ACTIVE'
  if (value === 'ON_LEAVE' || value === 'ON LEAVE') return 'ON_LEAVE'
  return 'INACTIVE'
}

function asRecord(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

function normalizeCollection(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => item !== null)
  }

  const record = asRecord(payload)
  if (!record) return []

  const directCollection = [record.content, record.data, record.employees, record.items, record.results]
    .find(Array.isArray)

  if (Array.isArray(directCollection)) {
    return directCollection
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => item !== null)
  }

  return []
}

function normalizeRow(payload: Record<string, unknown>, index: number): EmployeeRow | null {
  const name = getString(payload, ['name', 'fullName'], '')
  const firstName = getString(payload, ['firstName'])
  const lastName = getString(payload, ['lastName'])
  const resolvedName = name || [firstName, lastName].filter(Boolean).join(' ').trim()

  if (!resolvedName && !getString(payload, ['code', 'employeeCode', 'email'])) return null

  return {
    id: getString(payload, ['id', 'employeeId', 'userCode'], String(index + 1)),
    code: getString(payload, ['code', 'employeeCode'], `EMP-${String(index + 1).padStart(5, '0')}`),
    name: resolvedName || `Employee ${index + 1}`,
    email: getString(payload, ['email'], 'n/a'),
    age: getNumber(payload, ['age']),
    department: getString(payload, ['departmentName', 'department'], t('common.state.notAvailable')),
    skills: getSkills(payload),
    status: normalizeStatus(getString(payload, ['status'], 'ACTIVE')),
    createdAt: getString(payload, ['createdAt', 'createdDate'], '-'),
    createdBy: getString(payload, ['createdBy', 'createdByName'], '-'),
    avatarUrl: getString(payload, ['avatarUrl', 'avatar'], ''),
  }
}

async function loadEmployees() {
  loading.value = true
  error.value = ''

  try {
    const res = await employeeService.list({ page: 0, size: 100 })
    rows.value = normalizeCollection(res)
      .map(normalizeRow)
      .filter((item): item is EmployeeRow => item !== null)
  } catch (e: any) {
    rows.value = []
    error.value = e?.response?.data?.message ?? t('employees.list.loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(loadEmployees)

const filteredRows = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  const nameFilter = filters.value.name.trim().toLowerCase()
  const minAge = filters.value.minAge.trim() ? Number(filters.value.minAge) : null
  const maxAge = filters.value.maxAge.trim() ? Number(filters.value.maxAge) : null
  const department = filters.value.department
  const skill = filters.value.skill.trim().toLowerCase()
  const status = filters.value.status

  return rows.value.filter((row) => {
    if (keyword) {
      const searchable = [
        row.id,
        row.code,
        row.name,
        row.email,
        row.department,
        row.createdBy,
        row.skills.join(' '),
        row.status,
      ]
        .join(' ')
        .toLowerCase()

      if (!searchable.includes(keyword)) return false
    }

    if (nameFilter && !row.name.toLowerCase().includes(nameFilter)) return false
    if (department !== 'ALL' && row.department !== department) return false
    if (status !== 'ALL' && row.status !== status) return false
    if (skill && !row.skills.some((item) => item.toLowerCase().includes(skill))) return false
    if (minAge !== null && (row.age === null || row.age < minAge)) return false
    if (maxAge !== null && (row.age === null || row.age > maxAge)) return false

    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredRows.value.slice(start, start + pageSize)
})

const pageStart = computed(() => (filteredRows.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize + 1))
const pageEnd = computed(() => Math.min(currentPage.value * pageSize, filteredRows.value.length))

const pageButtons = computed(() => {
  const max = totalPages.value
  const current = currentPage.value
  const pages = new Set<number>([1, max, current, current - 1, current + 1])
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= max)
    .sort((left, right) => left - right)
})

watch(filteredRows, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  if (currentPage.value < 1) currentPage.value = 1
})

function statusVariant(status: EmployeeStatus) {
  if (status === 'ACTIVE') return 'success' as const
  if (status === 'ON_LEAVE') return 'warning' as const
  return 'info' as const
}

function statusLabel(status: EmployeeStatus) {
  if (status === 'ON_LEAVE') return 'On Leave'
  if (status === 'INACTIVE') return 'Inactive'
  return 'Active'
}

function exportCsv() {
  const header = ['id', 'code', 'name', 'email', 'age', 'department', 'skills', 'status', 'createdAt', 'createdBy']
  const body = filteredRows.value.map((row) => [
    row.id,
    row.code,
    row.name,
    row.email,
    row.age ?? '-',
    row.department,
    row.skills.join('|'),
    statusLabel(row.status),
    row.createdAt,
    row.createdBy,
  ])

  const csv = [header, ...body]
    .map((cols) => cols.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'employees.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

function toggleFilters() {
  isFilterOpen.value = !isFilterOpen.value
}

function resetFilters() {
  query.value = ''
  filters.value = {
    name: '',
    minAge: '',
    maxAge: '',
    department: 'ALL',
    skill: '',
    status: 'ALL',
  }
}

function applyFilters() {
  currentPage.value = 1
}

function setPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold">Employee Directory</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and monitor all workforce data in one central repository.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <UiButton
            variant="outline"
            leadingIcon="filter_list"
            @click="toggleFilters"
          >
            {{ isFilterOpen ? t('employees.list.actions.hideFilters') : t('employees.list.actions.showFilters') }}
          </UiButton>
          <UiButton variant="outline" leadingIcon="download" @click="exportCsv">{{ t('common.action.export') }}</UiButton>
          <UiButton variant="primary" leadingIcon="person_add" @click="router.push(AppRoute.CREATE_EMPLOYEE)">
            Add Employee
          </UiButton>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div class="w-full lg:max-w-md">
          <UiInput
            v-model="query"
            leading-icon="search"
            placeholder="Search for employees, codes, departments..."
          />
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ filteredRows.length }} result{{ filteredRows.length === 1 ? '' : 's' }}
        </p>
      </div>

      <UiCard v-if="isFilterOpen">
        <UiCardBody class="space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <UiInput
              v-model="filters.name"
              :label="t('employees.list.filters.name')"
              :placeholder="t('employees.list.filters.namePlaceholder')"
            />
            <UiSelect
              v-model="filters.department"
              :label="t('employees.list.filters.department')"
              :options="departmentOptions"
            />
            <UiSelect
              v-model="filters.status"
              :label="t('employees.list.filters.status')"
              :options="statusOptions"
            />
            <UiInput
              v-model="filters.skill"
              :label="t('employees.list.filters.skill')"
              :placeholder="t('employees.list.filters.skillPlaceholder')"
            />
            <UiInput
              v-model="filters.minAge"
              :label="t('employees.list.filters.minAge')"
              type="number"
              min="0"
            />
            <UiInput
              v-model="filters.maxAge"
              :label="t('employees.list.filters.maxAge')"
              type="number"
              min="0"
            />
          </div>

          <div class="flex justify-end gap-2">
            <UiButton variant="outline" @click="resetFilters">{{ t('common.action.reset') }}</UiButton>
            <UiButton variant="primary" leadingIcon="filter_alt" @click="applyFilters">
              {{ t('common.action.apply') }}
            </UiButton>
          </div>
        </UiCardBody>
      </UiCard>

      <div class="ui-card">
        <div class="p-4 md:p-6">
          <div v-if="error" class="text-sm text-amber-600 mb-4">{{ error }}</div>
          <div v-if="loading" class="text-sm text-slate-500">Loading employees...</div>

          <UiTable
            v-else
            :headers="headers"
            :rows="pagedRows"
            :row-key="(row) => row.id"
            row-class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            th-base-class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider"
            td-base-class="px-4 py-3"
            table-class="min-w-[1200px]"
          >
            <template #cell-id="{ row }">
              <span class="text-slate-400 font-medium text-sm">{{ row.id }}</span>
            </template>

            <template #cell-code="{ row }">
              <span class="text-primary font-semibold text-sm">{{ row.code }}</span>
            </template>

            <template #cell-name="{ row }">
              <div class="flex items-center gap-3">
                <div
                  class="size-9 rounded-full bg-slate-200 bg-cover bg-center"
                  :style="row.avatarUrl ? { backgroundImage: `url('${row.avatarUrl}')` } : undefined"
                />
                <span class="font-semibold text-sm">{{ row.name }}</span>
              </div>
            </template>

            <template #cell-email="{ row }">
              <span class="text-sm text-slate-500 dark:text-slate-400">{{ row.email }}</span>
            </template>

            <template #cell-age="{ row }">
              <span class="text-sm text-slate-500">{{ row.age ?? '-' }}</span>
            </template>

            <template #cell-department="{ row }">
              <span class="font-medium">{{ row.department }}</span>
            </template>

            <template #cell-skills="{ row }">
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="skill in row.skills"
                  :key="`${row.id}-${skill}`"
                  class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400"
                >
                  {{ skill }}
                </span>
                <span
                  v-if="row.skills.length === 0"
                  class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-400"
                >
                  None
                </span>
              </div>
            </template>

            <template #cell-status="{ row }">
              <UiBadge :variant="statusVariant(row.status)">
                {{ statusLabel(row.status) }}
              </UiBadge>
            </template>

            <template #cell-createdAt="{ row }">
              <span class="text-sm text-slate-500">{{ row.createdAt }}</span>
            </template>

            <template #cell-createdBy="{ row }">
              <span class="text-sm text-slate-500">{{ row.createdBy }}</span>
            </template>

            <template #cell-actions>
              <div class="flex justify-end gap-2">
                <button type="button" class="p-1 hover:text-primary transition-colors" title="Edit">
                  <UiIcon name="edit" size="18px" />
                </button>
                <button type="button" class="p-1 hover:text-red-500 transition-colors" title="Delete">
                  <UiIcon name="delete" size="18px" />
                </button>
              </div>
            </template>

            <template #empty>
              <div class="py-10 text-center text-sm text-slate-500">
                <div class="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <UiIcon name="group_off" size="22px" />
                </div>
                <p class="font-semibold text-slate-700 dark:text-slate-200">{{ t('employees.list.emptyTitle') }}</p>
                <p class="mt-1 text-slate-500 dark:text-slate-400">{{ t('employees.list.emptyDescription') }}</p>
              </div>
            </template>
          </UiTable>
        </div>

        <div class="px-4 md:px-6 py-4 border-t border-primary/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div class="text-sm text-slate-500 dark:text-slate-400">
            Showing <span class="font-semibold text-slate-900 dark:text-white">{{ pageStart }}</span> to
            <span class="font-semibold text-slate-900 dark:text-white">{{ pageEnd }}</span> of
            <span class="font-semibold text-slate-900 dark:text-white">{{ filteredRows.length }}</span> employees
          </div>

          <div class="flex items-center gap-2">
            <UiButton variant="outline" icon-only :disabled="currentPage <= 1" @click="setPage(currentPage - 1)">
              <UiIcon name="chevron_left" size="20px" />
            </UiButton>

            <UiButton
              v-for="page in pageButtons"
              :key="page"
              :variant="page === currentPage ? 'primary' : 'outline'"
              @click="setPage(page)"
            >
              {{ page }}
            </UiButton>

            <UiButton variant="outline" icon-only :disabled="currentPage >= totalPages" @click="setPage(currentPage + 1)">
              <UiIcon name="chevron_right" size="20px" />
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
