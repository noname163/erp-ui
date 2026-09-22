<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { http } from '@/services/http'
import UiButton from '@/components/ui/UiButton.vue'
const props = defineProps<{ resultCode: string; employeeName: string; initialPeriod?: string; initialCurrency?: string; initialSalary?: number }>()
type Line = { kind: string; label: string; amount: number; formula: string; currency: string }
type Payslip = { period: string; currency: string; expectedAmount: number; grossEarnings: number; totalDeductions: number; netPay: number; policyName: string; policyCode: string; policyEffectiveFrom: string; statutoryVersion: string; inputVersion: string; hours: Record<string, number>; lines: Line[]; notes: string[] }
type VietnamRegion = { region: number; description: string; minimumWageVnd: number; ruleVersion: string }
const fallbackRegions: VietnamRegion[] = [
  { region: 1, description: 'Major designated urban areas, including central Hanoi and Ho Chi Minh City', minimumWageVnd: 5310000, ruleVersion: 'VN-2026' },
  { region: 2, description: 'Designated provincial cities, towns and industrial districts', minimumWageVnd: 4730000, ruleVersion: 'VN-2026' },
  { region: 3, description: 'Other designated districts with an intermediate statutory minimum', minimumWageVnd: 4140000, ruleVersion: 'VN-2026' },
  { region: 4, description: 'Remaining localities not listed in Regions I, II or III', minimumWageVnd: 3700000, ruleVersion: 'VN-2026' }
]
const loading = ref(true), saving = ref(false), error = ref(''), message = ref(''), showSetup = ref(false)
const payslip = ref<Payslip | null>(null)
const initialMonth = /^\d{4}-\d{2}/.test(props.initialPeriod ?? '') ? props.initialPeriod!.slice(0, 7) : new Date().toISOString().slice(0, 7)
const period = ref(initialMonth), currency = ref(props.initialCurrency || 'VND'), effectiveFrom = ref(`${initialMonth}-01`)
const minimumWages = Number(initialMonth.slice(0, 4)) >= 2026 ? [5310000,4730000,4140000,3700000] : [4960000,4410000,3860000,3450000]
fallbackRegions.forEach((region, index) => { region.minimumWageVnd = minimumWages[index]; region.ruleVersion = Number(initialMonth.slice(0,4)) >= 2026 ? 'VN-2026' : 'VN-2024-07' })
const emptyInputs = () => {
  const fx = currency.value === 'VND' ? 1 : currency.value === 'USD' ? 26180 : 1
  const salary = props.initialSalary && props.initialSalary > 0 ? props.initialSalary : minimumWages[0] / fx
  const [year, month] = period.value.split('-').map(Number)
  let expectedHours = 0
  for (let day = 1; day <= new Date(year, month, 0).getDate(); day++) {
    const weekday = new Date(year, month - 1, day).getDay()
    if (weekday !== 0 && weekday !== 6) expectedHours += 8
  }
  return { taxResident: true, dependents: 0, insuranceRegion: 1, socialInsurance: true, healthInsurance: true, unemploymentInsurance: true, insuranceSalary: salary as string | number, overtimeHourlyRate: Number((salary / expectedHours).toFixed(6)) as string | number, taxExemptAllowances: 0, otherTaxRelief: 0, otherDeduction: 0, deductionReason: 'No additional deduction', insuranceExemptionReason: 'Not applicable: all insurance contributions enabled', exchangeRateToVnd: fx as string | number, exchangeRateSource: currency.value === 'VND' ? 'VND salary; no conversion' : 'Reference: Vietcombank selling rate 2026-09-17, 26,180 VND/USD; review for payroll date' }
}
const inputs = ref(emptyInputs())
const vietnamDefaults = ref(emptyInputs())
const vietnamRegions = ref<VietnamRegion[]>(fallbackRegions)
const selectedRegion = computed(() => vietnamRegions.value.find(r => r.region === Number(inputs.value.insuranceRegion)))
const regionMinimumInSalaryCurrency = computed(() => {
  const minimum = selectedRegion.value?.minimumWageVnd
  if (!minimum) return null
  if (currency.value === 'VND') return minimum
  const rate = Number(inputs.value.exchangeRateToVnd)
  return rate > 0 ? minimum / rate : null
})
const groups = [{kind:'EARNING',label:'Earnings'},{kind:'DEDUCTION',label:'Employee deductions'},{kind:'TAX_BAND',label:'Tax calculation in VND'},{kind:'INFO',label:'How the calculation works'},{kind:'EMPLOYER',label:'Employer contributions (paid by the company)'}]
const grouped = computed(() => groups.map(g => ({ ...g, lines: payslip.value?.lines.filter(l => l.kind === g.kind) ?? [] })).filter(g => g.lines.length))
function amount(value: number, unit: string) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: unit === 'VND' ? 0 : 2 }).format(value)} ${unit}`
}
async function load() {
  loading.value = true; error.value = ''
  try {
    const {data} = await http.get(`/api/payroll-payslips/${encodeURIComponent(props.resultCode)}`)
    payslip.value = data.payslip; period.value = data.period || period.value; currency.value = data.currency || currency.value
    effectiveFrom.value = `${period.value}-01`
    const populated = (value: Record<string, unknown> | null) => Object.fromEntries(Object.entries(value ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== ''))
    vietnamDefaults.value = { ...emptyInputs(), ...populated(data.defaults) }
    vietnamRegions.value = data.vietnamRegions?.length ? data.vietnamRegions : fallbackRegions
    inputs.value = { ...vietnamDefaults.value, ...populated(data.inputs) }
    if (!data.payslip) message.value = data.message
  } catch (e: any) { error.value = e?.response?.data?.detail || e?.response?.data?.message || 'Unable to load monthly payslip. Editable estimates are shown from the payroll list; retry loading before saving.' }
  finally { loading.value = false }
}
function applyVietnamDefaults() {
  const region = inputs.value.insuranceRegion
  inputs.value = { ...vietnamDefaults.value, insuranceRegion: region }
  applyRegionDefaults()
}
function applyRegionDefaults() {
  const defaultSalary = Number(vietnamDefaults.value.insuranceSalary)
  const statutoryMinimum = Number(regionMinimumInSalaryCurrency.value ?? 0)
  inputs.value.insuranceSalary = Math.max(defaultSalary || 0, statutoryMinimum)
}
async function save() {
  saving.value = true; error.value = ''; message.value = ''
  try {
    const {data} = await http.post(`/api/payroll-payslips/${encodeURIComponent(props.resultCode)}/configuration`, {
      effectiveFrom: effectiveFrom.value,
      inputs: { ...inputs.value, insuranceSalary: Number(inputs.value.insuranceSalary), overtimeHourlyRate: Number(inputs.value.overtimeHourlyRate), exchangeRateToVnd: currency.value === 'VND' ? 1 : Number(inputs.value.exchangeRateToVnd) }
    })
    message.value = data.message; showSetup.value = false
  } catch(e:any) { error.value = e?.response?.data?.message || 'Unable to save payroll setup.' }
  finally { saving.value = false }
}
onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div><h3 class="text-lg font-semibold">{{ employeeName }}</h3><p class="text-sm text-slate-500">{{ period }} · {{ currency }}</p></div>
      <UiButton variant="outline" @click="showSetup = !showSetup">{{ showSetup ? 'Hide setup' : 'Payroll setup' }}</UiButton>
    </div>
    <p v-if="loading" role="status">Loading monthly payslip...</p>
    <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-3 text-red-800">{{ error }}</p>
    <p v-if="message" role="status" class="rounded-lg bg-blue-50 p-3 text-blue-900">{{ message }}</p>
    <form v-if="showSetup" class="space-y-4 rounded-xl border border-slate-200 p-4" @submit.prevent="save">
      <h3 class="font-semibold">Employee payroll setup</h3>
      <p class="text-sm text-slate-600">Confirm the employee's tax status and insurance eligibility. Values apply monthly from the effective date until replaced. Saved payslips keep their original inputs. Tax calculation supports resident employment contracts of at least three months and non-resident employment.</p>
      <p class="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Vietnam defaults assume a resident employee with no dependents, Region 1, and mandatory social, health, and unemployment insurance. Insurance salary defaults to the employee salary and overtime wage defaults to salary divided by expected hours. Confirm employee-specific eligibility before saving.</p>
      <div class="grid gap-4 sm:grid-cols-2">
        <label>Effective from<input v-model="effectiveFrom" required type="date" class="field" /></label>
        <div>
          <label>Insurance region<select v-model.number="inputs.insuranceRegion" class="field" @change="applyRegionDefaults"><option v-for="region in vietnamRegions" :key="region.region" :value="region.region">Region {{ region.region }} — {{ region.description }}</option></select></label>
          <p v-if="selectedRegion" class="mt-2 text-xs text-slate-600">{{ selectedRegion.description }}. Regional minimum: {{ amount(selectedRegion.minimumWageVnd, 'VND') }}/month ({{ selectedRegion.ruleVersion }}). Confirm the employee's exact workplace classification.</p>
        </div>
        <label>Registered dependents<input v-model.number="inputs.dependents" required type="number" min="0" max="100" step="1" class="field" /></label>
        <label>Monthly insurance salary ({{ currency }})<input v-model="inputs.insuranceSalary" required type="number" min="0" step="any" class="field" /></label>
        <label>Eligible overtime wage per hour ({{ currency }})<input v-model="inputs.overtimeHourlyRate" required type="number" min="0.000001" step="any" class="field" /></label>
        <label>Tax-exempt allowances included in earnings ({{ currency }})<input v-model.number="inputs.taxExemptAllowances" required type="number" min="0" step="any" class="field" /></label>
        <label>Other eligible monthly tax relief ({{ currency }})<input v-model.number="inputs.otherTaxRelief" required type="number" min="0" step="any" class="field" /></label>
        <label>Other monthly deduction ({{ currency }})<input v-model.number="inputs.otherDeduction" required type="number" min="0" step="any" class="field" /></label>
        <label>Deduction reason<input v-model="inputs.deductionReason" :required="inputs.otherDeduction > 0" maxlength="300" class="field" /></label>
        <label>Insurance exemption / ineligibility reason<input v-model="inputs.insuranceExemptionReason" :required="!inputs.socialInsurance || !inputs.healthInsurance || !inputs.unemploymentInsurance" maxlength="300" class="field" /></label>
        <template v-if="currency !== 'VND'">
          <label>VND per 1 {{ currency }}<input v-model="inputs.exchangeRateToVnd" required type="number" min="0.000001" step="any" class="field" /></label>
          <label>Exchange rate source / date<input v-model="inputs.exchangeRateSource" required maxlength="300" class="field" /></label>
        </template>
      </div>
      <div class="flex flex-wrap gap-4 text-sm">
        <label><input v-model="inputs.taxResident" type="checkbox" /> Vietnam tax resident</label>
        <label><input v-model="inputs.socialInsurance" type="checkbox" /> Social insurance applies</label>
        <label><input v-model="inputs.healthInsurance" type="checkbox" /> Health insurance applies</label>
        <label><input v-model="inputs.unemploymentInsurance" type="checkbox" /> Unemployment insurance applies</label>
      </div>
      <p class="text-xs text-slate-600">Employee status and salary defaults are editable assumptions. Regional wage minimums follow the payroll year. If salary details are unavailable, the hourly estimate uses eight-hour weekdays. The USD conversion is a dated reference, not a statutory exchange rate.</p>
      <div class="flex flex-wrap gap-3">
        <UiButton type="submit" :disabled="saving || loading">{{ saving ? 'Saving...' : 'Save confirmed payroll inputs' }}</UiButton>
        <UiButton type="button" variant="outline" @click="applyVietnamDefaults">Use defaults for Region {{ inputs.insuranceRegion }}</UiButton>
      </div>
    </form>
    <template v-if="payslip">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="summary"><span>Expected salary</span><strong>{{ amount(payslip.expectedAmount, payslip.currency) }}</strong></div>
        <div class="summary"><span>Gross earnings</span><strong>{{ amount(payslip.grossEarnings, payslip.currency) }}</strong></div>
        <div class="summary"><span>Employee deductions</span><strong>{{ amount(payslip.totalDeductions, payslip.currency) }}</strong></div>
        <div class="summary bg-emerald-50"><span>Take-home pay</span><strong>{{ amount(payslip.netPay, payslip.currency) }}</strong></div>
      </div>
      <section><h3 class="mb-3 font-semibold">Working time</h3><dl class="grid grid-cols-2 gap-3 sm:grid-cols-3"><div v-for="(value,label) in payslip.hours" :key="label" class="rounded-lg border p-3"><dt class="text-xs text-slate-500">{{ label }}</dt><dd class="mt-1 font-semibold">{{ Number(value).toLocaleString(undefined, {maximumFractionDigits: 4}) }} hours</dd></div></dl></section>
      <section v-for="group in grouped" :key="group.kind">
        <h3 class="mb-2 font-semibold">{{ group.label }}</h3>
        <div class="overflow-x-auto rounded-lg border"><table class="w-full text-left text-sm"><thead class="bg-slate-50"><tr><th class="p-3">Item</th><th class="p-3">Calculation / reason</th><th class="p-3 text-right">Amount</th></tr></thead><tbody class="divide-y"><tr v-for="(line,index) in group.lines" :key="index"><td class="p-3">{{ line.label }}</td><td class="min-w-56 p-3 text-slate-600">{{ line.formula }}</td><td class="whitespace-nowrap p-3 text-right font-medium">{{ group.kind === 'DEDUCTION' ? '−' : group.kind === 'EARNING' ? '+' : '' }}{{ amount(line.amount,line.currency) }}</td></tr></tbody></table></div>
      </section>
      <div class="rounded-xl bg-slate-900 p-4 text-white"><p class="text-sm">Take-home pay = gross earnings − employee deductions</p><p class="mt-2 text-lg font-semibold">{{ amount(payslip.grossEarnings,payslip.currency) }} − {{ amount(payslip.totalDeductions,payslip.currency) }} = {{ amount(payslip.netPay,payslip.currency) }}</p></div>
      <p v-for="note in payslip.notes" :key="note" class="text-sm text-slate-600">{{ note }}</p>
      <p class="border-t pt-3 text-xs text-slate-500">Policy: {{ payslip.policyName }} · Effective {{ payslip.policyEffectiveFrom }} · Rules {{ payslip.statutoryVersion }} · Input version {{ payslip.inputVersion }}</p>
    </template>
  </div>
</template>
<style scoped>
.field { display:block; width:100%; margin-top:.35rem; border:1px solid #cbd5e1; border-radius:.5rem; padding:.5rem; color:#0f172a; background:white; }
label { font-size:.875rem; }
.summary { border:1px solid #e2e8f0; border-radius:.75rem; padding:1rem; }
.summary span { display:block; color:#64748b; font-size:.75rem; }
.summary strong { display:block; margin-top:.5rem; }
</style>
