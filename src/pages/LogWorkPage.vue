<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { dailyWorkService, type DailyWorkUnit, type WorkType } from '@/services/daily-work.service'

const loading = ref(false)
const error = ref('')
const message = ref('')

const form = ref({
  userProfileCode: 'EMP001',
  workingDate: '2025-01-10',
  startTime: '09:00',
  endTime: '18:00',
  quantity: 1,
  unit: 'DAY' as DailyWorkUnit,
  workType: 'NORMAL' as WorkType,
  usedPto: false,
  otTime: 0,
})

const unitOptions = [
  { value: 'HOUR', label: 'HOUR' },
  { value: 'DAY', label: 'DAY' },
  { value: 'PRODUCT', label: 'PRODUCT' },
]
const workTypeOptions = [
  { value: 'NORMAL', label: 'NORMAL' },
  { value: 'HOLIDAY_WORK', label: 'HOLIDAY_WORK' },
  { value: 'WEEKEND_WORK', label: 'WEEKEND_WORK' },
  { value: 'PTO_PAID', label: 'PTO_PAID' },
  { value: 'PTO_UNPAID', label: 'PTO_UNPAID' },
  { value: 'UNPAID_LEAVE', label: 'UNPAID_LEAVE' },
]

async function submit() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const payload = [{
      ...form.value,
      quantity: Number(form.value.quantity),
      otTime: Number(form.value.otTime),
    }]
    const res = await dailyWorkService.createMany(payload)
    message.value = typeof res === 'string' ? res : 'Daily work created'
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Create daily work failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Log Daily Work</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">POST /api/employee-daily-works</p>
      </div>
    </div>

    <div class="ui-card">
      <div class="p-4 md:p-6">
        <div v-if="error" class="text-sm text-red-500 mb-4">{{ error }}</div>
        <div v-if="message" class="text-sm text-green-600 mb-4">{{ message }}</div>

        <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="submit">
          <UiInput v-model="form.userProfileCode" label="userProfileCode" required />
          <UiInput v-model="form.workingDate" label="workingDate" type="date" required />
          <UiInput v-model="form.startTime" label="startTime" required />
          <UiInput v-model="form.endTime" label="endTime" required />
          <UiInput v-model="form.quantity" label="quantity" required />
          <UiSelect v-model="form.unit" label="unit" :options="unitOptions" required />
          <UiSelect v-model="form.workType" label="workType" :options="workTypeOptions" required />
          <UiInput v-model="form.otTime" label="otTime" />
          <label class="flex items-center gap-2 h-12 md:col-span-2">
            <input type="checkbox" class="rounded border-primary/20" v-model="form.usedPto" />
            <span class="text-sm">usedPto</span>
          </label>

          <div class="md:col-span-2">
            <UiButton type="submit" variant="primary" :disabled="loading">Submit</UiButton>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
