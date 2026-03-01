<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import UiInlineInput from '@/components/ui/UiInlineInput.vue'
import UiInlineSelect from '@/components/ui/UiInlineSelect.vue'
import { employeeSalaryService, type EmployeeSalarySlipDetailRequest, type EmployeeSalarySlipRequest } from '@/services/employee-salary.service'

const loading = ref(false)
const error = ref('')
const message = ref('')

const today = new Date().toISOString().slice(0, 10)

const LS_DRAFT = 'erp.salarySlip.draft'

const employeeOptions = [
    { value: 'USR-000001', label: 'John Doe' },
    { value: 'USR-000002', label: 'Jane Smith' },
    { value: 'USR-000003', label: 'Michael Scott' },
]

const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'VND', label: 'VND - Vietnamese Dong' },
]

const salaryCodeOptions = [
    { value: 'SAL-000002', label: 'Base Pay' },
    { value: 'SAL-000001', label: 'Housing Allowance' },
    { value: 'SAL-000003', label: 'Transport' },
]

const master = ref({
    userProfileCode: employeeOptions[0]?.value ?? '',
    effectiveFrom: today,
    effectiveTo: today,
    currency: 'USD',
})

function parseDecimal(input: string) {
    const raw = (input ?? '').trim()
    if (!raw) return { sign: 1 as 1 | -1, digits: '0', scale: 0 }

    const sign = raw.startsWith('-') ? (-1 as const) : (1 as const)
    const unsigned = raw.replace(/^[+-]/, '')

    const [intPartRaw, fracPartRaw = ''] = unsigned.split('.')
    const intPart = ((intPartRaw || '0').replace(/[^0-9]/g, '') || '0').replace(/^0+(?=\d)/, '')
    const fracPart = (fracPartRaw || '').replace(/[^0-9]/g, '')
    const scale = fracPart.length
    const digits = (intPart + fracPart).replace(/^0+(?=\d)/, '')

    return { sign, digits: digits || '0', scale }
}

function formatScaledBigInt(value: bigint, scale: number) {
    const negative = value < 0n
    const abs = negative ? -value : value
    const s = abs.toString()

    if (scale <= 0) return `${negative ? '-' : ''}${s}`

    const pad = scale - s.length + 1
    const whole = pad > 0 ? '0' : (s.slice(0, -scale) || '0')
    const frac = (pad > 0 ? '0'.repeat(pad) + s : s).slice(-scale)
    const trimmedFrac = frac.replace(/0+$/, '')
    return `${negative ? '-' : ''}${whole}${trimmedFrac ? `.${trimmedFrac}` : ''}`
}

function sumDecimalStrings(values: string[]) {
    const parsed = values.map(parseDecimal)
    const maxScale = parsed.reduce((m, p) => Math.max(m, p.scale), 0)

    let total = 0n
    for (const p of parsed) {
        const scaleDiff = maxScale - p.scale
        const factor = scaleDiff > 0 ? BigInt('1' + '0'.repeat(scaleDiff)) : 1n
        const mag = BigInt(p.digits || '0') * factor
        total += (p.sign === -1 ? -mag : mag)
    }

    return formatScaledBigInt(total, maxScale)
}

type SalaryDetailRow = EmployeeSalarySlipDetailRequest & { remark: string }

const details = ref<SalaryDetailRow[]>([
    { salaryCode: 'BASE', amount: '4500', remark: 'Standard monthly base salary' },
    { salaryCode: 'ALLOWANCE', amount: '750', remark: 'Fixed city tier allowance' },
    { salaryCode: 'TRANSPORT', amount: '200', remark: 'Commuting coverage' },
])

const totalAmount = computed(() => sumDecimalStrings(details.value.map(d => d.amount)))

const compiledPayload = computed<EmployeeSalarySlipRequest>(() => ({
    ...master.value,
    totalAmount: totalAmount.value,
    salaryDetails: details.value.map(d => ({
        salaryCode: d.salaryCode,
        amount: d.amount,
    })),
}))

const canSubmit = computed(() => {
    if (!master.value.userProfileCode) return false
    if (!master.value.currency) return false
    if (!master.value.effectiveFrom || !master.value.effectiveTo) return false
    if (details.value.length === 0) return false
    return details.value.every(d => d.salaryCode.trim() && d.amount.trim())
})

async function createSlip() {
    if (!canSubmit.value) {
        error.value = 'Please fill in all required fields before submitting.'
        return
    }
    loading.value = true
    error.value = ''
    message.value = ''
    try {
        await employeeSalaryService.createSlip(compiledPayload.value)
        localStorage.removeItem(LS_DRAFT)
        message.value = 'Employee salary entry submitted'
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Create employee salary slip failed'
    } finally {
        loading.value = false
    }
}

function addDetail() {
    details.value.push({ salaryCode: salaryCodeOptions[0]?.value ?? '', amount: '0', remark: '' })
}

function removeDetail(i: number) {
    details.value.splice(i, 1)
}

function resetForm() {
    master.value = {
        userProfileCode: employeeOptions[0]?.value ?? '',
        effectiveFrom: today,
        effectiveTo: today,
        currency: 'USD',
    }
    details.value = [
        { salaryCode: 'BASE', amount: '4500', remark: 'Standard monthly base salary' },
        { salaryCode: 'ALLOWANCE', amount: '750', remark: 'Fixed city tier allowance' },
        { salaryCode: 'TRANSPORT', amount: '200', remark: 'Commuting coverage' },
    ]
    error.value = ''
    message.value = ''
}

function saveDraft() {
    error.value = ''
    message.value = ''
    try {
        localStorage.setItem(LS_DRAFT, JSON.stringify({ master: master.value, details: details.value }))
        message.value = 'Draft saved locally'
    } catch {
        error.value = 'Failed to save draft'
    }
}

function loadDraft() {
    const raw = localStorage.getItem(LS_DRAFT)
    if (!raw) return
    try {
        const parsed = JSON.parse(raw) as { master?: typeof master.value; details?: SalaryDetailRow[] }
        if (parsed.master) master.value = parsed.master
        if (Array.isArray(parsed.details)) details.value = parsed.details
    } catch {
        // ignore
    }
}

onMounted(loadDraft)

const tableHeaders: UiTableHeader[] = [
    { key: 'salaryCode', label: 'Salary Code', thClass: 'w-1/4' },
    { key: 'amount', label: 'Amount', thClass: 'w-1/4' },
    { key: 'remark', label: 'Remarks/Specific Details', thClass: 'w-1/3' },
    { key: 'action', label: 'Action', align: 'center', thClass: 'w-16' },
]
</script>

<template>
    <AppLayout>
        <div class="max-w-5xl mx-auto px-2 md:px-0 py-2 md:py-0">
            <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">Employee
                        Salaries Entry</h1>
                    <p class="text-slate-500 dark:text-slate-400 text-base mt-1">
                        Manage and record individual employee salary components and effective dates.
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <UiButton variant="outline" leadingIcon="close" :disabled="loading" @click="resetForm">Cancel
                    </UiButton>
                    <UiButton variant="primary" leadingIcon="save" :disabled="loading" @click="createSlip">Save Entry
                    </UiButton>
                </div>
            </div>

            <div v-if="error" class="mb-4 text-sm text-red-500">{{ error }}</div>
            <div v-if="message" class="mb-4 text-sm text-green-600">{{ message }}</div>

            <div class="ui-card mb-8">
                <div class="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center gap-2">
                    <UiIcon name="info" class="text-primary" />
                    <h2 class="text-slate-900 dark:text-white text-lg font-bold">General Information</h2>
                </div>
                <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="lg:col-span-2">
                        <UiSelect v-model="master.userProfileCode" label="Employee" required
                            placeholder="Select Employee (Name / ID)" :options="employeeOptions" />
                    </div>
                    <UiInput v-model="master.effectiveFrom" label="Effective From" type="date" required />
                    <UiInput v-model="master.effectiveTo" label="Effective To" type="date" required />

                    <UiSelect v-model="master.currency" label="Currency" required :options="currencyOptions" />
                    <UiInput :model-value="totalAmount" label="Total Amount (Auto)" disabled
                        hint="Auto-calculated from salary details" />
                </div>
            </div>

            <div class="ui-card">
                <div
                    class="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <UiIcon name="payments" class="text-primary" />
                        <h2 class="text-slate-900 dark:text-white text-lg font-bold">Salary Details</h2>
                    </div>
                    <UiButton variant="outline" leadingIcon="add" :disabled="loading" @click="addDetail">Add New Row
                    </UiButton>
                </div>

                <UiTable :headers="tableHeaders" :rows="details" :row-key="(_, i) => i"
                    head-class="bg-slate-50 dark:bg-slate-900/50" body-class="divide-slate-100 dark:divide-slate-800"
                    row-class="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    empty-text="No salary details. Add a row to begin.">
                    <template #cell-salaryCode="{ row, index }">
                        <UiInlineSelect v-model="details[index].salaryCode" :options="salaryCodeOptions"
                            placeholder="Select salary code" />
                    </template>

                    <template #cell-amount="{ index }">
                        <UiInlineInput v-model="details[index].amount" type="text" placeholder="0" />
                    </template>

                    <template #cell-remark="{ index }">
                        <UiInlineInput v-model="details[index].remark" type="text"
                            placeholder="Add specific details..." />
                    </template>

                    <template #cell-action="{ index }">
                        <button class="text-slate-400 hover:text-red-500 transition-colors" type="button"
                            @click="removeDetail(index)">
                            <UiIcon name="delete" size="20px" />
                        </button>
                    </template>
                </UiTable>

                <div class="p-6 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                    <div class="text-right">
                        <p class="text-xs font-bold text-slate-500 uppercase">Sub-Total</p>
                        <p class="text-2xl font-black text-primary">{{ totalAmount }}</p>
                    </div>
                </div>
            </div>

            <div
                class="mt-8 flex flex-col sm:flex-row items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div class="flex items-center gap-4 mb-4 sm:mb-0">
                    <div class="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <UiIcon :name="canSubmit ? 'verified' : 'error'" />
                    </div>
                    <div>
                        <p class="text-sm font-bold text-slate-800 dark:text-white">
                            {{ canSubmit ? 'Form Validation Passed' : 'Validation Needed' }}
                        </p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            {{ canSubmit ? 'Ready to POST to /api/employee-salaries' : 'Please complete required fields before submitting.' }}
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <UiButton variant="outline" leadingIcon="description" :disabled="loading" @click="saveDraft">Save
                        Draft
                    </UiButton>
                    <UiButton variant="primary" leadingIcon="send" :disabled="loading || !canSubmit"
                        @click="createSlip">
                        Submit Final Entry
                    </UiButton>
                </div>
            </div>

            <div class="mt-6">
                <UiBadge variant="info" icon="info">Amounts are summed as strings to avoid floating point issues.
                </UiBadge>
            </div>
        </div>
    </AppLayout>
</template>
