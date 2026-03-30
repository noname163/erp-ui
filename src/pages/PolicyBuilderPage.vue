<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import { payrollPolicy, type PayrollPolicyRequest, type SelectionOptionResponse } from '@/services/payroll-policy.service'
import { AppRoute } from '@/types'

type PolicyInterval = 'DAILY' | 'WEEKLY'

type PolicyForm = {
    name: string
    standardQuantity: string
    standardUnit: string
    standardInterval: PolicyInterval
    startTime: string
    endTime: string
    roundingRule: string
    effectiveFrom: string
    effectiveTo: string
}

type ConflictState = {
    tone: 'idle' | 'error' | 'success'
    title: string
    description: string
    icon: string
}

const LS_DRAFT = 'erp.payroll-policy.draft'

const router = useRouter()
const loading = ref(false)
const loadingOptions = ref(false)
const error = ref('')
const message = ref('')

const unitOptions = ref<SelectionOptionResponse[]>([])

const form = ref<PolicyForm>({
    name: 'Standard Regional Operating Hours',
    standardQuantity: '8',
    standardUnit: 'HOUR',
    standardInterval: 'DAILY',
    startTime: '09:00',
    endTime: '17:00',
    roundingRule: '',
    effectiveFrom: '',
    effectiveTo: '',
})

const fallbackUnitOptions = [
    { value: 'HOUR', label: 'HOUR' },
    { value: 'DAY', label: 'DAY' },
    { value: 'PRODUCT', label: 'PRODUCT' },
]

const quantityUnitOptions = computed(() =>
    unitOptions.value.length > 0
        ? unitOptions.value.map((option) => ({ value: option.code, label: option.name }))
        : fallbackUnitOptions,
)

const guidanceCards = [
    {
        icon: 'security',
        title: 'Compliance Lock',
        description: 'All policy changes are recorded automatically for audit review and internal controls.',
    },
    {
        icon: 'group',
        title: 'Auto-Apply',
        description: 'Deployments can be pushed directly to assigned employee groups after validation.',
    },
    {
        icon: 'sync',
        title: 'Sync Interval',
        description: 'Policy updates are synchronized with payroll processing windows every 60 minutes.',
    },
]

const canSubmit = computed(
    () =>
        form.value.name.trim().length > 0 &&
        form.value.effectiveFrom.trim().length > 0 &&
        form.value.effectiveTo.trim().length > 0 
)

const intervalLabel = computed(() => (form.value.standardInterval === 'DAILY' ? 'Daily' : 'Weekly'))

const conflictState = computed<ConflictState>(() => {
    if (!form.value.effectiveFrom) {
        return {
            tone: 'idle',
            title: 'Validation Pending',
            description: 'Select an effective period to validate conflicts against active enterprise policies.',
            icon: 'hourglass_top',
        }
    }

    if (form.value.effectiveTo && form.value.effectiveTo < form.value.effectiveFrom) {
        return {
            tone: 'error',
            title: 'Invalid Date Range',
            description: 'The effective end date must be on or after the selected effective start date.',
            icon: 'error',
        }
    }

    const from = form.value.effectiveFrom
    const to = form.value.effectiveTo || form.value.effectiveFrom
    const overlapsQ3 = from <= '2026-09-30' && to >= '2026-07-01'

    if (overlapsQ3) {
        return {
            tone: 'error',
            title: 'Configuration Conflict',
            description: "The selected 'Effective From' date overlaps with the 'Q3 High Season' legacy policy. Please reconcile periods before saving.",
            icon: 'info',
        }
    }

    return {
        tone: 'success',
        title: 'Ready To Deploy',
        description: 'No conflicting policy windows were detected for the selected dates. This policy is ready for review.',
        icon: 'check_circle',
    }
})

const policyNarrative = computed(
    () =>
        `${form.value.standardQuantity} ${form.value.standardUnit.toLowerCase()} ${intervalLabel.value.toLowerCase()} from ${form.value.startTime} to ${form.value.endTime}`,
)

function restoreDraft() {
    const raw = localStorage.getItem(LS_DRAFT)
    if (!raw) return

    try {
        const parsed = JSON.parse(raw) as Partial<PolicyForm>
        form.value = { ...form.value, ...parsed }
        message.value = 'Draft restored from local storage.'
    } catch {
        localStorage.removeItem(LS_DRAFT)
    }
}

function saveDraft() {
    localStorage.setItem(LS_DRAFT, JSON.stringify(form.value))
    message.value = 'Draft saved locally.'
    error.value = ''
    console.log('Saved draft to localStorage:', form.value)
}

function resolveQuantityValue() {
    const normalized = Number(form.value.standardQuantity)
    if (Number.isInteger(normalized) && normalized > 0) return normalized
    return null
}

function resolveUnitCode() {
    return form.value.standardUnit || quantityUnitOptions.value[0]?.value || 'HOUR'
}

function buildPayload(): PayrollPolicyRequest | null {
    const standardQuantityPerDay = resolveQuantityValue()
    if (standardQuantityPerDay === null) return null
    console.log('Resolved standard quantity per day:', standardQuantityPerDay)
    return {
        name: form.value.name.trim(),
        standardQuantityPerDay,
        unitCode: resolveUnitCode(),
        standardStartTime: form.value.startTime || undefined,
        standardEndTime: form.value.endTime || undefined,
        roundingRule: form.value.roundingRule.trim() || undefined,
        effectiveFrom: form.value.effectiveFrom,
        effectiveTo: form.value.effectiveTo,
    }
}

async function loadOptions() {
    loadingOptions.value = true

    try {
        const unitResponse = await payrollPolicy.systemUnitOptions({ type: 'DURATION', page: 0, size: 100, sortDir: 'ASC' })
        const unitData = (unitResponse?.content ?? unitResponse?.data ?? unitResponse ?? []) as SelectionOptionResponse[]

        unitOptions.value = Array.isArray(unitData) ? unitData.filter((item) => item?.code && item?.name) : []
        if (unitOptions.value.length > 0 && !unitOptions.value.some((item) => item.code === form.value.standardUnit)) {
            form.value.standardUnit = unitOptions.value[0].code
        }
    } catch {
        unitOptions.value = []
    } finally {
        loadingOptions.value = false
    }
}

async function submit() {
    if (!canSubmit.value) {
        error.value = 'Provide name, a positive integer quantity per day, and both effective dates before finalizing.'
        message.value = ''
        return
    }

    if (conflictState.value.tone === 'error' && conflictState.value.title !== 'Validation Pending') {
        error.value = conflictState.value.description
        message.value = ''
        return
    }

    loading.value = true
    error.value = ''
    message.value = ''

    try {
        const payload = buildPayload()
        console.log('Constructed payload for submission:', payload)
        if (!payload) {
            error.value = 'Standard quantity per day must be a positive whole number.'
            return
        }

        await payrollPolicy.createPayrollPolicy(payload)
        localStorage.removeItem(LS_DRAFT)
        await router.push(AppRoute.PAYROLL_POLICIES)
    } catch (err: any) {
        debugger
        error.value = err?.response?.data?.message ?? 'Unable to finalize payroll policy.'
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    restoreDraft()
    void loadOptions()
})
</script>

<template>
    <AppLayout>
        <div class="mx-auto max-w-6xl space-y-8">
            <div class="space-y-3">
                <div class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <span>Policies</span>
                    <UiIcon name="chevron_right" size="14" />
                    <span class="text-primary">Create New</span>
                </div>

                <h1 class="text-4xl font-black tracking-tight text-slate-900">Create Company Payroll Policy</h1>
                <p class="max-w-2xl text-sm leading-6 text-slate-500">
                    Establish regulatory standards for working hours, duration, and effective periods across specific
                    departments or the entire enterprise.
                </p>
            </div>

            <div v-if="error"
                class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {{ error }}
            </div>
            <div v-if="message"
                class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                {{ message }}
            </div>

            <form class="grid grid-cols-1 gap-6 xl:grid-cols-12" @submit.prevent="submit">
                <UiCard class="xl:col-span-8">
                    <UiCardBody class="space-y-6">
                        <div class="space-y-2">
                            <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Policy Name</p>
                            <UiInput v-model="form.name" placeholder="e.g. Standard Regional Operating Hours" />
                            <p class="text-xs text-slate-400">Give this policy a unique descriptive name for internal
                                reporting.</p>
                        </div>

                        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div class="space-y-2">
                                <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Standard
                                    Quantity</p>
                                <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
                                    <UiInput v-model="form.standardQuantity" type="number" step="1" min="1" />
                                    <UiSelect v-model="form.standardUnit" :options="fallbackUnitOptions" />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Standard
                                    Interval</p>
                                <div class="flex rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                                    <button type="button"
                                        class="flex-1 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition-colors"
                                        :class="form.standardInterval === 'DAILY' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:bg-white/60'"
                                        @click="form.standardInterval = 'DAILY'">
                                        Daily
                                    </button>
                                    <button type="button"
                                        class="flex-1 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition-colors"
                                        :class="form.standardInterval === 'WEEKLY' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:bg-white/60'"
                                        @click="form.standardInterval = 'WEEKLY'">
                                        Weekly
                                    </button>
                                </div>
                            </div>
                        </div>
                    </UiCardBody>
                </UiCard>

                <UiCard class="border-slate-200 bg-slate-50 xl:col-span-4">
                    <UiCardBody class="space-y-6">
                        <div class="flex items-center gap-2">
                            <UiIcon name="schedule" size="18" class="text-primary" />
                            <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Shift Windows
                            </p>
                        </div>

                        <div class="space-y-2">
                            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Start Time</p>
                            <UiInput v-model="form.startTime" type="time" />
                        </div>

                        <div class="space-y-2">
                            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">End Time</p>
                            <UiInput v-model="form.endTime" type="time" />
                        </div>

                        <div class="space-y-2">
                            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Rounding Rule</p>
                            <UiInput v-model="form.roundingRule" placeholder="e.g. ROUND_HALF_UP" />
                        </div>

                        <div class="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Policy Snapshot
                            </p>
                            <p class="mt-3 text-sm font-semibold text-slate-900">{{ policyNarrative }}</p>
                            <p class="mt-2 text-xs text-slate-500">
                                {{ loadingOptions ? 'Refreshing unit options for the payroll policy API.' :
                                'Ready to submit directly to the payroll policy endpoint.' }}
                            </p>
                        </div>
                    </UiCardBody>
                </UiCard>

                <div class="grid grid-cols-1 gap-6 xl:col-span-12 xl:grid-cols-12">
                    <UiCard class="xl:col-span-6">
                        <UiCardBody class="space-y-6">
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <UiIcon name="event_available" size="20" />
                                </div>
                                <div>
                                    <h2 class="text-base font-black tracking-tight text-slate-900">Validity Period</h2>
                                    <p class="text-xs text-slate-500">When should this policy take effect?</p>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div class="space-y-2">
                                    <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                        Effective From</p>
                                    <UiInput v-model="form.effectiveFrom" type="date" />
                                </div>
                                <div class="space-y-2">
                                    <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                        Effective To</p>
                                    <UiInput v-model="form.effectiveTo" type="date" />
                                </div>
                            </div>
                        </UiCardBody>
                    </UiCard>

                    <div class="flex flex-col gap-4 xl:col-span-6">
                        <UiCard :class="conflictState.tone === 'error'
                                ? 'border-rose-200 bg-rose-50'
                                : conflictState.tone === 'success'
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : 'border-slate-200 bg-slate-50'
                            ">
                            <UiCardBody class="flex items-start gap-4">
                                <UiIcon :name="conflictState.icon" size="20" :class="conflictState.tone === 'error'
                                        ? 'text-rose-500'
                                        : conflictState.tone === 'success'
                                            ? 'text-emerald-500'
                                            : 'text-slate-400'
                                    " />
                                <div>
                                    <h3 class="text-sm font-black tracking-tight text-slate-900">{{ conflictState.title
                                        }}</h3>
                                    <p class="mt-1 text-sm leading-6 text-slate-600">{{ conflictState.description }}</p>
                                </div>
                            </UiCardBody>
                        </UiCard>

                        <button type="submit"
                            class="group flex h-full min-h-[140px] flex-col justify-between rounded-[1.25rem] border border-primary bg-primary px-6 py-5 text-left text-white shadow-xl shadow-primary/20 transition-transform hover:scale-[1.01]">
                            <div class="flex items-start justify-between">
                                <span class="text-[10px] font-black uppercase tracking-[0.22em] text-white/75">Next
                                    Step</span>
                                <UiIcon name="arrow_forward" size="20"
                                    class="transition-transform group-hover:translate-x-1" />
                            </div>
                            <div>
                                <h3 class="text-xl font-black tracking-tight">Initialize &amp; Deploy Policy</h3>
                                <p class="mt-2 text-sm text-white/80">
                                    Publish this policy into the payroll engine once review is complete.
                                </p>
                            </div>
                        </button>
                    </div>
                </div>

                <div
                    class="flex flex-col gap-4 border-t border-slate-200 pt-6 xl:col-span-12 sm:flex-row sm:items-center sm:justify-between">
                    <UiButton variant="outline" @click="router.push(AppRoute.PAYROLL_POLICIES)">Cancel &amp; Discard
                    </UiButton>

                    <div class="flex flex-col gap-3 sm:flex-row">
                        <UiButton variant="outline" @click="saveDraft">Save Draft</UiButton>
                        <UiButton type="submit" :disabled="loading || !canSubmit">Finalize Policy</UiButton>
                    </div>
                </div>
            </form>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <UiCard v-for="card in guidanceCards" :key="card.title" class="border-slate-200 bg-white/80">
                    <UiCardBody class="flex items-start gap-4">
                        <UiIcon :name="card.icon" size="20" class="mt-0.5 text-slate-500" />
                        <div>
                            <h3 class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">{{ card.title
                                }}</h3>
                            <p class="mt-2 text-sm leading-6 text-slate-500">{{ card.description }}</p>
                        </div>
                    </UiCardBody>
                </UiCard>
            </div>
        </div>
    </AppLayout>
</template>
