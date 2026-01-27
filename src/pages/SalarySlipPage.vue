<script setup lang="ts">
import { computed, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { employeeSalaryService, type EmployeeSalarySlipDetailRequest, type EmployeeSalarySlipRequest } from '@/services/employee-salary.service'

const loading = ref(false)
const error = ref('')
const message = ref('')

const today = new Date().toISOString().slice(0, 10)

const master = ref({
  userProfileCode: 'EMP001',
  effectiveFrom: today,
  effectiveTo: today,
  currency: 'VND',
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

const details = ref<EmployeeSalarySlipDetailRequest[]>([
  { salaryCode: 'BASE', amount: '15000000' },
  { salaryCode: 'ALLOWANCE', amount: '3000000' },
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

async function createSlip() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await employeeSalaryService.createSlip(compiledPayload.value)
    message.value = 'Employee salary slip created'
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Create employee salary slip failed'
  } finally {
    loading.value = false
  }
}

function addDetail() {
  details.value.push({ salaryCode: '', amount: '0' })
}

function removeDetail(i: number) {
  details.value.splice(i, 1)
}

</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Employee Salary</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">POST /api/employee-salaries</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="ui-card xl:col-span-2">
        <div class="p-4 md:p-6 space-y-6">
          <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
          <div v-if="message" class="text-sm text-green-600">{{ message }}</div>

          <div>
            <h2 class="font-bold mb-3">1) Create salary slip</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UiInput v-model="master.userProfileCode" label="userProfileCode" required />
              <UiInput v-model="master.currency" label="currency" required />
              <UiInput :model-value="totalAmount" label="totalAmount (sum of details)" disabled />
              <UiInput v-model="master.effectiveFrom" label="effectiveFrom" type="date" required />
              <UiInput v-model="master.effectiveTo" label="effectiveTo" type="date" required />
            </div>
            <div class="mt-4">
              <UiButton variant="primary" :disabled="loading" @click="createSlip">Create slip</UiButton>
            </div>
          </div>

          <div class="border-t border-primary/10 pt-6">
            <div class="flex items-center justify-between">
              <h2 class="font-bold">2) Salary details</h2>
              <UiButton variant="outline" @click="addDetail">Add</UiButton>
            </div>

            <div class="mt-4 space-y-4">
              <div v-for="(d, i) in details" :key="i" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b border-primary/10 pb-4">
                <div class="md:col-span-6">
                  <UiInput v-model="d.salaryCode" label="salaryCode" required />
                </div>
                <div class="md:col-span-6">
                  <UiInput v-model="d.amount" label="amount" required />
                </div>
                <div class="md:col-span-12 flex justify-end">
                  <button type="button" class="text-slate-500 hover:text-red-500" @click="removeDetail(i)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="ui-card">
        <div class="p-4 md:p-6">
          <h2 class="font-bold mb-2">Notes</h2>
          <ul class="text-sm text-slate-500 dark:text-slate-400 list-disc pl-5 space-y-2">
            <li><code>totalAmount</code> is computed as the sum of all detail <code>amount</code> values (string-safe).</li>
            <li>Axios uses <code>withCredentials</code> for cookie auth.</li>
          </ul>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
