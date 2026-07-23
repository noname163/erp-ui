<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import UiCheckbox from '@/components/ui/UiCheckbox.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import { dailyWorkService, type EmployeeDailyWorkListResponse } from '@/services/daily-work.service'
import { userProfileService } from '@/services/user-profile.service'
import { useI18n } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { AppRoute } from '@/types'

type SelectOption = { value: string; label: string }

type LogWorkRow = {
  id: string
  code: string
  userProfileCode: string
  employeeName: string
  workType: string
  department: string
  logDay: string
  startTime: string
  endTime: string
  otTime: number
  usedPto: boolean
  createdBy: string
  editedBy: string
  avatarUrl: string
}

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const loading = ref(false)
const loadingEmployees = ref(false)
const error = ref('')
const currentPage = ref(1)
const pageSize = 8
const totalElements = ref(0)
const totalPages = ref(1)
const isFilterOpen = ref(false)

function defaultEmployeeOption(): SelectOption {
  return { value: '', label: t('logWorkList.filters.allEmployees') }
}

const employeeOptions = ref<SelectOption[]>([defaultEmployeeOption()])
const rows = ref<LogWorkRow[]>([])

const employeeCode = ref('')
const workingDateFrom = ref('')
const workingDateTo = ref('')
const usedPto = ref(false)

const applied = ref({
  employeeCode: '',
  workingDateFrom: '',
  workingDateTo: '',
  usedPto: false,
})

const isEmployeeRole = computed(() => auth.activeRole === 'EMPLOYEE')
const currentUserProfileCode = computed(() => auth.user?.userProfileCode?.trim() ?? '')
const currentUserLabel = computed(() => auth.user?.fullName || auth.user?.email || currentUserProfileCode.value)

const headers = computed<UiTableHeader[]>(() => [
  { key: 'employee', label: t('common.field.employee'), thClass: 'min-w-[240px]' },
  { key: 'logDay', label: t('logWorkList.headers.logDay'), thClass: 'min-w-[140px]' },
  { key: 'timeRange', label: t('common.field.timeRange'), thClass: 'min-w-[130px]' },
  { key: 'otTime', label: t('common.field.otTime'), thClass: 'min-w-[120px]' },
  { key: 'usedPto', label: t('logWork.fields.usedPto'), align: 'center', thClass: 'min-w-[110px]' },
  { key: 'createdBy', label: t('common.field.createdBy'), thClass: 'min-w-[140px]' },
  { key: 'editedBy', label: t('logWorkList.headers.editedBy'), thClass: 'min-w-[140px]' },
  { key: 'actions', label: '', align: 'right', thClass: 'w-16' },
])

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsedValue = Number(value.trim())
    return Number.isFinite(parsedValue) ? parsedValue : 0
  }
  return 0
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function resolveOptionCollection(res: any) {
  const raw = (res?.content ?? res?.data ?? res?.options ?? res ?? []) as any[]
  return Array.isArray(raw) ? raw : []
}

function normalizeEmployeeOptions(raw: any[]): SelectOption[] {
  const mapped = raw
    .map((item: any) => {
      const value = String(item?.code ?? item?.userProfileCode ?? item?.id ?? '').trim()
      const name = String(item?.name ?? item?.fullName ?? item?.email ?? '').trim()
      const label = name ? `${value} - ${name}` : value
      return value ? { value, label } : null
    })
    .filter((item: SelectOption | null): item is SelectOption => Boolean(item))

  return [defaultEmployeeOption(), ...mapped]
}

function resolveCurrentEmployeeOption(raw: any[]): SelectOption | null {
  const currentCode = currentUserProfileCode.value
  const currentName = auth.user?.fullName?.trim().toLowerCase() ?? ''
  const currentEmail = auth.user?.email?.trim().toLowerCase() ?? ''

  const match = raw.find((item: any) => {
    const value = String(item?.code ?? item?.userProfileCode ?? item?.id ?? '').trim()
    const name = String(item?.name ?? item?.fullName ?? '').trim().toLowerCase()
    const email = String(item?.email ?? '').trim().toLowerCase()

    return value === currentCode || (currentName.length > 0 && name === currentName) || (currentEmail.length > 0 && email === currentEmail)
  })

  if (!match && !currentCode) return null

  const value = String(match?.code ?? match?.userProfileCode ?? match?.id ?? currentCode).trim()
  const name = String(match?.name ?? match?.fullName ?? match?.email ?? currentUserLabel.value).trim()
  if (!value) return null
  return { value, label: name ? `${value} - ${name}` : value }
}

function normalizeRow(item: EmployeeDailyWorkListResponse, index: number): LogWorkRow {
  const employeeName = String(item?.employeeName ?? item?.fullName ?? `Employee ${index + 1}`).trim()
  const code = String(item?.code ?? item?.id ?? `DW-${String(index + 1).padStart(3, '0')}`)
  return {
    id: String(item?.id ?? code),
    code,
    userProfileCode: String(item?.userProfileCode ?? item?.code ?? ''),
    employeeName,
    workType: String(item?.workType ?? '').trim(),
    department: String(item?.departmentName ?? item?.department ?? '-'),
    logDay: String(item?.logDay ?? ''),
    startTime: String(item?.startTime ?? ''),
    endTime: String(item?.endTime ?? ''),
    otTime: toNumber(item?.otTime),
    usedPto: Boolean(item?.usedPto),
    createdBy: String(item?.createdByName ?? item?.createdBy ?? 'System'),
    editedBy: String(item?.editedByName ?? item?.updatedByName ?? item?.editedBy ?? item?.updatedBy ?? '-'),
    avatarUrl: String(item?.avatarUrl ?? item?.avatar ?? ''),
  }
}

async function loadEmployeeOptions() {
  loadingEmployees.value = true

  try {
    const res = await userProfileService.options({ page: 0, size: 200, sortDir: 'ASC' })
    const raw = resolveOptionCollection(res)

    if (isEmployeeRole.value) {
      const currentOption = resolveCurrentEmployeeOption(raw)
      employeeOptions.value = currentOption ? [currentOption] : []
      employeeCode.value = currentOption?.value ?? currentUserProfileCode.value
      applied.value.employeeCode = employeeCode.value
      return
    }

    employeeOptions.value = normalizeEmployeeOptions(raw)
  } catch (e: any) {
    if (isEmployeeRole.value) {
      employeeOptions.value = currentUserProfileCode.value
        ? [{ value: currentUserProfileCode.value, label: `${currentUserProfileCode.value} - ${currentUserLabel.value}` }]
        : []
      employeeCode.value = currentUserProfileCode.value
      applied.value.employeeCode = employeeCode.value
    } else {
      employeeOptions.value = [defaultEmployeeOption()]
    }

    if (isEmployeeRole.value && !currentUserProfileCode.value) {
      error.value = t('logWork.errors.currentEmployeeUnavailable')
    } else if (!isEmployeeRole.value) {
      error.value = e?.response?.data?.message ?? ''
    }
  } finally {
    loadingEmployees.value = false
  }
}

async function loadRows() {
  if (isEmployeeRole.value && !currentUserProfileCode.value) {
    rows.value = []
    totalElements.value = 0
    totalPages.value = 1
    error.value = t('logWork.errors.currentEmployeeUnavailable')
    return
  }

  loading.value = true
  error.value = ''

  try {
    const scopedEmployeeCode = isEmployeeRole.value
      ? currentUserProfileCode.value
      : applied.value.employeeCode

    const res = await dailyWorkService.list({
      employeeCode: scopedEmployeeCode || undefined,
      startDate: applied.value.workingDateFrom || undefined,
      endDate: applied.value.workingDateTo || undefined,
      usedPto: applied.value.usedPto ? true : undefined,
      page: currentPage.value - 1,
      size: pageSize,
      sortBy: 'workingDate',
      sortDir: 'DESC',
    })

    const data = (res?.content ?? res?.data ?? []) as EmployeeDailyWorkListResponse[]
    rows.value = Array.isArray(data) ? data.map(normalizeRow) : []
    totalElements.value = Number(res?.totalElements ?? rows.value.length)
    totalPages.value = Math.max(1, Number(res?.totalPages ?? Math.ceil(totalElements.value / pageSize) ?? 1))

    if (!Array.isArray(data) || data.length === 0) {
      rows.value = []
      if (!res?.totalElements) totalElements.value = 0
    }
  } catch (e: any) {
    rows.value = []
    totalElements.value = 0
    totalPages.value = 1
    currentPage.value = 1
    error.value = e?.response?.data?.message ?? t('logWorkList.loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadEmployeeOptions()
  await loadRows()
})

function formatDate(value: string) {
  if (!value) return '-'
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(parsedDate)
}

function formatTime(value: string) {
  if (!value) return '-'
  const [hourRaw, minuteRaw = '00'] = value.split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value
  const parsedTime = new Date()
  parsedTime.setHours(hour, minute, 0, 0)
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(parsedTime)
}

function formatOtHours(value: number) {
  if (!value) return '-'
  return `${value.toFixed(1)} hrs`
}

function toggleFilters() {
  isFilterOpen.value = !isFilterOpen.value
}

async function applyFilters() {
  applied.value = {
    employeeCode: isEmployeeRole.value ? currentUserProfileCode.value : employeeCode.value,
    workingDateFrom: workingDateFrom.value,
    workingDateTo: workingDateTo.value,
    usedPto: usedPto.value,
  }
  currentPage.value = 1
  await loadRows()
}

async function resetFilters() {
  employeeCode.value = isEmployeeRole.value ? currentUserProfileCode.value : ''
  workingDateFrom.value = ''
  workingDateTo.value = ''
  usedPto.value = false
  await applyFilters()
}

async function setPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  await loadRows()
}

const pageButtons = computed<(number | '...')[]>(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 3) return [1, 2, 3, '...', total]
  if (current >= total - 2) return [1, '...', total - 2, total - 1, total]
  return [1, '...', current, '...', total]
})

const pageStart = computed(() => (totalElements.value === 0 ? 0 : (currentPage.value - 1) * pageSize + 1))
const pageEnd = computed(() => Math.min(currentPage.value * pageSize, totalElements.value))

function viewLog(code: string) {
  router.push({
    path: AppRoute.LOG_WORK,
    query: { code },
  })
}

function exportCsv() {
  const header = ['code', 'employeeCode', 'employeeName', 'department', 'logDay', 'startTime', 'endTime', 'otTime', 'usedPto', 'createdBy', 'editedBy']
  const body = rows.value.map((row) => [
    row.code,
    row.userProfileCode,
    row.employeeName,
    row.department,
    row.logDay,
    row.startTime,
    row.endTime,
    row.otTime,
    row.usedPto ? t('common.status.yes') : t('common.status.no'),
    row.createdBy,
    row.editedBy,
  ])

  const csv = [header, ...body]
    .map((cols) => cols.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'working-logs.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{{ t('navigation.workingLogs') }}</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {{ t('logWorkList.subtitle') }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <UiButton variant="outline" leadingIcon="filter_alt" @click="toggleFilters">
            {{ isFilterOpen ? t('logWorkList.actions.hideFilters') : t('logWorkList.actions.showFilters') }}
          </UiButton>
          <UiButton variant="outline" leadingIcon="add" @click="router.push(AppRoute.LOG_WORK)">{{ t('logWorkList.actions.addLog') }}</UiButton>
          <UiButton variant="primary" leadingIcon="download" @click="exportCsv">{{ t('logWorkList.actions.exportLogs') }}</UiButton>
        </div>
      </div>

      <UiCard v-if="isFilterOpen" class="overflow-visible relative z-10">
        <UiCardBody class="overflow-visible">
          <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_auto] gap-4 items-end">
            <UiSelect
              v-model="employeeCode"
              :label="t('common.field.employeeCode')"
              :options="employeeOptions"
              :disabled="loadingEmployees || isEmployeeRole"
            />

            <div>
              <p class="ui-label">{{ t('common.field.dateRange') }}</p>
              <div class="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <UiInput v-model="workingDateFrom" type="date" />
                <span class="text-slate-400 text-sm">{{ t('logWorkList.filters.to') }}</span>
                <UiInput v-model="workingDateTo" type="date" />
              </div>
            </div>

            <div class="pb-2">
              <UiCheckbox v-model="usedPto" :label="t('logWorkList.filters.isPto')" />
            </div>

            <div class="flex items-center gap-2 pb-2">
              <button
                type="button"
                class="p-2 text-slate-400 hover:text-primary transition-colors"
                :title="t('logWorkList.actions.refresh')"
                @click="loadRows"
              >
                <UiIcon name="refresh" size="20" />
              </button>
              <UiButton variant="primary" leadingIcon="search" @click="applyFilters">{{ t('common.action.apply') }}</UiButton>
            </div>
          </div>
        </UiCardBody>
      </UiCard>

      <UiCard>
        <div class="p-4 md:p-6">
          <div v-if="error" class="text-sm text-amber-600 dark:text-amber-400 mb-4">{{ error }}</div>
          <div v-if="loading" class="text-sm text-slate-500">{{ t('logWorkList.loading') }}</div>

          <UiTable
            v-else
            :headers="headers"
            :rows="rows"
            row-key="id"
            table-class="min-w-[1100px]"
            row-class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
            th-base-class="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"
            td-base-class="px-4 md:px-6 py-4 whitespace-nowrap"
            :empty-text="t('logWorkList.empty')"
          >
            <template #cell-employee="{ row }">
              <div class="flex items-center gap-3">
                <div
                  v-if="row.avatarUrl"
                  class="size-9 rounded-full bg-cover bg-center bg-slate-100"
                  :style="{ backgroundImage: `url('${row.avatarUrl}')` }"
                />
                <div
                  v-else
                  class="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  {{ initials(row.employeeName) }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ row.employeeName }}</p>
                    <span
                      v-if="row.workType"
                      class="text-[11px] font-medium text-slate-500 dark:text-slate-400"
                    >
                      {{ row.workType }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">
                    {{ row.department || row.userProfileCode || '-' }}
                  </p>
                </div>
              </div>
            </template>

            <template #cell-logDay="{ row }">
              <span class="text-sm font-medium text-slate-600 dark:text-slate-300">{{ formatDate(row.logDay) }}</span>
            </template>

            <template #cell-timeRange="{ row }">
              <div class="flex flex-col">
                <span class="text-sm font-medium text-slate-900 dark:text-white">{{ formatTime(row.startTime) }}</span>
                <span class="text-xs text-slate-400">{{ formatTime(row.endTime) }}</span>
              </div>
            </template>

            <template #cell-otTime="{ row }">
              <span
                v-if="row.otTime > 0"
                class="px-2 py-1 text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              >
                {{ formatOtHours(row.otTime) }}
              </span>
              <span v-else class="text-xs text-slate-400">-</span>
            </template>

            <template #cell-usedPto="{ row }">
              <div class="flex justify-center">
                <span
                  class="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded"
                  :class="
                    row.usedPto
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  "
                >
                  {{ row.usedPto ? t('common.status.yes') : t('common.status.no') }}
                </span>
              </div>
            </template>

            <template #cell-createdBy="{ row }">
              <div class="flex items-center gap-2">
                <div class="size-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                  {{ initials(row.createdBy || 'System') || 'SY' }}
                </div>
                <span class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ row.createdBy }}</span>
              </div>
            </template>

            <template #cell-editedBy="{ row }">
              <div v-if="row.editedBy && row.editedBy !== '-'" class="flex items-center gap-2">
                <div class="size-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                  {{ initials(row.editedBy) }}
                </div>
                <span class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ row.editedBy }}</span>
              </div>
              <div v-else class="flex items-center gap-2 opacity-50">
                <span class="text-xs">-</span>
              </div>
            </template>

            <template #cell-actions="{ row }">
              <div class="flex justify-end">
                <button type="button" class="p-1 hover:text-primary transition-colors" @click="viewLog(row.code)">
                  <UiIcon name="visibility" size="18" />
                </button>
              </div>
            </template>
          </UiTable>
        </div>

        <div class="px-4 md:px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ t('logWorkList.showing', { start: pageStart, end: pageEnd, total: totalElements }) }}
          </p>

          <div class="flex items-center gap-2">
            <UiButton variant="outline" icon-only :disabled="currentPage <= 1" @click="setPage(currentPage - 1)">
              <UiIcon name="chevron_left" size="18" />
            </UiButton>

            <template v-for="(page, index) in pageButtons" :key="`${page}-${index}`">
              <span v-if="page === '...'" class="px-1 text-slate-400">...</span>
              <UiButton v-else :variant="page === currentPage ? 'primary' : 'outline'" icon-only @click="setPage(page)">
                {{ page }}
              </UiButton>
            </template>

            <UiButton variant="outline" icon-only :disabled="currentPage >= totalPages" @click="setPage(currentPage + 1)">
              <UiIcon name="chevron_right" size="18" />
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>
  </AppLayout>
</template>
