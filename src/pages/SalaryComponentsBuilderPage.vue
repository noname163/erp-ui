<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { salaryService, type SalaryRequest } from '@/services/salary.service'

type SalaryRow = SalaryRequest & { selected: boolean }

const loading = ref(false)
const message = ref('')
const error = ref('')

const rows = ref<SalaryRow[]>([
  { name: 'BASE', calculateMethod: 'FIXED', isDeduct: false, selected: true },
  { name: 'ALLOWANCE', calculateMethod: 'FIXED', isDeduct: false, selected: true },
])

const calcOptions = [
  { value: 'PLUS', label: 'PLUS' },
  { value: 'MINUS', label: 'MINUS' },
  { value: 'FIXED', label: 'FIXED' },
  { value: 'PERCENT', label: 'PERCENT' },
  { value: 'FORMULA', label: 'FORMULA' },
]

function addRow() {
  rows.value.push({ name: '', calculateMethod: 'FIXED', isDeduct: false, selected: true })
}

function removeRow(i: number) {
  rows.value.splice(i, 1)
}

async function saveAll() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const selected = rows.value.filter((r) => r.selected).map(({ name, calculateMethod, isDeduct }) => ({ name, calculateMethod, isDeduct }))
    if (selected.length === 0) {
      error.value = 'Select at least one row to save'
      return
    }

    await salaryService.createComponents(selected)
    message.value = `Saved ${selected.length} salary component${selected.length === 1 ? '' : 's'}`
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Create salary components failed'
  } finally {
    loading.value = false
  }
}

async function saveRow(r: SalaryRow) {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const req: SalaryRequest = { name: r.name, calculateMethod: r.calculateMethod, isDeduct: r.isDeduct }
    await salaryService.createComponents([req])
    message.value = `Saved ${r.name || 'salary component'}`
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Create salary component failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Salary Components</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">POST /api/salaries</p>
      </div>
      <div class="flex gap-3">
        <UiButton variant="outline" @click="addRow">Add</UiButton>
        <UiButton variant="primary" :disabled="loading" @click="saveAll">Save All</UiButton>
      </div>
    </div>

    <div class="ui-card">
      <div class="p-4 md:p-6">
        <div v-if="error" class="text-sm text-red-500 mb-4">{{ error }}</div>
        <div v-if="message" class="text-sm text-green-600 mb-4">{{ message }}</div>

        <div class="space-y-4">
          <div v-for="(r, i) in rows" :key="i" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b border-primary/10 pb-4">
            <div class="md:col-span-1">
              <label class="flex items-center gap-2 h-12">
                <input type="checkbox" class="rounded border-primary/20" v-model="r.selected" />
                <span class="text-sm">Save</span>
              </label>
            </div>
            <div class="md:col-span-4">
              <UiInput v-model="r.name" label="Name" required placeholder="BASE" />
            </div>
            <div class="md:col-span-4">
              <UiSelect v-model="r.calculateMethod" label="Calculate Method" :options="calcOptions" required />
            </div>
            <div class="md:col-span-2">
              <label class="flex items-center gap-2 h-12">
                <input type="checkbox" class="rounded border-primary/20" v-model="r.isDeduct" />
                <span class="text-sm">Deduct</span>
              </label>
            </div>
            <div class="md:col-span-1 flex justify-end gap-2">
              <button type="button" class="text-slate-500 hover:text-primary" :disabled="loading" @click="saveRow(r)">
                <UiIcon name="save" />
              </button>
              <button type="button" class="text-slate-500 hover:text-red-500" :disabled="loading" @click="removeRow(i)">
                <UiIcon name="delete" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
