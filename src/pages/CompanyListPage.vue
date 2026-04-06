<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import { companyService } from '@/services/company.service'
import { useI18n } from '@/i18n'
import type { Company } from '@/types'
import { AppRoute } from '@/types'

const router = useRouter()
const { t } = useI18n()
const rows = ref<Company[]>([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await companyService.list({ page: 0, size: 20, sortDir: 'DESC' })
    const data = (res?.content ?? res?.data ?? res?.companies ?? []) as Company[]
    rows.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? t('companies.list.loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const empty = computed(() => !loading.value && rows.value.length === 0)

const headers = computed<UiTableHeader[]>(() => [
  { key: 'code', label: t('common.field.code') },
  { key: 'name', label: t('common.field.name') },
  { key: 'email', label: t('common.field.email') },
  { key: 'industry', label: t('common.field.industry') },
  { key: 'phoneNumber', label: t('common.field.phone') },
])
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ t('companies.list.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">/api/companies</p>
      </div>
      <UiButton variant="primary" @click="router.push(AppRoute.CREATE_COMPANY)">{{ t('companies.list.createNew') }}</UiButton>
    </div>

    <div class="ui-card">
      <div class="p-4 md:p-6">
        <div v-if="error" class="text-sm text-red-500 mb-4">{{ error }}</div>
        <div v-if="loading" class="text-sm text-slate-500">{{ t('common.state.loading') }}</div>

        <div v-else-if="empty" class="text-center py-14">
          <p class="font-semibold">{{ t('companies.list.emptyTitle') }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ t('companies.list.emptyDescription') }}</p>
          <div class="mt-4 flex justify-center">
            <UiButton variant="primary" @click="router.push(AppRoute.CREATE_COMPANY)">{{ t('companies.list.createCompany') }}</UiButton>
          </div>
        </div>

        <div v-else>
          <UiTable
            :headers="headers"
            :rows="rows"
            row-key="code"
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
  </AppLayout>
</template>
