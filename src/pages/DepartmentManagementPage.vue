<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import { departmentService } from '@/services/department.service'
import { useI18n } from '@/i18n'
import type { Department } from '@/types'

const { t } = useI18n()
const rows = ref<Department[]>([])
const name = ref('')
const description = ref('')
const loading = ref(false)
const error = ref('')

async function load() {
  error.value = ''
  loading.value = true
  try {
    const res = await departmentService.list({ page: 0, size: 50 })
    const data = (res?.content ?? res?.data ?? res?.departments ?? []) as Department[]
    rows.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? t('departments.list.loadFailed')
  } finally {
    loading.value = false
  }
}

async function create() {
  error.value = ''
  loading.value = true
  try {
    await departmentService.create({ name: name.value, description: description.value || undefined })
    name.value = ''
    description.value = ''
    await load()
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? t('departments.list.createFailed')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const headers = computed<UiTableHeader[]>(() => [
  { key: 'code', label: t('common.field.code') },
  { key: 'name', label: t('common.field.name') },
  { key: 'companyName', label: t('common.field.company') },
  { key: 'status', label: t('common.field.status') },
])
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ t('departments.list.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">GET/POST /api/departments</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="ui-card xl:col-span-2">
        <div class="p-4 md:p-6">
          <div v-if="error" class="text-sm text-red-500 mb-4">{{ error }}</div>
          <div v-if="loading" class="text-sm text-slate-500">{{ t('common.state.loading') }}</div>

          <div v-else>
            <UiTable
              :headers="headers"
              :rows="rows"
              row-key="id"
              head-class="bg-transparent"
              head-row-class="border-b border-primary/10"
              body-class="divide-primary/10 dark:divide-primary/10"
              th-base-class="py-3 pr-4 text-left text-slate-500 text-xs font-bold uppercase tracking-wider"
              td-base-class="py-3 pr-4"
            >
              <template #cell-code="{ row }">
                <span class="font-medium">{{ row.code }}</span>
              </template>
            </UiTable>
          </div>
        </div>
      </div>

      <div class="ui-card">
        <div class="p-4 md:p-6">
          <h2 class="text-lg font-bold mb-4">{{ t('departments.list.formTitle') }}</h2>
          <div class="space-y-4">
            <UiInput v-model="name" :label="t('common.field.name')" required />
            <UiInput v-model="description" :label="t('common.field.description')" />
            <UiButton variant="primary" block :disabled="loading" @click="create">{{ t('common.action.create') }}</UiButton>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
