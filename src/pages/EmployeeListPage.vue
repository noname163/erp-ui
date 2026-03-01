<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { AppRoute } from '@/types'
import { employeeService } from '@/services/employee.service'

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

const query = ref('')
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const pageSize = 10

const seedRows: EmployeeRow[] = [
  {
    id: '100248572',
    code: 'EMP-90210',
    name: 'Julian Casablancas',
    email: 'julian.c@monogram.com',
    age: 32,
    department: 'Engineering',
    skills: ['React', 'GraphQL'],
    status: 'ACTIVE',
    createdAt: 'Oct 12, 2023',
    createdBy: 'System Admin',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDkFjjFcsgzkNNdA5kHtL74RujBGhSMGlEDLB0zeQboX0gYJ2AuEr88OKji1O2peAB__lNWH0bUZ688q6yb1bvRZcut3VqQZWytJ1DHxqUs6Pk9dZlUMEM-0-FSzHTY8EQkoKTN31Uy_7cXqHbADKNWva4Tdq6OYS5Edk-5E8Uo6KkuUlAYuFGhtwHciirY0EwwcHhpmauSolN9Dif7A4ZCsR55W6olb-oZMMf58YPzclQVNsB7da9exMCBKuzEPBogtdmK9pgqDiXP',
  },
  {
    id: '100248588',
    code: 'EMP-90211',
    name: 'Sarah Jenkins',
    email: 's.jenkins@monogram.com',
    age: 28,
    department: 'Marketing',
    skills: ['SEO', 'Copywriting'],
    status: 'ON_LEAVE',
    createdAt: 'Nov 05, 2023',
    createdBy: 'Alex Rivera',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAFenqHvzCnx-sJjF8k_ciLFq6eegi3x_UYP2d_NU0wzBonzVzKfSagIY_rPlfEYojxEC20bu_3Il_EFLwgBLQmScR-noT8cG2u9qqrxZ3GjPBMbPKiDs6XcXWg6PtSpAnrw3I2zr6sqjJthqzlg52ZlHOJog1het02cKrxUwWYgJywkzlLSmKbP_TAo6GU4_xxBAI90uvmaNDeX_cgxFDF8tIChjlV-esMWEOFb0arQCaKmrr5yisPNyDm9xXSN_RhR0wKUCtJuVpM',
  },
  {
    id: '100248591',
    code: 'EMP-90212',
    name: 'Robert Downey',
    email: 'r.downey@monogram.com',
    age: 45,
    department: 'Finance',
    skills: ['Auditing'],
    status: 'ACTIVE',
    createdAt: 'Dec 01, 2023',
    createdBy: 'System Admin',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA4Tl-sadOvUlhtypDxlCBBCjC0z6zYZIMXDNzKAb_g9kD6kyAse1gG2Uo6F4fu-FvkqEuzCt0lMhyb5cxOAc_D85jclFPKpIwvHKkYSO_4uQKS-xAS2vJzlOC3ZhHsM4brwtQdFnxEEK8PPWnig2RpJj-H1c8ihr2kZUWg8Srcb1L2f46m4_T89hY9JxUI4gpMMITHxRktGYwXStyPaZQxVpmil3ts7C45vpuJrA_nR_iuR7pP2A_VO90bwjYCNmpO98FrKKajeJy9',
  },
  {
    id: '100248602',
    code: 'EMP-90213',
    name: 'Lena Meyer',
    email: 'lena.m@monogram.com',
    age: 31,
    department: 'Design',
    skills: ['Figma', 'UI/UX'],
    status: 'INACTIVE',
    createdAt: 'Jan 14, 2024',
    createdBy: 'Alex Rivera',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuADN4KartDeUB6Jt_lKrWHfDWgttzjtvJAHkpWcn8M67vxn2kkx77yjQoIgSIC_ZILX3vez9dCITeuNYLfYxftutC3HOoZngukN37qTPIGehLkZoeXB1KR4UBlfXYyd5RsrrlRt1KVlNcD-d1vBRLF_wLInSmjfMJKEAfVJlFjhKx7VBEQ-DmdIIGhmXZcZfKiIgXZMhMUjcAKP4J1b3nUsmEjfN2HXWuo-RJs7Hp4cOQoqLwYNr-rwyi8iE4StcBKK46-CeCv1p6Bc',
  },
]

const rows = ref<EmployeeRow[]>([...seedRows])

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

function normalizeRow(payload: unknown, index: number): EmployeeRow {
  if (!payload || typeof payload !== 'object') return seedRows[index % seedRows.length]

  const item = payload as Record<string, unknown>
  const name = getString(item, ['name', 'fullName'], '').trim()
  const firstName = getString(item, ['firstName'])
  const lastName = getString(item, ['lastName'])

  return {
    id: getString(item, ['id', 'employeeId', 'userCode'], String(index + 1)),
    code: getString(item, ['code', 'employeeCode'], `EMP-${String(index + 1).padStart(5, '0')}`),
    name: name || [firstName, lastName].filter(Boolean).join(' ') || `Employee ${index + 1}`,
    email: getString(item, ['email'], 'n/a'),
    age: getNumber(item, ['age']),
    department: getString(item, ['departmentName', 'department'], 'Unknown'),
    skills: getSkills(item),
    status: normalizeStatus(getString(item, ['status'], 'ACTIVE')),
    createdAt: getString(item, ['createdAt', 'createdDate'], '-'),
    createdBy: getString(item, ['createdBy'], '-'),
    avatarUrl: getString(item, ['avatarUrl', 'avatar'], ''),
  }
}

async function loadEmployees() {
  loading.value = true
  error.value = ''
  try {
    const res = await employeeService.list({ page: 0, size: 100 })
    const data = (res?.content ?? res?.data ?? res?.employees ?? []) as unknown[]
    if (Array.isArray(data) && data.length > 0) {
      rows.value = data.map(normalizeRow)
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Unable to load employees from API. Showing sample data.'
  } finally {
    loading.value = false
  }
}

onMounted(loadEmployees)

const filteredRows = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return rows.value

  return rows.value.filter((row) => {
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

    return searchable.includes(keyword)
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
    .filter((p) => p >= 1 && p <= max)
    .sort((a, b) => a - b)
})

watch([query, totalPages], () => {
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
    .map((cols) => cols.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'employees.csv'
  a.click()
  URL.revokeObjectURL(url)
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
          <UiButton variant="outline" leadingIcon="filter_list">Filter</UiButton>
          <UiButton variant="outline" leadingIcon="download" @click="exportCsv">Export</UiButton>
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
                ></div>
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
              <div class="py-8 text-sm text-slate-500">No employees found.</div>
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
