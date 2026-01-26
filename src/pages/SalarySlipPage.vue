<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { employeeSalaryService, type EmployeeSalaryDetailRequest } from '@/services/employee-salary.service'

const loading = ref(false)
const error = ref('')
const message = ref('')

const master = ref({
  userProfileCode: 'EMP001',
  effectiveFrom: '2025-01-01',
  effectiveTo: '2025-12-31',
  totalAmount: '20000000',
  currency: 'VND',
})

const employeeSalaryCode = ref<string>('')

const details = ref<EmployeeSalaryDetailRequest[]>([
  { salaryCode: 'BASE', employeeSalaryCode: '', amount: '15000000' },
  { salaryCode: 'ALLOWANCE', employeeSalaryCode: '', amount: '3000000' },
])

async function createMaster() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await employeeSalaryService.createMaster(master.value)
    employeeSalaryCode.value = res?.code ?? ''
    details.value.forEach(d => d.employeeSalaryCode = employeeSalaryCode.value)
    message.value = 'Employee salary master created'
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Create employee salary master failed'
  } finally {
    loading.value = false
  }
}

function addDetail() {
  details.value.push({ salaryCode: '', employeeSalaryCode: employeeSalaryCode.value, amount: '0' })
}

function removeDetail(i: number) {
  details.value.splice(i, 1)
}

async function createDetails() {
  if (!employeeSalaryCode.value) {
    error.value = 'Create master first to get employeeSalaryCode'
    return
  }
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await employeeSalaryService.createDetails(details.value)
    message.value = typeof res === 'string' ? res : 'Employee salary details created'
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Create employee salary details failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Employee Salary</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">POST /api/employee-salaries + /api/employee-salary-details</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="ui-card xl:col-span-2">
        <div class="p-4 md:p-6 space-y-6">
          <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
          <div v-if="message" class="text-sm text-green-600">{{ message }}</div>

          <div>
            <h2 class="font-bold mb-3">1) Create salary master</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UiInput v-model="master.userProfileCode" label="userProfileCode" required />
              <UiInput v-model="master.currency" label="currency" required />
              <UiInput v-model="master.totalAmount" label="totalAmount" required />
              <UiInput v-model="employeeSalaryCode" label="employeeSalaryCode (response)" disabled />
              <UiInput v-model="master.effectiveFrom" label="effectiveFrom" type="date" required />
              <UiInput v-model="master.effectiveTo" label="effectiveTo" type="date" required />
            </div>
            <div class="mt-4">
              <UiButton variant="primary" :disabled="loading" @click="createMaster">Create master</UiButton>
            </div>
          </div>

          <div class="border-t border-primary/10 pt-6">
            <div class="flex items-center justify-between">
              <h2 class="font-bold">2) Create salary details</h2>
              <UiButton variant="outline" @click="addDetail">Add</UiButton>
            </div>

            <div class="mt-4 space-y-4">
              <div v-for="(d, i) in details" :key="i" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b border-primary/10 pb-4">
                <div class="md:col-span-4">
                  <UiInput v-model="d.salaryCode" label="salaryCode" required />
                </div>
                <div class="md:col-span-5">
                  <UiInput v-model="d.employeeSalaryCode" label="employeeSalaryCode" required />
                </div>
                <div class="md:col-span-3">
                  <UiInput v-model="d.amount" label="amount" required />
                </div>
                <div class="md:col-span-12 flex justify-end">
                  <button type="button" class="text-slate-500 hover:text-red-500" @click="removeDetail(i)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <UiButton variant="primary" :disabled="loading" @click="createDetails">Create details</UiButton>
            </div>
          </div>
        </div>
      </div>

      <div class="ui-card">
        <div class="p-4 md:p-6">
          <h2 class="font-bold mb-2">Notes</h2>
          <ul class="text-sm text-slate-500 dark:text-slate-400 list-disc pl-5 space-y-2">
            <li>Master response must contain <code>code</code> (employeeSalaryCode).</li>
            <li>Backend schema returns string message for details endpoint.</li>
            <li>Axios uses <code>withCredentials</code> for cookie auth.</li>
          </ul>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
