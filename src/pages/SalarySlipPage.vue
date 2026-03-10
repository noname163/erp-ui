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
import { salaryService, type SelectionOptionResponse } from '@/services/salary.service'
import { userProfileService } from '@/services/user-profile.service'
import { useRouter } from 'vue-router'
import { AppRoute } from '@/types'

const router = useRouter()
const loading = ref(false)
const loadingOptions = ref(false)
const loadingTemplateDetails = ref(false)
const error = ref('')
const message = ref('')

const today = new Date().toISOString().slice(0, 10)

const LS_DRAFT = 'erp.salarySlip.draft'

type SelectOption = { value: string; label: string }

const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'VND', label: 'VND - Vietnamese Dong' },
]

const employeeOptions = ref<SelectOption[]>([])
const salaryTemplateOptions = ref<SelectOption[]>([])
const salaryCodeOptions = ref<SelectOption[]>([])
const selectedSalaryTemplateCode = ref('')

const master = ref({
    userProfileCode: '',
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

const details = ref<SalaryDetailRow[]>([])

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
        var response = await employeeSalaryService.createSlip(compiledPayload.value)
        localStorage.removeItem(LS_DRAFT)
        message.value = 'Employee salary entry submitted'
        console.log('Created salary slip:', response)
        if(response.success==true){
            router.push(AppRoute.SALARY_SLIP_LIST)
        }
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Create employee salary slip failed'
    } finally {
        loading.value = false
    }
}

function addDetail() {
    details.value.push({ salaryCode: salaryCodeOptions.value[0]?.value ?? '', amount: '0', remark: '' })
}

function removeDetail(i: number) {
    details.value.splice(i, 1)
}

function normalizeOptions(res: any): SelectionOptionResponse[] {
    const raw = (res?.content ?? res?.data ?? res?.options ?? res ?? []) as any[]
    if (!Array.isArray(raw)) return []
    return raw
        .filter((item) => item?.code && item?.name)
        .map((item) => ({ code: String(item.code), name: String(item.name) }))
}

function normalizeUserOptions(res: any): SelectOption[] {
    const raw = (res?.content ?? res?.data ?? res?.options ?? res ?? []) as any[]
    if (!Array.isArray(raw)) return []
    return raw
        .map((item: any) => {
            const value = String(item?.code ?? item?.userProfileCode ?? item?.id ?? '').trim()
            const label = String(item?.name ?? item?.fullName ?? item?.email ?? value).trim()
            return value ? { value, label } : null
        })
        .filter((x: SelectOption | null): x is SelectOption => Boolean(x))
}

function toUiOptions(items: SelectionOptionResponse[]) {
    return items.map((item) => ({ value: item.code, label: item.name }))
}

function normalizeTemplateDetails(res: any): SalaryDetailRow[] {
    const raw = (res?.content ?? res?.data ?? res?.details ?? res ?? []) as any[]
    if (!Array.isArray(raw)) return []
    return raw
        .map((item: any) => {
            const salaryCode = String(item?.salaryCode ?? item?.code ?? '').trim()
            if (!salaryCode) return null
            return {
                salaryCode,
                amount: String(item?.amount ?? '0'),
                remark: String(item?.remark ?? item?.description ?? ''),
            }
        })
        .filter((x: SalaryDetailRow | null): x is SalaryDetailRow => Boolean(x))
}

async function loadSelectionOptions() {
    loadingOptions.value = true
    error.value = ''
    try {
        const [employeeRes, templateRes, salaryCodeRes] = await Promise.all([
            userProfileService.options(),
            salaryService.templateOptions({ page: 0, size: 200, sortDir: 'ASC' }),
            salaryService.salaryOptions({ page: 0, size: 200, sortDir: 'ASC' }),
        ])

        employeeOptions.value = normalizeUserOptions(employeeRes)
        salaryTemplateOptions.value = toUiOptions(normalizeOptions(templateRes))
        salaryCodeOptions.value = toUiOptions(normalizeOptions(salaryCodeRes))

        if (!master.value.userProfileCode) {
            master.value.userProfileCode = employeeOptions.value[0]?.value ?? ''
        }
        if (details.value.length === 0) {
            addDetail()
        }
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Failed to load options'
    } finally {
        loadingOptions.value = false
    }
}

async function onTemplateChange(code: string) {
    selectedSalaryTemplateCode.value = code
    if (!code) return
    loadingTemplateDetails.value = true
    error.value = ''
    try {
        const res = await salaryService.templateDetails(code)
        const templateDetails = normalizeTemplateDetails(res)
        details.value = templateDetails.length > 0 ? templateDetails : [{ salaryCode: salaryCodeOptions.value[0]?.value ?? '', amount: '0', remark: '' }]
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Failed to load template details'
    } finally {
        loadingTemplateDetails.value = false
    }
}

function resetForm() {
    master.value = {
        userProfileCode: employeeOptions.value[0]?.value ?? '',
        effectiveFrom: today,
        effectiveTo: today,
        currency: 'USD',
    }
    selectedSalaryTemplateCode.value = ''
    details.value = [{ salaryCode: salaryCodeOptions.value[0]?.value ?? '', amount: '0', remark: '' }]
    error.value = ''
    message.value = ''
}

function saveDraft() {
    error.value = ''
    message.value = ''
    try {
        localStorage.setItem(LS_DRAFT, JSON.stringify({
            master: master.value,
            details: details.value,
            selectedSalaryTemplateCode: selectedSalaryTemplateCode.value,
        }))
        message.value = 'Draft saved locally'
    } catch {
        error.value = 'Failed to save draft'
    }
}

async function loadDraft() {
    const raw = localStorage.getItem(LS_DRAFT)
    if (!raw) return
    try {
        const parsed = JSON.parse(raw) as { master?: typeof master.value; details?: SalaryDetailRow[]; selectedSalaryTemplateCode?: string }
        if (parsed.master) master.value = parsed.master
        if (Array.isArray(parsed.details)) details.value = parsed.details
        if (parsed.selectedSalaryTemplateCode) {
            selectedSalaryTemplateCode.value = parsed.selectedSalaryTemplateCode
            if (!Array.isArray(parsed.details) || parsed.details.length === 0) {
                await onTemplateChange(parsed.selectedSalaryTemplateCode)
            }
        }
    } catch {
        // ignore
    }
}

onMounted(async () => {
    await loadSelectionOptions()
    await loadDraft()
})

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
                    <UiButton variant="outline" leadingIcon="close" :disabled="loading" @click="router.push(AppRoute.SALARY_SLIP_LIST)">Cancel
                    </UiButton>
                    <UiButton variant="primary" leadingIcon="save" :disabled="loading" @click="createSlip">Save Entry
                    </UiButton>
                </div>
            </div>

            <div v-if="error" class="mb-4 text-sm text-red-500">{{ error }}</div>
            <div v-if="message" class="mb-4 text-sm text-green-600">{{ message }}</div>
            <div v-if="loadingOptions" class="mb-4 text-sm text-slate-500">Loading options...</div>

            <div class="ui-card mb-8 overflow-visible">
                <div class="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center gap-2">
                    <UiIcon name="info" class="text-primary" />
                    <h2 class="text-slate-900 dark:text-white text-lg font-bold">General Information</h2>
                </div>
                <div class="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">
                    <div class="sm:col-span-2 lg:col-span-4">
                        <UiSelect v-model="master.userProfileCode" label="Employee" required
                            placeholder="Select Employee (Name / ID)" :options="employeeOptions" :disabled="loadingOptions" />
                    </div>
                    <div class="lg:col-span-3">
                        <UiSelect
                            v-model="selectedSalaryTemplateCode"
                            label="Salary Template"
                            placeholder="Select template"
                            :options="salaryTemplateOptions"
                            :disabled="loadingOptions || loadingTemplateDetails"
                            @update:modelValue="onTemplateChange"
                        />
                    </div>
                    <div class="lg:col-span-2">
                        <UiSelect v-model="master.currency" label="Currency" required :options="currencyOptions" />
                    </div>
                    <div class="sm:col-span-2 lg:col-span-3">
                        <UiInput :model-value="totalAmount" label="Total Amount (Auto)" disabled
                            hint="Auto-calculated from salary details" />
                    </div>

                    <div class="lg:col-span-3">
                        <UiInput v-model="master.effectiveFrom" label="Effective From" type="date" required />
                    </div>
                    <div class="lg:col-span-3">
                        <UiInput v-model="master.effectiveTo" label="Effective To" type="date" required />
                    </div>
                </div>
            </div>

            <div class="ui-card">
                <div
                    class="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <UiIcon name="payments" class="text-primary" />
                        <h2 class="text-slate-900 dark:text-white text-lg font-bold">Salary Details</h2>
                    </div>
                    <UiButton variant="outline" leadingIcon="add" :disabled="loading || loadingTemplateDetails || loadingOptions" @click="addDetail">Add New Row
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
