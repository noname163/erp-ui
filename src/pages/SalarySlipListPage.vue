<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import { employeeSalaryService, type EmployeeSalaryListResponse } from '@/services/employee-salary.service'
import { AppRoute } from '@/types'

type SalaryRow = {
    id: string
    employeeName: string
    avatarUrl: string
    effectiveFrom: string
    effectiveTo: string | null
    totalAmount: number
    currency: string
}

const router = useRouter()

const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const pageSize = 5
const totalElements = ref(0)
const totalPages = ref(1)

const search = ref('')
const effectiveFrom = ref('')
const effectiveTo = ref('')
const minAmount = ref('')
const maxAmount = ref('')

const applied = ref({
    search: '',
    effectiveFrom: '',
    effectiveTo: '',
    minAmount: '',
    maxAmount: '',
})

const rows = ref<SalaryRow[]>([])

const headers: UiTableHeader[] = [
    { key: 'employeeName', label: 'Employee Name', thClass: 'min-w-[220px]' },
    { key: 'effectiveFrom', label: 'Effective From' },
    { key: 'effectiveTo', label: 'Effective To' },
    { key: 'totalAmount', label: 'Total Amount', align: 'right' },
    { key: 'currency', label: 'Currency', align: 'center' },
    { key: 'actions', label: 'Actions', align: 'center' },
]

function toNumber(value: unknown) {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
        const n = Number(value.replaceAll(',', '').trim())
        return Number.isFinite(n) ? n : 0
    }
    return 0
}

function normalizeRows(data: EmployeeSalaryListResponse[]): SalaryRow[] {
    return data.map((item: EmployeeSalaryListResponse, index: number) => ({
        id: String(item?.salaryCode ?? `SAL-${String(index + 1).padStart(3, '0')}`),
        employeeName: String(item?.employeeName ?? `Employee ${index + 1}`),
        avatarUrl: '',
        effectiveFrom: String(item?.effectiveFrom ?? ''),
        effectiveTo: item?.effectiveTo ? String(item.effectiveTo) : null,
        totalAmount: toNumber(item?.totalAmount),
        currency: String(item?.currency ?? 'USD').toUpperCase(),
    }))
}

async function loadRows() {
    loading.value = true
    error.value = ''
    try {
        const res = await employeeSalaryService.list({
            employeeName: applied.value.search || undefined,
            minAmount: applied.value.minAmount || undefined,
            maxAmount: applied.value.maxAmount || undefined,
            effectiveFrom: applied.value.effectiveFrom || undefined,
            effectiveTo: applied.value.effectiveTo || undefined,
            page: currentPage.value - 1,
            size: pageSize,
            sortBy: 'effectiveFrom',
            sortDir: 'DESC',
        })
        const data = (res?.data ?? []) as EmployeeSalaryListResponse[]
        rows.value = Array.isArray(data) ? normalizeRows(data) : []
        totalElements.value = Number(res?.totalElements ?? rows.value.length ?? 0)
        totalPages.value = Math.max(1, Number(res?.totalPages ?? Math.ceil(totalElements.value / pageSize) ?? 1))
    } catch (e: any) {
        rows.value = []
        totalElements.value = 0
        totalPages.value = 1
        error.value = e?.response?.data?.message ?? 'Unable to load salary data from API.'
    } finally {
        loading.value = false
    }
}

onMounted(loadRows)

function normalizeDate(value: string | null | undefined) {
    if (!value) return null
    const iso = String(value).trim()
    if (!iso) return null
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? null : d
}

function formatDate(value: string | null) {
    if (!value) return 'Ongoing'
    const d = normalizeDate(value)
    if (!d) return value
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(d)
}

function formatMoney(amount: number, currency: string) {
    const ccy = currency || 'USD'
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy, minimumFractionDigits: 2 }).format(amount)
    } catch {
        return `${amount.toFixed(2)} ${ccy}`
    }
}

async function applyFilters() {
    applied.value = {
        search: search.value.trim(),
        effectiveFrom: effectiveFrom.value,
        effectiveTo: effectiveTo.value,
        minAmount: minAmount.value.trim(),
        maxAmount: maxAmount.value.trim(),
    }
    currentPage.value = 1
    await loadRows()
}

async function resetFilters() {
    search.value = ''
    effectiveFrom.value = ''
    effectiveTo.value = ''
    minAmount.value = ''
    maxAmount.value = ''
    await applyFilters()
}

const filteredRows = computed(() => rows.value)
const pagedRows = computed(() => rows.value)
const pageStart = computed(() => (totalElements.value === 0 ? 0 : (currentPage.value - 1) * pageSize + 1))
const pageEnd = computed(() => Math.min(currentPage.value * pageSize, totalElements.value))

const pageButtons = computed<(number | '...')[]>(() => {
    const total = totalPages.value
    const current = currentPage.value

    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
    if (current <= 3) return [1, 2, 3, '...', total]
    if (current >= total - 2) return [1, '...', total - 2, total - 1, total]
    return [1, '...', current, '...', total]
})

const totalPayroll = computed(() => filteredRows.value.reduce((sum, row) => sum + row.totalAmount, 0))
const activeContracts = computed(() => totalElements.value)
const pendingReviews = computed(() => filteredRows.value.filter((r) => r.totalAmount >= 90000).length)

async function setPage(page: number) {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    await loadRows()
}

function exportCsv() {
    const header = ['employeeName', 'effectiveFrom', 'effectiveTo', 'totalAmount', 'currency']
    const body = filteredRows.value.map((row) => [
        row.employeeName,
        row.effectiveFrom,
        row.effectiveTo ?? 'Ongoing',
        row.totalAmount,
        row.currency,
    ])

    const csv = [header, ...body]
        .map((cols) => cols.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
        .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'salary-management.csv'
    anchor.click()
    URL.revokeObjectURL(url)
}
</script>

<template>
    <AppLayout>
        <div class="space-y-6">
            <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold">Salary Management</h1>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Review and manage employee compensation schedules.
                    </p>
                </div>

                <div class="flex flex-wrap gap-3">
                    <UiButton variant="outline" leading-icon="filter_list" @click="applyFilters">Filter</UiButton>
                    <UiButton variant="outline" leading-icon="download" @click="exportCsv">Export</UiButton>
                    <UiButton variant="primary" leading-icon="add_circle" @click="router.push(AppRoute.SALARY_SLIP)">
                        Add Salary
                    </UiButton>
                </div>
            </div>

            <UiCard>
                <UiCardBody>
                    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
                        <div class="lg:col-span-2">
                            <UiInput v-model="search" label="Employee or Currency"
                                placeholder="Search employee, currency..." leading-icon="search"
                                @keyup.enter="applyFilters" />
                        </div>

                        <div class="lg:col-span-2">
                            <p class="ui-label">Effective Range</p>
                            <div class="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                                <UiInput v-model="effectiveFrom" type="date" />
                                <span class="text-slate-400">-</span>
                                <UiInput v-model="effectiveTo" type="date" />
                            </div>
                        </div>

                        <div>
                            <p class="ui-label">Total Amount Range</p>
                            <div class="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                                <UiInput v-model="minAmount" type="number" placeholder="Min" leading-icon="payments" />
                                <span class="text-slate-400">-</span>
                                <UiInput v-model="maxAmount" type="number" placeholder="Max" leading-icon="payments" />
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 mt-4">
                        <UiButton variant="outline" @click="resetFilters">Reset</UiButton>
                        <UiButton variant="primary" leading-icon="filter_alt" @click="applyFilters">Apply Filters
                        </UiButton>
                    </div>
                </UiCardBody>
            </UiCard>

            <UiCard>
                <div class="p-4 md:p-6">
                    <div v-if="error" class="text-sm text-amber-600 dark:text-amber-400 mb-4">{{ error }}</div>
                    <div v-if="loading" class="text-sm text-slate-500">Loading salary records...</div>

                    <UiTable v-else :headers="headers" :rows="pagedRows" row-key="id"
                        row-class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        th-base-class="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"
                        td-base-class="px-4 md:px-6 py-4 text-sm" table-class="min-w-[980px]"
                        empty-text="No salary records found">
                        <template #cell-employeeName="{ row }">
                            <div class="flex items-center gap-3">
                                <div class="size-8 rounded-full bg-slate-200 bg-cover bg-center"
                                    :style="row.avatarUrl ? { backgroundImage: `url('${row.avatarUrl}')` } : undefined">
                                </div>
                                <span class="font-semibold text-slate-900 dark:text-white">{{ row.employeeName }}</span>
                            </div>
                        </template>

                        <template #cell-effectiveFrom="{ row }">
                            <span class="text-slate-600 dark:text-slate-300">{{ formatDate(row.effectiveFrom) }}</span>
                        </template>

                        <template #cell-effectiveTo="{ row }">
                            <span
                                :class="row.effectiveTo ? 'text-slate-600 dark:text-slate-300' : 'italic text-slate-500'">
                                {{ formatDate(row.effectiveTo) }}
                            </span>
                        </template>

                        <template #cell-totalAmount="{ row }">
                            <span class="font-bold text-slate-900 dark:text-white">{{ formatMoney(row.totalAmount,
                                row.currency) }}</span>
                        </template>

                        <template #cell-currency="{ row }">
                            <div class="flex justify-center">
                                <UiBadge variant="info">{{ row.currency }}</UiBadge>
                            </div>
                        </template>

                        <template #cell-actions>
                            <div class="flex justify-center gap-2">
                                <button type="button"
                                    class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                    <UiIcon name="edit" size="18" />
                                </button>
                                <button type="button"
                                    class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                    <UiIcon name="delete" size="18" />
                                </button>
                            </div>
                        </template>
                    </UiTable>
                </div>

                <div
                    class="px-4 md:px-6 py-4 border-t border-primary/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                        Showing <span class="font-bold text-slate-900 dark:text-white">{{ pageStart }}</span> to
                        <span class="font-bold text-slate-900 dark:text-white">{{ pageEnd }}</span> of
                        <span class="font-bold text-slate-900 dark:text-white">{{ totalElements }}</span> results
                    </p>

                    <div class="flex items-center gap-2">
                        <UiButton variant="outline" :disabled="currentPage <= 1" @click="setPage(currentPage - 1)">
                            Previous</UiButton>

                        <template v-for="(page, idx) in pageButtons" :key="`${page}-${idx}`">
                            <span v-if="page === '...'" class="px-1 text-slate-400">...</span>
                            <UiButton v-else :variant="page === currentPage ? 'primary' : 'outline'" icon-only
                                @click="setPage(page)">
                                {{ page }}
                            </UiButton>
                        </template>

                        <UiButton variant="outline" :disabled="currentPage >= totalPages"
                            @click="setPage(currentPage + 1)">Next
                        </UiButton>
                    </div>
                </div>
            </UiCard>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <UiCard>
                    <UiCardBody>
                        <div class="flex items-center gap-4">
                            <div
                                class="size-12 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                                <UiIcon name="trending_up" />
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Payroll</p>
                                <p class="text-xl font-black text-slate-900 dark:text-white">{{
                                    formatMoney(totalPayroll, 'USD') }}
                                </p>
                            </div>
                        </div>
                    </UiCardBody>
                </UiCard>

                <UiCard>
                    <UiCardBody>
                        <div class="flex items-center gap-4">
                            <div class="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <UiIcon name="badge" />
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Contracts
                                </p>
                                <p class="text-xl font-black text-slate-900 dark:text-white">{{ activeContracts }}</p>
                            </div>
                        </div>
                    </UiCardBody>
                </UiCard>

                <UiCard>
                    <UiCardBody>
                        <div class="flex items-center gap-4">
                            <div
                                class="size-12 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <UiIcon name="hourglass_empty" />
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Reviews</p>
                                <p class="text-xl font-black text-slate-900 dark:text-white">{{ pendingReviews }}</p>
                            </div>
                        </div>
                    </UiCardBody>
                </UiCard>
            </div>
        </div>
    </AppLayout>
</template>
