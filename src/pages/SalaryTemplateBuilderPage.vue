<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { salaryService, type SalaryTemplateRequest, type SalaryTemplateDetailRequest } from '@/services/salary.service'

const loading = ref(false)
const error = ref('')
const message = ref('')

type SalaryTemplateForm = Omit<SalaryTemplateRequest, 'details' | 'description' | 'currency'> & {
  description: string
  currency: string
}

const template = ref<SalaryTemplateForm>({
  name: 'Default Template',
  description: 'Monthly payroll template',
  totalAmount: '0',
  effectiveFrom: '2025-01-01',
  effectiveTo: '2025-12-31',
  currency: 'VND',
})

const unitOptions = [
  { value: 'MONTH', label: 'MONTH' },
  { value: 'DAY', label: 'DAY' },
  { value: 'HOUR', label: 'HOUR' },
  { value: 'PRODUCT', label: 'PRODUCT' },
]

const details = ref<SalaryTemplateDetailRequest[]>([
  { salaryCode: 'BASE', amount: '15000000', quantity: '1', unitCode: 'MONTH', sequenceOrder: '1' },
  { salaryCode: 'ALLOWANCE', amount: '3000000', quantity: '1', unitCode: 'MONTH', sequenceOrder: '2' },
])

function parseAmount(value: string) {
  const normalized = value.replaceAll(',', '').trim()
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

const totalAmount = computed(() => details.value.reduce((sum, d) => sum + parseAmount(d.amount), 0))

watchEffect(() => {
  template.value.totalAmount = String(totalAmount.value)
})

function addDetail() {
  details.value.push({ salaryCode: '', amount: '0', quantity: '1', unitCode: 'MONTH', sequenceOrder: String(details.value.length + 1) })
}

function removeDetail(i: number) {
  details.value.splice(i, 1)
}

async function submit() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await salaryService.createTemplate({ ...template.value, details: details.value })
    message.value = 'Salary template created'
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Create salary template failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Salary Template Builder</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">POST /api/salary-templates</p>
      </div>
      <div class="flex gap-3">
        <UiButton variant="outline" @click="addDetail">Add detail</UiButton>
        <UiButton variant="primary" :disabled="loading" @click="submit">Save</UiButton>
      </div>
    </div>

    <div class="ui-card">
      <div class="p-4 md:p-6 space-y-6">
        <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
        <div v-if="message" class="text-sm text-green-600">{{ message }}</div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiInput v-model="template.name" label="Template Name" required />
          <UiInput v-model="template.currency" label="Currency" />
          <UiInput v-model="template.totalAmount" label="Total Amount" required disabled hint="Auto-calculated from detail amounts" />
          <UiInput v-model="template.description" label="Description" />
          <UiInput v-model="template.effectiveFrom" label="Effective From" type="date" required />
          <UiInput v-model="template.effectiveTo" label="Effective To" type="date" required />
        </div>

        <div class="border-t border-primary/10 pt-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold">Details</h2>
          </div>

          <div class="space-y-4">
            <div v-for="(d, i) in details" :key="i" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b border-primary/10 pb-4">
              <div class="md:col-span-3">
                <UiInput v-model="d.salaryCode" label="Salary Code" required />
              </div>
              <div class="md:col-span-3">
                <UiInput v-model="d.amount" label="Amount" required />
              </div>
              <div class="md:col-span-2">
                <UiInput v-model="d.quantity" label="Quantity" required />
              </div>
              <div class="md:col-span-3">
                <UiSelect v-model="d.unitCode" label="Unit" :options="unitOptions" required />
              </div>
              <div class="md:col-span-1 flex justify-end">
                <button type="button" class="text-slate-500 hover:text-red-500" @click="removeDetail(i)">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
              <div class="md:col-span-12">
                <UiInput v-model="d.sequenceOrder" label="Sequence Order" required />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>
