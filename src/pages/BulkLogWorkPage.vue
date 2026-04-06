<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { dailyWorkService, type EmployeeDailyWorkRequest } from '@/services/daily-work.service'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const message = ref('')

const sample = ref(`[
  {
    "userProfileCode":"EMP001",
    "workingDate":"2025-01-10",
    "startTime":"09:00",
    "endTime":"18:00",
    "quantity":1,
    "unit":"DAY",
    "workType":"NORMAL",
    "usedPto":false,
    "otTime":0
  }
]`)

async function submit() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const payload = JSON.parse(sample.value) as EmployeeDailyWorkRequest[]
    const res = await dailyWorkService.createMany(payload)
    message.value = typeof res === 'string' ? res : t('bulkLogWork.success.created')
  } catch (e: any) {
    error.value = e?.message ?? t('bulkLogWork.errors.invalidPayload')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ t('bulkLogWork.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">POST /api/employee-daily-works</p>
      </div>
      <UiButton variant="primary" :disabled="loading" @click="submit">{{ t('common.action.submit') }}</UiButton>
    </div>

    <div class="ui-card">
      <div class="p-4 md:p-6">
        <div v-if="error" class="text-sm text-red-500 mb-4">{{ error }}</div>
        <div v-if="message" class="text-sm text-green-600 mb-4">{{ message }}</div>

        <label class="block text-sm font-medium mb-2">{{ t('bulkLogWork.payloadLabel') }}</label>
        <textarea v-model="sample" class="ui-textarea h-80 font-mono text-xs"></textarea>
      </div>
    </div>
  </AppLayout>
</template>
