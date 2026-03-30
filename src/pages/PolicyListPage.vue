<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import PolicyAssignmentModal from '@/components/payroll/PolicyAssignmentModal.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import { payrollPolicy, type PayrollPolicyResponse } from '@/services/payroll-policy.service'
import { AppRoute } from '@/types'

type PolicyLifecycle = 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
type PolicyRisk = 'healthy' | 'attention' | 'critical'

type PolicyRow = PayrollPolicyResponse & {
    id: string
    category: string
    standardQty: string
    unitLabel: string
    timing: string
    affectedCount: number
    affectedAvatars: string[]
    updatedLabel: string
    lifecycle: PolicyLifecycle
    risk: PolicyRisk
    createdBy?: string
}

const router = useRouter()

const loading = ref(false)
const error = ref('')
const search = ref('')
const lifecycle = ref<PolicyLifecycle>('ACTIVE')
const rows = ref<PolicyRow[]>([])
const currentPage = ref(1)
const pageSize = 8
const showAssignmentModal = ref(false)
const selectedPolicy = ref<PolicyRow | null>(null)
const assignmentCounts = ref<Record<string, number>>({})
const assignmentMessage = ref('')

const headers: UiTableHeader[] = [
    { key: 'name', label: 'Policy Name', thClass: 'min-w-[250px]' },
    { key: 'standardQty', label: 'Standard Qty', align: 'center' },
    { key: 'unitLabel', label: 'Unit' },
    { key: 'timing', label: 'Timing (Start-End)', thClass: 'min-w-[170px]' },
    { key: 'effectiveRange', label: 'Effective Range', thClass: 'min-w-[150px]' },
    { key: 'affected', label: 'Affected', align: 'center' },
    { key: 'authorship', label: 'Authorship', thClass: 'min-w-[140px]' },
    { key: 'actions', label: 'Actions', align: 'right' },
]

function toDateLabel(value?: string | null) {
    if (!value) return 'No Expiry'
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date)
}

function parseIsoDate(value?: string | null) {
    if (!value) return null
    const date = new Date(`${value}T00:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
}

function formatQuantity(value: string | number | null | undefined, fallback: string) {
    const normalized = typeof value === 'number' ? value : Number(String(value ?? '').replaceAll(',', ''))
    return Number.isFinite(normalized) ? normalized.toFixed(2) : fallback
}

function formatTime(value?: string | null) {
    if (!value) return ''
    return value.length >= 5 ? value.slice(0, 5) : value
}

function formatTiming(start?: string | null, end?: string | null) {
    const formattedStart = formatTime(start)
    const formattedEnd = formatTime(end)

    if (formattedStart && formattedEnd) return `${formattedStart} - ${formattedEnd}`
    if (formattedStart) return `${formattedStart} -`
    if (formattedEnd) return `- ${formattedEnd}`
    return 'Flexible'
}

function deriveLifecycle(item: PayrollPolicyResponse): PolicyLifecycle {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const effectiveFrom = parseIsoDate(item.effectiveFrom)
    const effectiveTo = parseIsoDate(item.effectiveTo)

    if (effectiveFrom && effectiveFrom.getTime() > today.getTime()) return 'DRAFT'
    if (effectiveTo && effectiveTo.getTime() < today.getTime()) return 'ARCHIVED'
    return 'ACTIVE'
}

function deriveRisk(item: PayrollPolicyResponse, lifecycle: PolicyLifecycle): PolicyRisk {
    if (lifecycle === 'ARCHIVED') return 'healthy'

    const effectiveTo = parseIsoDate(item.effectiveTo)
    if (!effectiveTo) return 'healthy'

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil((effectiveTo.getTime() - today.getTime()) / 86_400_000)

    if (diffDays <= 2) return 'critical'
    if (diffDays <= 14) return 'attention'
    return 'healthy'
}

function buildUpdatedLabel(item: PayrollPolicyResponse, lifecycle: PolicyLifecycle) {
    if (lifecycle === 'DRAFT' && item.effectiveFrom) {
        return `Starts ${toDateLabel(item.effectiveFrom)}`
    }

    if (lifecycle === 'ARCHIVED' && item.effectiveTo) {
        return `Ended ${toDateLabel(item.effectiveTo)}`
    }

    if (item.effectiveTo) {
        return `Ends ${toDateLabel(item.effectiveTo)}`
    }

    return 'Open-ended'
}

function makePolicyRow(item: PayrollPolicyResponse, index: number): PolicyRow {
    const lifecycle = deriveLifecycle(item)

    return {
        ...item,
        id: String(item.code ?? item.name ?? `policy-${index}`),
        code: String(item.code ?? `policy-${index}`),
        name: String(item.name ?? `Policy ${index + 1}`),
        standardQuantityPerDay: item.standardQuantityPerDay ?? null,
        unitCode: item.unitCode ? String(item.unitCode) : null,
        standardStartTime: item.standardStartTime ? String(item.standardStartTime) : null,
        standardEndTime: item.standardEndTime ? String(item.standardEndTime) : null,
        roundingRule: item.roundingRule ? String(item.roundingRule) : null,
        effectiveFrom: String(item.effectiveFrom ?? ''),
        effectiveTo: item.effectiveTo ? String(item.effectiveTo) : null,
        category: item.roundingRule ? `Rounding ${item.roundingRule}` : 'Payroll Policy',
        standardQty: formatQuantity(item.standardQuantityPerDay, '0.00'),
        unitLabel: item.unitCode ? String(item.unitCode) : 'N/A',
        timing: formatTiming(item.standardStartTime, item.standardEndTime),
        affectedCount: 0,
        affectedAvatars: [],
        updatedLabel: buildUpdatedLabel(item, lifecycle),
        lifecycle,
        risk: deriveRisk(item, lifecycle),
        createdBy: 'System',
    }
}

function normalizeRows(data: unknown[]): PolicyRow[] {
    return data.map((payload, index) => {
        const item = (payload ?? {}) as Partial<PayrollPolicyResponse>

        return makePolicyRow({
            code: String(item.code ?? `policy-${index}`),
            name: String(item.name ?? `Policy ${index + 1}`),
            standardQuantityPerDay: item.standardQuantityPerDay == null ? null : Number(item.standardQuantityPerDay),
            unitCode: item.unitCode ? String(item.unitCode) : null,
            standardStartTime: item.standardStartTime ? String(item.standardStartTime) : null,
            standardEndTime: item.standardEndTime ? String(item.standardEndTime) : null,
            roundingRule: item.roundingRule ? String(item.roundingRule) : null,
            effectiveFrom: String(item.effectiveFrom ?? ''),
            effectiveTo: item.effectiveTo ? String(item.effectiveTo) : null,
        }, index)
    })
}

async function loadPolicies() {
    loading.value = true
    error.value = ''

    try {
        const response = await payrollPolicy.listPayrollPolicies()
        const data = Array.isArray(response) ? response : []
        rows.value = normalizeRows(data)
    } catch (err: any) {
        rows.value = []
        error.value = err?.response?.data?.message ?? 'Unable to load policies from API.'
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    void loadPolicies()
})

const filteredRows = computed(() => {
    const keyword = search.value.trim().toLowerCase()

    return rows.value.filter((row) => {
        if (row.lifecycle !== lifecycle.value) return false
        if (!keyword) return true

        return [
            row.name,
            row.code,
            row.category,
            row.unitLabel,
            row.roundingRule ?? '',
            row.createdBy ?? '',
            row.timing,
        ]
            .join(' ')
            .toLowerCase()
            .includes(keyword)
    })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))

const pagedRows = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return filteredRows.value.slice(start, start + pageSize)
})

const pageButtons = computed(() => {
    const max = totalPages.value
    const current = currentPage.value
    const pages = new Set<number>([1, max, current, current - 1, current + 1])

    return Array.from(pages)
        .filter((page) => page >= 1 && page <= max)
        .sort((a, b) => a - b)
})

watch([filteredRows, lifecycle], () => {
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
    if (currentPage.value < 1) currentPage.value = 1
})

const totalPolicies = computed(() => rows.value.length)
const totalAffected = computed(() =>
    rows.value.reduce((sum, row) => sum + (assignmentCounts.value[row.id] ?? row.affectedCount), 0),
)
const pendingUpdates = computed(
    () => rows.value.filter((row) => row.lifecycle === 'DRAFT' || row.risk !== 'healthy').length,
)

function displayAffectedCount(row: PolicyRow) {
    const count = assignmentCounts.value[row.id] ?? row.affectedCount
    if (count >= 1000) return `+${(count / 1000).toFixed(1).replace('.0', '')}k`
    return String(count)
}

function displayRiskVariant(risk: PolicyRisk) {
    if (risk === 'critical') return 'error' as const
    if (risk === 'attention') return 'warning' as const
    return 'success' as const
}

function displayRiskLabel(risk: PolicyRisk) {
    if (risk === 'critical') return 'Urgent'
    if (risk === 'attention') return 'Needs review'
    return 'Healthy'
}

function exportCsv() {
    const header = ['name', 'category', 'quantity', 'unit', 'timing', 'effectiveFrom', 'effectiveTo', 'affected', 'author']
    const body = filteredRows.value.map((row) => [
        row.name,
        row.category,
        row.standardQty,
        row.unitLabel,
        row.timing,
        row.effectiveFrom,
        row.effectiveTo ?? '',
        assignmentCounts.value[row.id] ?? row.affectedCount,
        row.createdBy ?? '',
    ])

    const csv = [header, ...body]
        .map((columns) => columns.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
        .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'payroll-policies.csv'
    anchor.click()
    URL.revokeObjectURL(url)
}

function setPage(page: number) {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
}

function openAssignmentModal(row: PolicyRow) {
    selectedPolicy.value = row
    showAssignmentModal.value = true
}

function handleAssignmentConfirm(selectedIds: string[]) {
    if (!selectedPolicy.value) return

    assignmentCounts.value = {
        ...assignmentCounts.value,
        [selectedPolicy.value.id]: selectedIds.length,
    }

    assignmentMessage.value = `Assigned ${selectedIds.length} employees to ${selectedPolicy.value.name}.`
}

function setLifecycle(tab: string) {
    if (tab === 'ACTIVE' || tab === 'DRAFT' || tab === 'ARCHIVED') {
        lifecycle.value = tab
    }
}
</script>

<template>
    <AppLayout>
        <div class="space-y-8">
            <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div class="space-y-2">
                    <div
                        class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <span>Management</span>
                        <UiIcon name="chevron_right" size="14" />
                        <span class="text-primary">Policy List</span>
                    </div>
                    <h1 class="text-4xl font-black tracking-tight text-slate-900">Compliance Policies</h1>
                    <p class="max-w-2xl text-sm leading-6 text-slate-500">
                        Manage regulatory payroll standards, employee allocations, and effective timeframes across all
                        enterprise departments.
                    </p>
                </div>

                <div class="flex w-full flex-col gap-3 xl:max-w-3xl xl:items-end">
                    <div class="w-full xl:max-w-sm">
                        <UiInput v-model="search" placeholder="Search policies, units or creators..."
                            leading-icon="search" />
                    </div>

                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div class="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                            <button v-for="tab in ['ACTIVE', 'DRAFT', 'ARCHIVED']" :key="tab" type="button"
                                class="rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-colors"
                                :class="lifecycle === tab
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    " @click="setLifecycle(tab)">
                                {{ tab.toLowerCase() }}
                            </button>
                        </div>

                        <UiButton variant="outline" leading-icon="filter_list">Filter</UiButton>
                        <UiButton variant="outline" leading-icon="file_download" @click="exportCsv">Export</UiButton>
                        <UiButton leading-icon="add" @click="router.push(AppRoute.PAYROLL_POLICY_BUILDER)">New Policy
                        </UiButton>
                    </div>
                </div>
            </div>

            <div v-if="assignmentMessage"
                class="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {{ assignmentMessage }}
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <UiCard class="lg:col-span-4">
                    <UiCardBody class="flex h-full flex-col justify-between">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Global Policy
                                Density</p>
                            <h3 class="mt-2 text-4xl font-black tracking-tight text-slate-900">{{ totalPolicies }}</h3>
                        </div>
                        <div class="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                            <UiIcon name="trending_up" size="18" />
                            <span>+12% from last quarter</span>
                        </div>
                    </UiCardBody>
                </UiCard>

                <UiCard class="border-primary bg-primary text-white shadow-xl shadow-primary/20 lg:col-span-4">
                    <UiCardBody class="relative flex h-full flex-col justify-between overflow-hidden">
                        <div class="relative z-10">
                            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Employees
                                Affected</p>
                            <h3 class="mt-2 text-4xl font-black tracking-tight">{{ totalAffected.toLocaleString() }}
                            </h3>
                        </div>
                        <div class="relative z-10 mt-6 flex items-center gap-2 text-sm font-semibold text-white/90">
                            <UiIcon name="groups" size="18" />
                            <span>88% enterprise coverage</span>
                        </div>
                        <UiIcon name="security" size="150" :fill="1"
                            class="absolute -bottom-8 -right-6 text-white/10" />
                    </UiCardBody>
                </UiCard>

                <UiCard class="lg:col-span-4">
                    <UiCardBody class="flex h-full flex-col justify-between">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Pending Updates
                            </p>
                            <h3 class="mt-2 text-4xl font-black tracking-tight text-slate-900">{{ pendingUpdates }}</h3>
                        </div>
                        <div class="mt-6 flex items-center gap-2 text-sm font-semibold text-rose-500">
                            <UiIcon name="warning" size="18" />
                            <span>3 expire in 48h</span>
                        </div>
                    </UiCardBody>
                </UiCard>
            </div>

            <UiCard class="overflow-hidden">
                <div class="border-b border-slate-200 px-6 py-4">
                    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 class="text-lg font-black tracking-tight text-slate-900">Policy Register</h2>
                            <p class="text-sm text-slate-500">
                                Monitor policy coverage, timing windows, and authorship in a single operating surface.
                            </p>
                        </div>

                        <div v-if="error" class="text-sm text-amber-600">{{ error }}</div>
                    </div>
                </div>

                <div class="px-2 pb-2 pt-1">
                    <div v-if="loading" class="px-4 py-8 text-sm text-slate-500">Loading policies...</div>

                    <UiTable v-else :headers="headers" :rows="pagedRows" row-key="id"
                        row-class="hover:bg-slate-50 transition-colors"
                        th-base-class="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500"
                        td-base-class="px-4 md:px-6 py-4 align-middle" table-class="min-w-[1180px]"
                        body-class="divide-slate-100" head-class="bg-slate-50" empty-text="No policies found.">
                        <template #cell-name="{ row }">
                            <div class="flex items-start gap-3">
                                <div class="mt-1 h-2.5 w-2.5 rounded-full" :class="row.risk === 'critical'
                                        ? 'bg-rose-500'
                                        : row.risk === 'attention'
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                    "></div>
                                <div>
                                    <p class="text-sm font-bold text-slate-900">{{ row.name }}</p>
                                    <p class="text-xs text-slate-500">{{ row.category }}</p>
                                </div>
                            </div>
                        </template>

                        <template #cell-standardQty="{ row }">
                            <span class="text-sm font-semibold text-slate-900">{{ row.standardQty }}</span>
                        </template>

                        <template #cell-unitLabel="{ row }">
                            <span
                                class="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                                {{ row.unitLabel }}
                            </span>
                        </template>

                        <template #cell-timing="{ row }">
                            <div class="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <UiIcon name="schedule" size="16" class="text-slate-400" />
                                <span>{{ row.timing }}</span>
                            </div>
                        </template>

                        <template #cell-effectiveRange="{ row }">
                            <div class="space-y-0.5 text-sm">
                                <p class="font-semibold text-slate-900">{{ toDateLabel(row.effectiveFrom) }}</p>
                                <p class="text-slate-500">{{ toDateLabel(row.effectiveTo) }}</p>
                            </div>
                        </template>

                        <template #cell-affected="{ row }">
                            <div class="flex items-center justify-center gap-2">
                                <div class="flex -space-x-2">
                                    <div v-for="(avatar, index) in row.affectedAvatars.slice(0, 2)"
                                        :key="`${row.id}-avatar-${index}`"
                                        class="h-7 w-7 rounded-full border-2 border-white bg-cover bg-center"
                                        :style="{ backgroundImage: `url('${avatar}')` }"></div>
                                </div>
                                <div
                                    class="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black tracking-[0.14em] text-slate-500">
                                    {{ displayAffectedCount(row) }}
                                </div>
                            </div>
                        </template>

                        <template #cell-authorship="{ row }">
                            <div class="space-y-1 text-sm">
                                <p class="font-semibold text-slate-900">{{ row.createdBy || 'System' }}</p>
                                <div class="flex items-center gap-2">
                                    <UiBadge :variant="displayRiskVariant(row.risk)" icon="verified">
                                        {{ displayRiskLabel(row.risk) }}
                                    </UiBadge>
                                    <span class="text-xs text-slate-500">{{ row.updatedLabel }}</span>
                                </div>
                            </div>
                        </template>

                        <template #cell-actions="{ row }">
                            <div class="flex items-center justify-end gap-2">
                                <UiButton variant="outline" icon-only leading-icon="visibility" />
                                <UiButton variant="outline" icon-only leading-icon="edit"
                                    @click="router.push(AppRoute.PAYROLL_BUILDER)" />
                                <UiButton variant="outline" icon-only leading-icon="group_add"
                                    @click="openAssignmentModal(row)" />
                            </div>
                        </template>
                    </UiTable>
                </div>

                <div
                    class="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
                    <p class="text-sm text-slate-500">
                        Showing
                        <span class="font-semibold text-slate-900">{{ filteredRows.length === 0 ? 0 : (currentPage - 1)
                            * pageSize + 1
                            }}</span>
                        to
                        <span class="font-semibold text-slate-900">{{ Math.min(currentPage * pageSize,
                            filteredRows.length) }}</span>
                        of
                        <span class="font-semibold text-slate-900">{{ filteredRows.length }}</span>
                        policies
                    </p>

                    <div class="flex items-center gap-2">
                        <UiButton variant="outline" icon-only :disabled="currentPage <= 1"
                            @click="setPage(currentPage - 1)">
                            <UiIcon name="chevron_left" size="18" />
                        </UiButton>

                        <UiButton v-for="page in pageButtons" :key="page"
                            :variant="page === currentPage ? 'primary' : 'outline'" @click="setPage(page)">
                            {{ page }}
                        </UiButton>

                        <UiButton variant="outline" icon-only :disabled="currentPage >= totalPages"
                            @click="setPage(currentPage + 1)">
                            <UiIcon name="chevron_right" size="18" />
                        </UiButton>
                    </div>
                </div>
            </UiCard>
        </div>

        <PolicyAssignmentModal v-model="showAssignmentModal" :policy-name="selectedPolicy?.name ?? 'Payroll Policy'"
            @confirm="handleAssignmentConfirm" />
    </AppLayout>
</template>
