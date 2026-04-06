<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import { useI18n } from '@/i18n'
import { payrollResultService, type PayrollResultSourceType } from '@/services/payroll-result.service'
import { AppRoute } from '@/types'

type PayrollResultRow = {
  id: string
  payrollRunCode: string
  period: string
  createdAt: string
  createdDate: string
  salaryName: string
  employeeCode: string
  employeeName: string
  expectedAmount: number
  actualAmount: number
  currency: string
  expectedQty: number
  actualQty: number
  unit: string
  sourceType: PayrollResultSourceType
  isRetro: boolean
  retroReason: string | null
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const headers = computed<UiTableHeader[]>(() => [
  { key: 'period', label: t('payrollResults.headers.period'), thClass: 'min-w-[140px]' },
  { key: 'createdAt', label: t('payrollResults.headers.createdAt'), thClass: 'min-w-[190px]' },
  { key: 'salaryName', label: t('payrollResults.headers.salaryName'), thClass: 'min-w-[160px]' },
  { key: 'employee', label: t('payrollResults.headers.employee'), thClass: 'min-w-[220px]' },
  { key: 'amount', label: t('payrollResults.headers.amount'), align: 'right', thClass: 'min-w-[220px]' },
  { key: 'currency', label: t('payrollResults.headers.currency'), align: 'center', thClass: 'min-w-[100px]' },
  { key: 'qty', label: t('payrollResults.headers.qty'), align: 'right', thClass: 'min-w-[160px]' },
  { key: 'unit', label: t('payrollResults.headers.unit'), thClass: 'min-w-[110px]' },
  { key: 'sourceType', label: t('payrollResults.headers.source'), thClass: 'min-w-[130px]' },
  { key: 'retro', label: t('payrollResults.headers.retro'), thClass: 'min-w-[100px]' },
  { key: 'retroReason', label: t('payrollResults.headers.retroReason'), thClass: 'min-w-[220px]' },
  { key: 'actions', label: t('common.field.actions'), align: 'right', thClass: 'min-w-[110px]' },
])

const createdDate = ref('')
const sourceType = ref<'ALL' | PayrollResultSourceType>('ALL')
const employeeQuery = ref('')
const activePayrollRunCode = ref('')
const linesPerPage = ref('10')
const page = ref(1)
const loading = ref(false)
const error = ref('')
const rows = ref<PayrollResultRow[]>([])

const sourceTypeOptions = computed(() => [
  { value: 'ALL', label: t('payrollResults.sourceTypeOptions.all') },
  { value: 'RUNNING', label: t('payrollResults.sourceTypeOptions.running') },
  { value: 'PREVIEW', label: t('payrollResults.sourceTypeOptions.preview') },
  { value: 'FINALIZED', label: t('payrollResults.sourceTypeOptions.finalized') },
  { value: 'ADJUSTMENT', label: t('payrollResults.sourceTypeOptions.adjustment') },
])

const lineOptions = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
]

const appliedFilters = ref({
  createdDate: '',
  sourceType: 'ALL' as 'ALL' | PayrollResultSourceType,
  employeeQuery: '',
})

const pageSize = computed(() => Number(linesPerPage.value))

const filteredRows = computed(() => {
  const normalizedEmployeeQuery = appliedFilters.value.employeeQuery.trim().toLowerCase()

  return rows.value.filter((row) => {
    const effectiveCreatedDate = row.createdDate || (activePayrollRunCode.value ? createdDate.value : '')

    if (activePayrollRunCode.value && row.payrollRunCode && row.payrollRunCode !== activePayrollRunCode.value) {
      return false
    }

    if (appliedFilters.value.createdDate && effectiveCreatedDate !== appliedFilters.value.createdDate) {
      return false
    }

    if (appliedFilters.value.sourceType !== 'ALL' && row.sourceType !== appliedFilters.value.sourceType) {
      return false
    }

    if (normalizedEmployeeQuery) {
      const haystack = `${row.employeeCode} ${row.employeeName} ${row.salaryName}`.toLowerCase()
      if (!haystack.includes(normalizedEmployeeQuery)) {
        return false
      }
    }

    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() => (filteredRows.value.length === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const pageEnd = computed(() => Math.min(page.value * pageSize.value, filteredRows.value.length))

const pageButtons = computed<(number | '...')[]>(() => {
  const total = totalPages.value
  const current = page.value

  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 3) return [1, 2, 3, '...', total]
  if (current >= total - 2) return [1, '...', total - 2, total - 1, total]
  return [1, '...', current, '...', total]
})

const totalExpected = computed(() => filteredRows.value.reduce((sum, row) => sum + row.expectedAmount, 0))
const totalActual = computed(() => filteredRows.value.reduce((sum, row) => sum + row.actualAmount, 0))
const variance = computed(() => totalActual.value - totalExpected.value)
const retroCount = computed(() => filteredRows.value.filter((row) => row.isRetro).length)

const summaryCurrency = computed(() => {
  const values = Array.from(new Set(filteredRows.value.map((row) => row.currency).filter(Boolean)))
  return values.length === 1 ? values[0] : null
})

watch(filteredRows, () => {
  if (page.value > totalPages.value) {
    page.value = totalPages.value
  }
}, { immediate: true })

watch(linesPerPage, () => {
  page.value = 1
})

watch(
  () => [route.query.createdDate, route.query.payrollRunCode],
  ([createdDateQuery, payrollRunCodeQuery]) => {
    const createdDateFromRoute = normalizeDateOnly(queryString(createdDateQuery))
    const payrollRunCodeFromRoute = queryString(payrollRunCodeQuery)
    createdDate.value = createdDateFromRoute
    activePayrollRunCode.value = payrollRunCodeFromRoute
    appliedFilters.value = {
      ...appliedFilters.value,
      createdDate: createdDateFromRoute,
    }
    page.value = 1

    void loadRows()
  },
  { immediate: true },
)

async function loadRows() {
  loading.value = true
  error.value = ''

  try {
    const query = {
      ...(activePayrollRunCode.value ? { payrollRunCode: activePayrollRunCode.value } : {}),
      ...(createdDate.value ? { createdDate: createdDate.value } : {}),
    }

    const response = await payrollResultService.list(
      Object.keys(query).length > 0 ? query : undefined,
    )
    const items = normalizeCollection(response)

    rows.value = items
      .map((item, index) => normalizeRow(item, index))
      .sort((left, right) => {
        const rightTs = toTimestamp(right.createdAt || right.createdDate) ?? 0
        const leftTs = toTimestamp(left.createdAt || left.createdDate) ?? 0
        return rightTs - leftTs
      })
  } catch (err: any) {
    rows.value = []
    error.value = err?.response?.data?.message ?? t('payrollResults.messages.loadFailed')
  } finally {
    loading.value = false
  }
}

async function refresh() {
  await loadRows()
}

function applyFilters() {
  appliedFilters.value = {
    createdDate: createdDate.value,
    sourceType: sourceType.value,
    employeeQuery: employeeQuery.value.trim(),
  }
  page.value = 1
}

function resetFilters() {
  createdDate.value = ''
  sourceType.value = 'ALL'
  employeeQuery.value = ''
  applyFilters()
}

function setPage(nextPage: number) {
  if (nextPage < 1 || nextPage > totalPages.value) return
  page.value = nextPage
}

function viewPayrollResultDetails(row: PayrollResultRow) {
  const employeeCode = row.employeeCode !== '-' ? row.employeeCode.trim() : ''
  const period = row.period !== '-' ? row.period.trim() : ''

  if (!employeeCode && !period) return

  void router.push({
    path: AppRoute.SALARY_SLIP,
    query: {
      ...(employeeCode ? { employeeCode } : {}),
      ...(period ? { period } : {}),
    },
  })
}

function sourceVariant(value: PayrollResultSourceType) {
  if (value === 'FINALIZED') return 'success' as const
  if (value === 'ADJUSTMENT') return 'warning' as const
  return 'info' as const
}

function sourceLabel(value: PayrollResultSourceType) {
  if (value === 'RUNNING') return t('payrollResults.sourceTypeOptions.running')
  if (value === 'FINALIZED') return t('payrollResults.sourceTypeOptions.finalized')
  if (value === 'ADJUSTMENT') return t('payrollResults.sourceTypeOptions.adjustment')
  return t('payrollResults.sourceTypeOptions.preview')
}

function retroVariant(value: boolean) {
  return value ? 'success' as const : 'info' as const
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'NA'
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? '').join('')
}

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function formatQuantity(value: number) {
  return value.toFixed(2)
}

function formatDateTime(value: string) {
  if (!value) return '-'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed)
}

function formatSummaryAmount(amount: number) {
  if (summaryCurrency.value) {
    return formatAmount(amount, summaryCurrency.value)
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function varianceClass(row: PayrollResultRow) {
  if (row.actualAmount > row.expectedAmount) return 'text-error'
  return 'text-primary'
}

function paginationSummary() {
  return t('payrollResults.messages.pagination', {
    start: pageStart.value,
    end: pageEnd.value,
    total: filteredRows.value.length,
  })
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

function normalizeRow(item: Record<string, unknown>, index: number): PayrollResultRow {
  const employee = asRecord(firstDefined(item.employee, item.userProfile, item.employeeInfo))
  const payrollRun = asRecord(firstDefined(item.payrollRun, item.run))
  const normalizedCreatedAt = normalizeDateTimeValue(
    firstDefined(
      item.createdAt,
      payrollRun?.createdAt,
      item.updatedAt,
      item.runAt,
      payrollRun?.runAt,
      payrollRun?.updatedAt,
    ),
  )
  const normalizedCreatedDate = normalizeDateOnly(
    firstDefined(
      normalizedCreatedAt,
      item.createdDate,
      item.createdAt,
      item.updatedAt,
      item.runAt,
      payrollRun?.runAt,
      payrollRun?.createdAt,
      payrollRun?.updatedAt,
    ),
  ) || (activePayrollRunCode.value ? createdDate.value : '')

  return {
    id: toDisplayString(
      firstDefined(item.id, item.code, item.payrollResultCode, item.resultCode),
      `PAYROLL-RESULT-${index + 1}`,
    ),
    payrollRunCode: toDisplayString(
      firstDefined(item.payrollRunCode, item.runCode, payrollRun?.code, payrollRun?.payrollRunCode),
      '',
    ),
    period: toDisplayString(
      firstDefined(item.period, item.payrollPeriod, item.runPeriod, payrollRun?.period, payrollRun?.runPeriod),
      '-',
    ),
    createdAt: normalizedCreatedAt,
    createdDate: normalizedCreatedDate,
    salaryName: toDisplayString(
      firstDefined(item.salaryName, item.name, item.salaryCode, item.salaryComponentName),
      'Payroll Item',
    ),
    employeeCode: toDisplayString(
      firstDefined(item.employeeCode, employee?.code, employee?.employeeCode, item.userProfileCode),
      '-',
    ),
    employeeName: toDisplayString(
      firstDefined(item.employeeName, employee?.name, employee?.fullName, employee?.displayName, item.userName),
      'Unknown Employee',
    ),
    expectedAmount: toNumber(
      firstDefined(item.expectedAmount, item.amountExpected, item.plannedAmount, item.originalAmount),
    ),
    actualAmount: toNumber(
      firstDefined(item.actualAmount, item.amountActual, item.amount, item.finalAmount),
    ),
    currency: toDisplayString(firstDefined(item.currency, item.currencyCode), 'USD').toUpperCase(),
    expectedQty: toNumber(
      firstDefined(item.expectedQty, item.quantityExpected, item.expectedQuantity, item.plannedQty, item.quantity),
    ),
    actualQty: toNumber(
      firstDefined(item.actualQty, item.quantityActual, item.actualQuantity, item.finalQty, item.quantity),
    ),
    unit: toDisplayString(firstDefined(item.unit, item.unitName, item.unitCode), 'Unit'),
    sourceType: normalizeSourceType(firstDefined(item.sourceType, item.resultSourceType, item.source, item.status)),
    isRetro: toBoolean(firstDefined(item.isRetro, item.retro, item.hasRetro, item.isRetroAdjustment)),
    retroReason: normalizeNullableString(
      firstDefined(item.retroReason, item.retroAdjustmentReason, item.reason, item.adjustmentReason),
    ),
  }
}

function normalizeSourceType(value: unknown): PayrollResultSourceType {
  const token = toDisplayString(value, 'PREVIEW')
    .toUpperCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  if (token.includes('ADJUST') || token.includes('RETRO')) return 'ADJUSTMENT'
  if (token.includes('FINAL') || token.includes('COMPLETE') || token.includes('POST')) return 'FINALIZED'
  if (token.includes('RUN')) return 'RUNNING'
  return 'PREVIEW'
}

function normalizeDateOnly(value: unknown) {
  if (typeof value === 'string') {
    const normalized = value.trim()
    if (!normalized) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized
    const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match?.[1]) return match[1]
    const parsed = new Date(normalized)
    return Number.isNaN(parsed.getTime()) ? normalized : parsed.toISOString().slice(0, 10)
  }

  if (typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10)
  }

  return ''
}

function normalizeDateTimeValue(value: unknown) {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized || ''
  }

  if (typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  }

  return ''
}

function normalizeNullableString(value: unknown) {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized || null
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return null
}

function queryString(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0].trim()
  return ''
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

function toNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replaceAll(',', '').trim())
    return Number.isFinite(normalized) ? normalized : 0
  }

  return 0
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['true', '1', 'yes', 'y'].includes(normalized)
  }
  return false
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

function toTimestamp(value: string) {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-black tracking-[-0.02em] text-slate-900 dark:text-white">{{ t('payrollResults.title') }}</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ t('payrollResults.subtitle') }}
          </p>
        </div>

        <UiButton variant="outline" leading-icon="refresh" :disabled="loading" @click="refresh">{{ t('common.action.refresh') }}</UiButton>
      </div>

      <div
        v-if="activePayrollRunCode"
        class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700"
      >
        {{ t('payrollResults.filteredByRun', { code: activePayrollRunCode }) }}
      </div>

      <UiCard>
        <UiCardBody>
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
            <div class="lg:col-span-3">
              <UiInput v-model="createdDate" :label="t('payrollResults.fields.createdDate')" type="date" />
            </div>

            <div class="lg:col-span-3">
              <UiSelect v-model="sourceType" :label="t('payrollResults.fields.sourceType')" :options="sourceTypeOptions" />
            </div>

            <div class="lg:col-span-4">
              <UiInput
                v-model="employeeQuery"
                :label="t('payrollResults.fields.employeeSelection')"
                :placeholder="t('payrollResults.fields.employeePlaceholder')"
                leading-icon="search"
                @keyup.enter="applyFilters"
              />
            </div>

            <div class="lg:col-span-2 flex gap-2">
              <UiButton class="flex-1" leading-icon="filter_list" @click="applyFilters">{{ t('common.action.apply') }}</UiButton>
              <UiButton class="flex-1" variant="outline" @click="resetFilters">{{ t('common.action.reset') }}</UiButton>
            </div>
          </div>
        </UiCardBody>
      </UiCard>

      <UiCard>
        <div class="p-4 md:p-6">
          <div v-if="error" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {{ error }}
          </div>

          <div v-if="loading" class="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-950/60">
            {{ t('payrollResults.messages.loading') }}
          </div>

          <UiTable
            v-else
            :headers="headers"
            :rows="pagedRows"
            row-key="id"
            table-class="min-w-[1640px]"
            row-class="hover:bg-primary/5 transition-colors"
            th-base-class="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-[0.2em]"
            td-base-class="px-4 md:px-6 py-4 text-sm"
            :empty-text="t('payrollResults.messages.empty')"
          >
            <template #cell-period="{ row }">
              <span class="font-medium text-slate-900 dark:text-white">{{ row.period }}</span>
            </template>

            <template #cell-createdAt="{ row }">
              <span class="text-slate-600 dark:text-slate-300">{{ formatDateTime(row.createdAt) }}</span>
            </template>

            <template #cell-salaryName="{ row }">
              <span class="font-semibold text-slate-900 dark:text-white">{{ row.salaryName }}</span>
            </template>

            <template #cell-employee="{ row }">
              <div class="flex items-center gap-3">
                <div class="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {{ initials(row.employeeName) }}
                </div>
                <div>
                  <p class="font-bold text-slate-900 dark:text-white">{{ row.employeeName }}</p>
                  <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">{{ row.employeeCode }}</p>
                </div>
              </div>
            </template>

            <template #cell-amount="{ row }">
              <div class="flex flex-col items-end">
                <span class="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {{ formatAmount(row.expectedAmount, row.currency) }}
                </span>
                <span class="text-sm font-bold" :class="varianceClass(row)">
                  {{ formatAmount(row.actualAmount, row.currency) }}
                </span>
              </div>
            </template>

            <template #cell-currency="{ row }">
              <div class="flex justify-center">
                <span class="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {{ row.currency }}
                </span>
              </div>
            </template>

            <template #cell-qty="{ row }">
              <div class="flex flex-col items-end">
                <span class="text-xs italic text-slate-500 dark:text-slate-400">{{ formatQuantity(row.expectedQty) }}</span>
                <span class="text-sm font-bold text-slate-900 dark:text-white">{{ formatQuantity(row.actualQty) }}</span>
              </div>
            </template>

            <template #cell-unit="{ row }">
              <span class="text-slate-900 dark:text-white">{{ row.unit }}</span>
            </template>

            <template #cell-sourceType="{ row }">
              <UiBadge :variant="sourceVariant(row.sourceType)">
                {{ sourceLabel(row.sourceType) }}
              </UiBadge>
            </template>

            <template #cell-retro="{ row }">
              <UiBadge :variant="retroVariant(row.isRetro)">
                {{ row.isRetro ? t('common.status.yes') : t('common.status.no') }}
              </UiBadge>
            </template>

            <template #cell-retroReason="{ row }">
              <p
                class="max-w-[180px] truncate text-xs"
                :class="row.retroReason ? 'text-slate-600 dark:text-slate-300' : 'italic text-slate-400'"
                :title="row.retroReason ?? '-'"
              >
                {{ row.retroReason ?? '-' }}
              </p>
            </template>

            <template #cell-actions="{ row }">
              <div class="flex justify-end">
                <button
                  type="button"
                  class="rounded-lg border border-primary/15 p-2 text-slate-500 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  :title="t('payrollResults.messages.viewDetail')"
                  @click="viewPayrollResultDetails(row)"
                >
                  <UiIcon name="visibility" size="18" />
                </button>
              </div>
            </template>
          </UiTable>
        </div>

        <div class="flex flex-col gap-4 border-t border-primary/10 bg-slate-50/70 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between dark:bg-slate-900/50">
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ paginationSummary() }}</p>

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

          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('payrollResults.fields.linesPerPage') }}</span>
            <div class="w-24">
              <UiSelect v-model="linesPerPage" :options="lineOptions" />
            </div>
          </div>
        </div>
      </UiCard>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <UiCard>
          <UiCardBody>
            <div class="flex items-start gap-4">
              <div class="flex size-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <UiIcon name="verified" />
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('payrollResults.cards.totalExpected') }}</p>
                <h3 class="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                  {{ formatSummaryAmount(totalExpected) }}
                </h3>
                <p class="mt-1 text-xs font-medium text-green-600">
                  {{ summaryCurrency ? t('payrollResults.messages.currencySingle', { currency: summaryCurrency }) : t('payrollResults.messages.mixedCurrencies') }}
                </p>
              </div>
            </div>
          </UiCardBody>
        </UiCard>

        <UiCard>
          <UiCardBody>
            <div class="flex items-start gap-4">
              <div class="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UiIcon name="account_balance" />
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('payrollResults.cards.totalActual') }}</p>
                <h3 class="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                  {{ formatSummaryAmount(totalActual) }}
                </h3>
                <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {{ t('payrollResults.messages.variance', { amount: formatSummaryAmount(variance) }) }}
                </p>
              </div>
            </div>
          </UiCardBody>
        </UiCard>

        <UiCard>
          <UiCardBody>
            <div class="flex items-start gap-4">
              <div class="flex size-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <UiIcon name="history" />
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('payrollResults.cards.retroAdjustments') }}</p>
                <h3 class="mt-1 text-2xl font-black text-slate-900 dark:text-white">{{ retroCount }}</h3>
                <p class="mt-1 text-xs font-medium text-rose-600">{{ t('payrollResults.messages.retroReview') }}</p>
              </div>
            </div>
          </UiCardBody>
        </UiCard>
      </div>
    </div>
  </AppLayout>
</template>
