<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
<<<<<<< Updated upstream
import { salaryService, type SalaryTemplateRequest, type SalaryTemplateDetailRequest } from '@/services/salary.service'
=======
import {
  calculateSalaryTemplateTotal,
  salaryService,
  type SalaryComponentRule,
  type SalaryTemplateDetailRequest,
  type SalaryTemplateRequest,
  type SelectionOptionResponse,
} from '@/services/salary.service'
import { useI18n } from '@/i18n'
import { AppRoute } from '@/types'
>>>>>>> Stashed changes

const loading = ref(false)
const loadingOptions = ref(false)
const error = ref('')
const message = ref('')
const router = useRouter()
const { t } = useI18n()

type SalaryTemplateForm = Omit<SalaryTemplateRequest, 'details' | 'description' | 'currency'> & {
  description: string
  currency: string
}

type SalaryTemplateDetailRow = Omit<SalaryTemplateDetailRequest, 'dependencyCode'> & {
  dependencyCode: string
}

const template = ref<SalaryTemplateForm>({
  name: 'Default Template',
  description: 'Monthly payroll template',
  totalAmount: '0',
  effectiveFrom: '2025-01-01',
  effectiveTo: '2025-12-31',
  currency: 'VND',
})

<<<<<<< Updated upstream
const unitOptions = [
  { value: 'MONTH', label: 'MONTH' },
  { value: 'DAY', label: 'DAY' },
  { value: 'HOUR', label: 'HOUR' },
  { value: 'PRODUCT', label: 'PRODUCT' },
]
=======
const salaryCodeOptions = ref<{ value: string; label: string }[]>([])
const unitOptions = ref<{ value: string; label: string }[]>([])
const componentRules = ref<SalaryComponentRule[]>([])
const dependencySalaryOptions = computed(() => [
  { value: '', label: t('salaryTemplates.builder.noDependency') },
  ...salaryCodeOptions.value,
])
>>>>>>> Stashed changes

const details = ref<SalaryTemplateDetailRequest[]>([
  { salaryCode: 'BASE', amount: '15000000', quantity: '1', unitCode: 'MONTH', sequenceOrder: '1' },
  { salaryCode: 'ALLOWANCE', amount: '3000000', quantity: '1', unitCode: 'MONTH', sequenceOrder: '2' },
])

const totalAmount = computed(() => calculateSalaryTemplateTotal(details.value, componentRules.value))

watchEffect(() => {
  template.value.totalAmount = totalAmount.value
})

function addDetail() {
  details.value.push({
    salaryCode: salaryCodeOptions.value[0]?.value ?? '',
    amount: '0',
    quantity: '1',
    unitCode: unitOptions.value[0]?.value ?? '',
    sequenceOrder: String(details.value.length + 1),
    dependencyCode: '',
  })
}

function removeDetail(index: number) {
  details.value.splice(index, 1)
}

async function submit() {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const res = await salaryService.createTemplate({ ...template.value, details: details.value })
    if (res?.status === 201) {
      await router.push(AppRoute.PAYROLL_TEMPLATES)
      return
    }
    error.value = t('salaryTemplates.builder.unexpectedStatus', { status: res?.status ?? 'unknown' })
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? t('salaryTemplates.builder.createFailed')
  } finally {
    loading.value = false
  }
}
<<<<<<< Updated upstream
=======

function normalizeOptions(res: any): SelectionOptionResponse[] {
  const raw = (res?.content ?? res?.data ?? res?.options ?? res ?? []) as any[]
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item) => item?.code && item?.name)
    .map((item) => ({ code: String(item.code), name: String(item.name) }))
}

function mapUiOptions(items: SelectionOptionResponse[]) {
  return items.map((item) => ({ value: item.code, label: item.name }))
}

async function loadOptions() {
  loadingOptions.value = true
  try {
    const [salaryRes, unitRes, rules] = await Promise.all([
      salaryService.salaryOptions({ page: 0, size: 200, sortDir: 'ASC' }),
      salaryService.systemUnitOptions({ type: 'DURATION', page: 0, size: 200, sortDir: 'ASC' }),
      salaryService.componentRules({ page: 0, size: 500, sortDir: 'ASC' }),
    ])

    salaryCodeOptions.value = mapUiOptions(normalizeOptions(salaryRes))
    unitOptions.value = mapUiOptions(normalizeOptions(unitRes))
    componentRules.value = rules

    const firstSalaryCode = salaryCodeOptions.value[0]?.value ?? ''
    const firstUnit = unitOptions.value[0]?.value ?? ''
    details.value = details.value.map((detail) => ({
      ...detail,
      salaryCode: salaryCodeOptions.value.some((option) => option.value === detail.salaryCode) ? detail.salaryCode : firstSalaryCode,
      unitCode: unitOptions.value.some((option) => option.value === detail.unitCode) ? detail.unitCode : firstUnit,
      dependencyCode:
        detail.dependencyCode && salaryCodeOptions.value.some((option) => option.value === detail.dependencyCode)
          ? detail.dependencyCode
          : '',
    }))
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? t('salaryTemplates.builder.loadOptionsFailed')
  } finally {
    loadingOptions.value = false
  }
}

onMounted(loadOptions)
>>>>>>> Stashed changes
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ t('salaryTemplates.builder.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">POST /api/salary-templates</p>
      </div>
      <div class="flex gap-3">
        <UiButton variant="outline" @click="addDetail">{{ t('salaryTemplates.builder.addDetail') }}</UiButton>
        <UiButton variant="primary" :disabled="loading" @click="submit">{{ t('common.action.save') }}</UiButton>
      </div>
    </div>

    <div class="ui-card overflow-visible">
      <div class="p-4 md:p-6 space-y-6">
        <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
        <div v-if="message" class="text-sm text-green-600">{{ message }}</div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiInput v-model="template.name" :label="t('salaryTemplates.builder.fields.templateName')" required />
          <UiInput v-model="template.currency" :label="t('common.field.currency')" />
          <UiInput v-model="template.totalAmount" :label="t('common.field.totalAmount')" required disabled :hint="t('salaryTemplates.builder.fields.totalAmountHint')" />
          <UiInput v-model="template.description" :label="t('common.field.description')" />
          <UiInput v-model="template.effectiveFrom" :label="t('common.field.effectiveFrom')" type="date" required />
          <UiInput v-model="template.effectiveTo" :label="t('common.field.effectiveTo')" type="date" required />
        </div>

        <div class="border-t border-primary/10 pt-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold">{{ t('salaryTemplates.builder.details') }}</h2>
          </div>

          <div class="space-y-4">
            <div v-for="(detail, index) in details" :key="index" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b border-primary/10 pb-4">
              <div class="md:col-span-3">
<<<<<<< Updated upstream
                <UiInput v-model="d.salaryCode" label="Salary Code" required />
              </div>
              <div class="md:col-span-3">
                <UiSelect v-model="d.dependencyCode" :label="t('salaryTemplates.builder.fields.dependencySalary')" :options="dependencySalaryOptions" :disabled="loadingOptions" />
              </div>
              <div class="md:col-span-2">
                <UiInput v-model="d.amount" :label="t('common.field.amount')" required />
              </div>
              <div class="md:col-span-1">
                <UiInput v-model="d.quantity" :label="t('common.field.quantity')" required />
              </div>
              <div class="md:col-span-1">
                <UiSelect v-model="d.unitCode" :label="t('common.field.unit')" :options="unitOptions" :disabled="loadingOptions" required />
              </div>
              <div class="md:col-span-1">
                <UiInput v-model="d.sequenceOrder" :label="t('salaryTemplates.builder.fields.sequenceOrder')" required />
              </div>
              <div class="md:col-span-1 flex justify-end">
                <button type="button" class="text-slate-500 hover:text-red-500" @click="removeDetail(i)">
=======
                <UiSelect v-model="detail.salaryCode" :label="t('salaryTemplates.builder.fields.salaryCode')" :options="salaryCodeOptions" :disabled="loadingOptions" required />
              </div>
              <div class="md:col-span-3">
                <UiSelect v-model="detail.dependencyCode" :label="t('salaryTemplates.builder.fields.dependencySalary')" :options="dependencySalaryOptions" :disabled="loadingOptions" />
              </div>
              <div class="md:col-span-2">
                <UiInput v-model="detail.amount" :label="t('common.field.amount')" required />
              </div>
              <div class="md:col-span-1">
                <UiInput v-model="detail.quantity" :label="t('common.field.quantity')" required />
              </div>
              <div class="md:col-span-1">
                <UiSelect v-model="detail.unitCode" :label="t('common.field.unit')" :options="unitOptions" :disabled="loadingOptions" required />
              </div>
              <div class="md:col-span-1">
                <UiInput v-model="detail.sequenceOrder" :label="t('salaryTemplates.builder.fields.sequenceOrder')" required />
              </div>
              <div class="md:col-span-1 flex items-center justify-end">
                <button type="button" class="text-slate-500 hover:text-red-500" :title="t('common.action.delete')" @click="removeDetail(index)">
>>>>>>> Stashed changes
                  <UiIcon name="delete" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>
