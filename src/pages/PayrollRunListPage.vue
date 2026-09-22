<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiTextarea from '@/components/ui/UiTextarea.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import { useI18n } from '@/i18n'
import { payrollRunService, type PayrollRerunMode, type PayrollRunStatus } from '@/services/payroll-run.service'
import { AppRoute } from '@/types'

type StatusFilter = 'ALL' | PayrollRunStatus

type PayrollRunRow = {
  id: string
  code: string
  status: PayrollRunStatus
  runAt: string | null
  closeAt: string | null
  runBy: string
  updatedBy: string
}

const router = useRouter()
const { t } = useI18n()

const pageSize = 8

const loading = ref(false)
const runningPayroll = ref(false)
const rerunningPayroll = ref(false)
const loadError = ref('')
const actionMessage = ref('')
const actionTone = ref<'success' | 'error'>('success')
const page = ref(1)

const search = ref('')
const status = ref<StatusFilter>('ALL')
const runAtFrom = ref('')
const runAtTo = ref('')
const closeAtFrom = ref('')
const closeAtTo = ref('')
const selectedRunMonthYear = ref(getCurrentMonthYear())

const appliedFilters = ref({
  search: '',
  status: 'ALL' as StatusFilter,
  runAtFrom: '',
  runAtTo: '',
  closeAtFrom: '',
  closeAtTo: '',
})

const rows = ref<PayrollRunRow[]>([])
const rerunModalOpen = ref(false)
const rerunTarget = ref<PayrollRunRow | null>(null)
const rerunReason = ref('')
const rerunMode = ref<PayrollRerunMode>('FULL_RUN')
const rerunEmployeeCodesText = ref('')
const rerunDryRun = ref(true)
const rerunResult = ref<any | null>(null)
const rerunError = ref('')

const headers = computed<UiTableHeader[]>(() => [
  { key: 'status', label: t('payrollRuns.headers.status'), thClass: 'min-w-[150px]' },
  { key: 'runAt', label: t('payrollRuns.headers.runAt'), thClass: 'min-w-[170px]' },
  { key: 'closeAt', label: t('payrollRuns.headers.closeAt'), thClass: 'min-w-[170px]' },
  { key: 'runBy', label: t('payrollRuns.headers.runBy'), thClass: 'min-w-[180px]' },
  { key: 'updatedBy', label: t('payrollRuns.headers.updatedBy'), thClass: 'min-w-[180px]' },
  { key: 'actions', label: t('payrollRuns.headers.actions'), align: 'right', thClass: 'min-w-[220px]' },
])

const statusOptions = computed(() => [
  { value: 'ALL', label: t('payrollRuns.statusOptions.all') },
  { value: 'OPEN', label: t('payrollRuns.statusOptions.open') },
  { value: 'CALCULATED', label: t('payrollRuns.statusOptions.calculated') },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PARTIAL_FAILED', label: 'Partial failed' },
  { value: 'RERUNNING', label: 'Re-running' },
  { value: 'CLOSED', label: t('payrollRuns.statusOptions.close') },
])

const rerunModeOptions = [
  { value: 'FULL_RUN', label: 'Full run' },
  { value: 'SELECTED_EMPLOYEES', label: 'Selected employees' },
  { value: 'FAILED_ONLY', label: 'Failed only' },
]

const filteredRows = computed(() => {
  const query = appliedFilters.value.search.trim().toLowerCase()

  return rows.value.filter((row) => {
    if (appliedFilters.value.status !== 'ALL' && row.status !== appliedFilters.value.status) {
      return false
    }

    if (query) {
      const haystack = [row.id, row.code, row.status, row.runBy, row.updatedBy]
        .join(' ')
        .toLowerCase()

      if (!haystack.includes(query)) {
        return false
      }
    }

    if (!isWithinDateRange(row.runAt, appliedFilters.value.runAtFrom, appliedFilters.value.runAtTo)) {
      return false
    }

    if (!isWithinDateRange(row.closeAt, appliedFilters.value.closeAtFrom, appliedFilters.value.closeAtTo)) {
      return false
    }

    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredRows.value.slice(start, start + pageSize)
})

const pageStart = computed(() => (filteredRows.value.length === 0 ? 0 : (page.value - 1) * pageSize + 1))
const pageEnd = computed(() => Math.min(page.value * pageSize, filteredRows.value.length))

const pageButtons = computed<(number | '...')[]>(() => {
  const total = totalPages.value
  const current = page.value

  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 3) return [1, 2, 3, '...', total]
  if (current >= total - 2) return [1, '...', total - 2, total - 1, total]
  return [1, '...', current, '...', total]
})

const totalRuns = computed(() => filteredRows.value.length)
const runningRuns = computed(() => filteredRows.value.filter((row) => row.status === 'OPEN').length)
const completedRuns = computed(() => filteredRows.value.filter((row) => row.status === 'CLOSED').length)
const failedRuns = computed(() => filteredRows.value.filter((row) => row.status === 'FAILED').length)
const selectedRunDate = computed(() => toRunDateValue(selectedRunMonthYear.value))
const canRunPayroll = computed(() => !loading.value && !runningPayroll.value && Boolean(selectedRunDate.value))
const rerunEmployeeCodes = computed(() => rerunEmployeeCodesText.value
  .split(/[\s,]+/)
  .map((value) => value.trim())
  .filter(Boolean))

watch(filteredRows, () => {
  if (page.value > totalPages.value) {
    page.value = totalPages.value
  }
}, { immediate: true })

onMounted(() => {
  void loadPayrollRuns()
})

async function loadPayrollRuns() {
  loading.value = true
  loadError.value = ''

  try {
    const response = await payrollRunService.list()
    console.log("Response ", response)
    const items = normalizeCollection(response)
    rows.value = items
      .map((item, index) => normalizeRow(item, index))
      .sort((left, right) => (toTimestamp(right.runAt) ?? 0) - (toTimestamp(left.runAt) ?? 0))
  } catch (error: any) {
    rows.value = []
    loadError.value = error?.response?.data?.message ?? t('payrollRuns.messages.loadFailed')
  } finally {
    loading.value = false
  }
}

async function refreshPayrollRuns() {
  actionMessage.value = ''
  await loadPayrollRuns()
}

async function runPayroll() {
  if (!selectedRunDate.value) {
    actionTone.value = 'error'
    actionMessage.value = t('payrollRuns.messages.selectMonth')
    return
  }

  runningPayroll.value = true
  loadError.value = ''
  actionMessage.value = ''

  try {
    const response = await payrollRunService.run(selectedRunDate.value)
    actionTone.value = 'success'
    actionMessage.value = resolveActionMessage(response?.data, t('payrollRuns.messages.runStarted'))
    await loadPayrollRuns()
  } catch (error: any) {
    actionTone.value = 'error'
    actionMessage.value = error?.response?.data?.message ?? t('payrollRuns.messages.startFailed')
  } finally {
    runningPayroll.value = false
  }
}

function applyFilters() {
  appliedFilters.value = {
    search: search.value.trim(),
    status: status.value,
    runAtFrom: runAtFrom.value,
    runAtTo: runAtTo.value,
    closeAtFrom: closeAtFrom.value,
    closeAtTo: closeAtTo.value,
  }
  page.value = 1
}

function resetFilters() {
  search.value = ''
  status.value = 'ALL'
  runAtFrom.value = ''
  runAtTo.value = ''
  closeAtFrom.value = ''
  closeAtTo.value = ''
  applyFilters()
}

function setPage(next: number) {
  if (next < 1 || next > totalPages.value) return
  page.value = next
}

function viewPayrollRunDetails(row: PayrollRunRow) {
  const payrollRunCode = row.code.trim() || row.id.trim()

  void router.push({
    path: AppRoute.PAYROLL_RESULTS,
    query: payrollRunCode ? { payrollRunCode } : undefined,
  })
}

function openRerunModal(row: PayrollRunRow) {
  rerunTarget.value = row
  rerunReason.value = ''
  rerunMode.value = 'FULL_RUN'
  rerunEmployeeCodesText.value = ''
  rerunDryRun.value = true
  rerunResult.value = null
  rerunError.value = ''
  rerunModalOpen.value = true
}

function closeRerunModal() {
  if (rerunningPayroll.value) return
  rerunModalOpen.value = false
}

async function submitRerun() {
  if (!rerunTarget.value) return
  if (!rerunReason.value.trim()) {
    rerunError.value = 'Reason is required'
    return
  }
  if (rerunMode.value === 'SELECTED_EMPLOYEES' && rerunEmployeeCodes.value.length === 0) {
    rerunError.value = 'Enter at least one employee code'
    return
  }

  rerunningPayroll.value = true
  rerunError.value = ''
  rerunResult.value = null
  try {
    const response = await payrollRunService.rerun(rerunTarget.value.code || rerunTarget.value.id, {
      reason: rerunReason.value.trim(),
      mode: rerunMode.value,
      employeeCodes: rerunMode.value === 'SELECTED_EMPLOYEES' ? rerunEmployeeCodes.value : undefined,
      dryRun: rerunDryRun.value,
    })
    rerunResult.value = response
    actionTone.value = 'success'
    actionMessage.value = rerunDryRun.value ? 'Payroll re-run preview calculated' : 'Payroll re-run completed'
    if (!rerunDryRun.value) {
      await loadPayrollRuns()
    }
  } catch (error: any) {
    rerunError.value = error?.response?.data?.message ?? 'Payroll re-run failed'
  } finally {
    rerunningPayroll.value = false
  }
}

function statusVariant(currentStatus: PayrollRunStatus) {
  if (currentStatus === 'CLOSED' || currentStatus === 'COMPLETED') return 'success' as const
  if (currentStatus === 'FAILED' || currentStatus === 'PARTIAL_FAILED') return 'error' as const
  return 'info' as const
}

function statusIcon(currentStatus: PayrollRunStatus) {
  if (currentStatus === 'CLOSED' || currentStatus === 'COMPLETED') return 'check_circle'
  if (currentStatus === 'FAILED' || currentStatus === 'PARTIAL_FAILED') return 'error'
  return 'autorenew'
}

function statusLabel(currentStatus: PayrollRunStatus) {
  if (currentStatus === 'OPEN') return t('payrollRuns.statusLabels.running')
  if (currentStatus === 'CALCULATED') return t('payrollRuns.statusLabels.calculated')
  if (currentStatus === 'COMPLETED') return 'Completed'
  if (currentStatus === 'PARTIAL_FAILED') return 'Partial failed'
  if (currentStatus === 'RERUNNING') return 'Re-running'
  if (currentStatus === 'PROCESSING') return 'Processing'
  if (currentStatus === 'FAILED') return t('payrollRuns.statusLabels.failed')
  return t('payrollRuns.statusLabels.open')
}

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

function formatTime(value: string | null) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed)
}

function closeAtLabel(row: PayrollRunRow) {
  if (row.closeAt) return formatDate(row.closeAt)
  if (row.status === 'OPEN') return t('payrollRuns.messages.inProgress')
  if (row.status === 'CALCULATED') return t('payrollRuns.messages.notClosed')
  return t('payrollRuns.messages.unavailable')
}

function closeAtTimeLabel(row: PayrollRunRow) {
  if (!row.closeAt) return ''
  return formatTime(row.closeAt)
}

function normalizeCollection(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => item !== null)
  }

  const record = asRecord(payload)
  if (!record) return []

  const directCollection = firstDefined(
    record.content,
    record.data,
    record.items,
    record.results,
    record.rows,
    record.records,
  )

  if (Array.isArray(directCollection)) {
    return directCollection
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => item !== null)
  }

  if (directCollection && typeof directCollection === 'object') {
    return normalizeCollection(directCollection)
  }

  return []
}

function normalizeRow(item: Record<string, unknown>, index: number): PayrollRunRow {
  const statusValue = normalizeStatus(
    firstDefined(item.status, item.runStatus, item.payrollRunStatus, item.state),
  )

  return {
    id: toDisplayString(firstDefined(item.id, item.code, item.payrollRunCode, item.runCode), `PAYRUN-${index + 1}`),
    code: toDisplayString(firstDefined(item.code, item.payrollRunCode, item.runCode), ''),
    status: statusValue,
    runAt: normalizeDateValue(firstDefined(item.runAt, item.startedAt, item.createdAt, item.runDate)),
    closeAt: normalizeDateValue(firstDefined(item.closeAt, item.closedAt, item.completedAt, item.finishedAt, item.updatedAt)),
    runBy: normalizePerson(firstDefined(item.runBy, item.createdBy, item.executedBy, item.runByName, item.createdByName)),
    updatedBy: normalizePerson(firstDefined(item.updatedBy, item.lastUpdatedBy, item.closedBy, item.updatedByName, item.modifiedBy)),
  }
}

function normalizeStatus(value: unknown): PayrollRunStatus {
  const token = toDisplayString(value, 'DRAFT')
    .toUpperCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (token.includes('CALCULATED')) return 'CALCULATED'
  if (token.includes('PARTIAL_FAILED')) return 'PARTIAL_FAILED'
  if (token.includes('RERUNNING')) return 'RERUNNING'
  if (token.includes('PROCESSING')) return 'PROCESSING'
  if (token.includes('COMPLETED')) return 'COMPLETED'
  if (token.includes('OPEN') || token.includes('DONE') || token.includes('SUCCESS')) return 'OPEN'
  if (token.includes('FAIL') || token.includes('ERROR')) return 'FAILED'
  return 'OPEN'
}

function normalizeDateValue(value: unknown) {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized || null
  }

  if (typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }

  return null
}

function toDateOnlyValue(value: string | null) {
  if (!value) return ''
  if (/^\d{4}-\d{2}$/.test(value)) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match?.[1]) return match[1]

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

function getCurrentMonthYear() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function toRunDateValue(monthYear: string) {
  const normalized = monthYear.trim()
  if (!/^\d{4}-\d{2}$/.test(normalized)) return ''
  return normalized
}

function normalizePerson(value: unknown, fallback = 'System') {
  if (typeof value === 'string' || typeof value === 'number') {
    return toDisplayString(value, fallback)
  }

  const record = asRecord(value)
  if (!record) return fallback

  return toDisplayString(
    firstDefined(record.fullName, record.name, record.displayName, record.email, record.username, record.code),
    fallback,
  )
}

function resolveActionMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload.trim()) return payload.trim()

  const record = asRecord(payload)
  if (!record) return fallback

  return toDisplayString(firstDefined(record.message, record.detail, record.status), fallback)
}

function toDisplayString(value: unknown, fallback = '-') {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized || fallback
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return fallback
}

function firstDefined(...values: unknown[]) {
  return values.find((value) => {
    if (value === undefined || value === null) return false
    if (typeof value === 'string') return value.trim().length > 0
    return true
  })
}

function asRecord(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

function toTimestamp(value: string | null) {
  if (!value) return null

  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

function isWithinDateRange(value: string | null, from: string, to: string) {
  if (!from && !to) return true
  if (!value) return false

  const timestamp = toTimestamp(value)
  if (timestamp === null) return false

  if (from) {
    const fromTimestamp = new Date(`${from}T00:00:00`).getTime()
    if (!Number.isNaN(fromTimestamp) && timestamp < fromTimestamp) {
      return false
    }
  }

  if (to) {
    const toTimestampValue = new Date(`${to}T23:59:59.999`).getTime()
    if (!Number.isNaN(toTimestampValue) && timestamp > toTimestampValue) {
      return false
    }
  }

  return true
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <UiCard class="overflow-hidden border-0 shadow-[0_24px_80px_rgba(19,91,236,0.18)]">
        <div class="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#135bec_55%,#e0efff_120%)] px-6 py-8 md:px-8">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(191,219,254,0.36),transparent_28%)]"></div>

          <div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-2xl space-y-3 text-white">
              <p class="text-xs font-bold uppercase tracking-[0.35em] text-blue-100/90">{{ t('payrollRuns.eyebrow') }}</p>
              <div class="space-y-2">
                <h1 class="text-3xl font-black tracking-[-0.03em] md:text-4xl">{{ t('payrollRuns.title') }}</h1>
                <p class="max-w-xl text-sm text-blue-50/90 md:text-base">
                  {{ t('payrollRuns.subtitle') }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-end gap-3">
              <div class="w-full sm:w-[190px]">
                <p class="pb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-blue-100/90">{{ t('payrollRuns.fields.runMonth') }}</p>
                <UiInput
                  v-model="selectedRunMonthYear"
                  type="month"
                  :disabled="loading || runningPayroll"
                />
              </div>
              <UiButton
                variant="outline"
                leading-icon="refresh"
                :disabled="loading || runningPayroll"
                @click="refreshPayrollRuns"
              >
                {{ t('common.action.refresh') }}
              </UiButton>
              <UiButton
                leading-icon="play_arrow"
                :disabled="!canRunPayroll"
                @click="runPayroll"
              >
                {{ runningPayroll ? t('payrollRuns.actions.runningPayroll') : t('payrollRuns.actions.runPayroll') }}
              </UiButton>
            </div>
          </div>
        </div>
      </UiCard>

      <div
        v-if="actionMessage"
        class="rounded-xl border px-4 py-3 text-sm font-medium"
        :class="actionTone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-rose-200 bg-rose-50 text-rose-700'"
      >
        {{ actionMessage }}
      </div>

      <div v-if="loadError" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        {{ loadError }}
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UiCard>
          <UiCardBody>
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('payrollRuns.stats.totalPayruns') }}</p>
                <p class="mt-2 text-3xl font-black text-slate-900 dark:text-white">{{ totalRuns }}</p>
              </div>
              <div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UiIcon name="receipt_long" />
              </div>
            </div>
          </UiCardBody>
        </UiCard>

        <UiCard>
          <UiCardBody>
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('payrollRuns.stats.runningNow') }}</p>
                <p class="mt-2 text-3xl font-black text-slate-900 dark:text-white">{{ runningRuns }}</p>
              </div>
              <div class="flex size-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                <UiIcon name="autorenew" />
              </div>
            </div>
          </UiCardBody>
        </UiCard>

        <UiCard>
          <UiCardBody>
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('payrollRuns.stats.completed') }}</p>
                <p class="mt-2 text-3xl font-black text-slate-900 dark:text-white">{{ completedRuns }}</p>
              </div>
              <div class="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <UiIcon name="check_circle" />
              </div>
            </div>
          </UiCardBody>
        </UiCard>

        <UiCard>
          <UiCardBody>
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('payrollRuns.stats.failed') }}</p>
                <p class="mt-2 text-3xl font-black text-slate-900 dark:text-white">{{ failedRuns }}</p>
              </div>
              <div class="flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
                <UiIcon name="error" />
              </div>
            </div>
          </UiCardBody>
        </UiCard>
      </div>

      <UiCard>
        <UiCardBody>
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-end">
            <div class="xl:col-span-4">
              <UiInput
                v-model="search"
                :label="t('payrollRuns.fields.searchPayruns')"
                :placeholder="t('payrollRuns.fields.searchPlaceholder')"
                leading-icon="search"
                @keyup.enter="applyFilters"
              />
            </div>

            <div class="xl:col-span-2">
              <UiSelect v-model="status" :label="t('payrollRuns.headers.status')" :options="statusOptions" />
            </div>

            <div class="xl:col-span-3">
              <p class="ui-label">{{ t('payrollRuns.fields.runAtRange') }}</p>
              <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <UiInput v-model="runAtFrom" type="date" />
                <span class="text-sm text-slate-400">{{ t('logWorkList.filters.to') }}</span>
                <UiInput v-model="runAtTo" type="date" />
              </div>
            </div>

            <div class="xl:col-span-3">
              <p class="ui-label">{{ t('payrollRuns.fields.closeAtRange') }}</p>
              <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <UiInput v-model="closeAtFrom" type="date" />
                <span class="text-sm text-slate-400">{{ t('logWorkList.filters.to') }}</span>
                <UiInput v-model="closeAtTo" type="date" />
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap justify-end gap-2">
            <UiButton variant="outline" @click="resetFilters">{{ t('payrollRuns.actions.resetFilters') }}</UiButton>
            <UiButton leading-icon="filter_list" @click="applyFilters">{{ t('payrollRuns.actions.applyFilters') }}</UiButton>
          </div>
        </UiCardBody>
      </UiCard>

      <UiCard>
        <div class="p-4 md:p-6">
          <div v-if="loading" class="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-950/60">
            {{ t('payrollRuns.messages.loading') }}
          </div>

          <UiTable
            v-else
            :headers="headers"
            :rows="pagedRows"
            row-key="id"
            table-class="min-w-[1020px]"
            row-class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            th-base-class="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
            td-base-class="px-4 md:px-6 py-4 text-sm"
            :empty-text="t('payrollRuns.messages.empty')"
          >
            <template #cell-status="{ row }">
              <div class="space-y-2">
                <span
                  v-if="row.status === 'DRAFT'"
                  class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  <UiIcon name="schedule" size="14" />
                  {{ statusLabel(row.status) }}
                </span>
                <UiBadge v-else :variant="statusVariant(row.status)" :icon="statusIcon(row.status)">
                  {{ statusLabel(row.status) }}
                </UiBadge>
                <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  {{ row.code || row.id }}
                </p>
              </div>
            </template>

            <template #cell-runAt="{ row }">
              <div v-if="row.runAt" class="space-y-1">
                <p class="font-semibold text-slate-900 dark:text-white">{{ formatDate(row.runAt) }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ formatTime(row.runAt) }}</p>
              </div>
              <p v-else class="text-sm text-slate-500 dark:text-slate-400">{{ t('payrollRuns.messages.notStarted') }}</p>
            </template>

            <template #cell-closeAt="{ row }">
              <div v-if="row.closeAt" class="space-y-1">
                <p class="font-semibold text-slate-900 dark:text-white">{{ closeAtLabel(row) }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ closeAtTimeLabel(row) }}</p>
              </div>
              <p
                v-else
                :class="row.status === 'RUNNING'
                  ? 'text-sm italic text-sky-600 dark:text-sky-400'
                  : 'text-sm text-slate-500 dark:text-slate-400'"
              >
                {{ closeAtLabel(row) }}
              </p>
            </template>

            <template #cell-runBy="{ row }">
              <div class="flex items-center gap-3">
                <div class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {{ row.runBy.slice(0, 1).toUpperCase() }}
                </div>
                <span class="font-semibold text-slate-900 dark:text-white">{{ row.runBy }}</span>
              </div>
            </template>

            <template #cell-updatedBy="{ row }">
              <div class="flex items-center gap-3">
                <div class="flex size-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {{ row.updatedBy.slice(0, 1).toUpperCase() }}
                </div>
                <span class="font-semibold text-slate-900 dark:text-white">{{ row.updatedBy }}</span>
              </div>
            </template>

            <template #cell-actions="{ row }">
              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-primary/15 p-2 text-slate-500 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  :title="t('payrollRuns.messages.refreshTitle')"
                  :disabled="loading || runningPayroll"
                  @click="refreshPayrollRuns"
                >
                  <UiIcon name="refresh" size="18" />
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg border border-primary/15 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  :title="t('payrollRuns.messages.viewTitle')"
                  @click="viewPayrollRunDetails(row)"
                >
                  <UiIcon name="visibility" size="18" />
                  <span>{{ t('payrollRuns.actions.viewDetail') }}</span>
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg border border-primary/15 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  title="Re-run payroll"
                  :disabled="loading || runningPayroll || row.status === 'CLOSED' || row.status === 'PROCESSING' || row.status === 'RERUNNING'"
                  @click="openRerunModal(row)"
                >
                  <UiIcon name="restart_alt" size="18" />
                  <span>Re-run</span>
                </button>
              </div>
            </template>

            <template #empty>
              <div class="flex flex-col items-center gap-3 px-4 py-8 text-center">
                <div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UiIcon name="receipt_long" />
                </div>
                <div class="space-y-1">
                  <p class="font-semibold text-slate-900 dark:text-white">{{ t('payrollRuns.messages.emptyTitle') }}</p>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    {{ t('payrollRuns.messages.emptyDescription') }}
                  </p>
                </div>
                <div class="flex flex-wrap justify-center gap-2">
                  <UiButton variant="outline" @click="resetFilters">{{ t('payrollRuns.actions.clearFilters') }}</UiButton>
                  <UiButton leading-icon="play_arrow" :disabled="!canRunPayroll" @click="runPayroll">{{ t('payrollRuns.actions.runPayroll') }}</UiButton>
                </div>
              </div>
            </template>
          </UiTable>
        </div>

        <div class="flex flex-col gap-3 border-t border-primary/10 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ t('payrollRuns.messages.showing', { start: pageStart, end: pageEnd, total: filteredRows.length }) }}
          </p>

          <div class="flex items-center gap-2">
            <UiButton variant="outline" :disabled="page <= 1" @click="setPage(page - 1)">{{ t('common.action.previous') }}</UiButton>

            <template v-for="(pageNumber, index) in pageButtons" :key="`${pageNumber}-${index}`">
              <span v-if="pageNumber === '...'" class="px-1 text-slate-400">...</span>
              <UiButton
                v-else
                :variant="pageNumber === page ? 'primary' : 'outline'"
                icon-only
                @click="setPage(Number(pageNumber))"
              >
                {{ pageNumber }}
              </UiButton>
            </template>

            <UiButton variant="outline" :disabled="page >= totalPages" @click="setPage(page + 1)">{{ t('common.action.next') }}</UiButton>
          </div>
        </div>
      </UiCard>

      <div
        v-if="rerunModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
      >
        <div class="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-slate-950">
          <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">Re-run payroll</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ rerunTarget?.code || rerunTarget?.id }}</p>
            </div>
            <button
              type="button"
              class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white"
              :disabled="rerunningPayroll"
              @click="closeRerunModal"
            >
              <UiIcon name="close" size="20" />
            </button>
          </div>

          <div class="max-h-[75vh] space-y-4 overflow-y-auto px-5 py-4">
            <div
              v-if="rerunError"
              class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            >
              {{ rerunError }}
            </div>

            <UiTextarea
              v-model="rerunReason"
              label="Reason"
              required
              :rows="3"
              placeholder="Timesheet data was updated"
              :disabled="rerunningPayroll"
            />

            <div class="grid gap-4 md:grid-cols-2">
              <UiSelect
                v-model="rerunMode"
                label="Mode"
                :options="rerunModeOptions"
                :disabled="rerunningPayroll"
              />
              <label class="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                <input
                  v-model="rerunDryRun"
                  type="checkbox"
                  class="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                  :disabled="rerunningPayroll"
                />
                Dry-run preview
              </label>
            </div>

            <UiTextarea
              v-if="rerunMode === 'SELECTED_EMPLOYEES'"
              v-model="rerunEmployeeCodesText"
              label="Employee codes"
              :rows="2"
              placeholder="EMP001, EMP002"
              :disabled="rerunningPayroll"
            />

            <div
              v-if="rerunResult"
              class="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div class="grid gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p class="text-xs font-bold uppercase text-slate-500">Status</p>
                  <p class="mt-1 font-semibold text-slate-900 dark:text-white">{{ rerunResult.status }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold uppercase text-slate-500">Total</p>
                  <p class="mt-1 font-semibold text-slate-900 dark:text-white">{{ rerunResult.totalEmployees }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold uppercase text-slate-500">Success</p>
                  <p class="mt-1 font-semibold text-emerald-700">{{ rerunResult.successCount }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold uppercase text-slate-500">Failed</p>
                  <p class="mt-1 font-semibold text-rose-700">{{ rerunResult.failedCount }}</p>
                </div>
              </div>

              <div v-if="rerunResult.results?.length" class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                  <thead class="text-xs uppercase text-slate-500">
                    <tr>
                      <th class="py-2 pr-4">Employee</th>
                      <th class="py-2 pr-4">Old actual</th>
                      <th class="py-2 pr-4">New actual</th>
                      <th class="py-2 pr-4">Difference</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr v-for="item in rerunResult.results" :key="item.employeeCode">
                      <td class="py-2 pr-4 font-semibold">{{ item.employeeCode }}</td>
                      <td class="py-2 pr-4">{{ item.oldActualAmount }}</td>
                      <td class="py-2 pr-4">{{ item.newActualAmount }}</td>
                      <td class="py-2 pr-4">{{ item.differenceAmount }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end dark:border-slate-800">
            <UiButton variant="outline" :disabled="rerunningPayroll" @click="closeRerunModal">Close</UiButton>
            <UiButton leading-icon="restart_alt" :disabled="rerunningPayroll" @click="submitRerun">
              {{ rerunningPayroll ? 'Running...' : (rerunDryRun ? 'Preview' : 'Re-run payroll') }}
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
