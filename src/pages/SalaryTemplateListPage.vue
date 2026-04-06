<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import { AppRoute } from '@/types'
import { salaryService, type SalaryTemplateSummary } from '@/services/salary.service'
import { useI18n } from '@/i18n'

type SalaryTemplateRow = SalaryTemplateSummary & {
  id: string
}

const router = useRouter()
const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const name = ref('')
const currency = ref('ALL')
const effectiveFrom = ref('')
const effectiveTo = ref('')
const page = ref(1)
const pageSize = 8

const rows = ref<SalaryTemplateRow[]>([])
const totalElements = ref(0)
const totalPages = ref(1)

const headers = computed<UiTableHeader[]>(() => [
  { key: 'name', label: t('common.field.name'), thClass: 'min-w-[220px]' },
  { key: 'description', label: t('common.field.description'), thClass: 'min-w-[260px]' },
  { key: 'effectiveFrom', label: t('common.field.effectiveFrom') },
  { key: 'effectiveTo', label: t('common.field.effectiveTo') },
  { key: 'currency', label: t('common.field.currency'), align: 'center' },
  { key: 'totalAmount', label: t('common.field.totalAmount'), align: 'right' },
  { key: 'createdBy', label: t('common.field.createdBy') },
  { key: 'actions', label: t('common.field.actions'), align: 'right' },
])

function normalizeRows(data: any[]): SalaryTemplateRow[] {
  return data.map((item: any, index: number) => ({
    id: String(item?.id ?? item?.code ?? item?.name ?? `template-${index}`),
    name: String(item?.name ?? ''),
    description: item?.description ? String(item.description) : '',
    effectiveFrom: String(item?.effectiveFrom ?? ''),
    effectiveTo: item?.effectiveTo ?? null,
    currency: String(item?.currency ?? 'USD'),
    totalAmount: item?.totalAmount ?? 0,
    createdBy: String(item?.createdBy ?? item?.createdByName ?? 'System'),
  }))
}

async function loadTemplates() {
  loading.value = true
  error.value = ''
  try {
    const res = await salaryService.listTemplates({
      name: name.value.trim() || undefined,
      currency: currency.value === 'ALL' ? undefined : currency.value,
      effectiveFrom: effectiveFrom.value || undefined,
      effectiveTo: effectiveTo.value || undefined,
      page: page.value - 1,
      size: pageSize,
      sortBy: 'effectiveFrom',
      sortDir: 'DESC',
    })

    const data = (res?.content ?? res?.data ?? res?.templates ?? []) as any[]
    rows.value = Array.isArray(data) ? normalizeRows(data) : []
    totalElements.value = Number(res?.totalElements ?? rows.value.length ?? 0)
    totalPages.value = Math.max(1, Number(res?.totalPages ?? Math.ceil(totalElements.value / pageSize) ?? 1))
  } catch (e: any) {
    rows.value = []
    totalElements.value = 0
    totalPages.value = 1
    error.value = e?.response?.data?.message ?? t('salaryTemplates.list.loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(loadTemplates)

const currencyOptions = computed(() => {
  const values = Array.from(new Set(rows.value.map((r) => (r.currency ?? 'USD').toUpperCase())))
  return [
    { value: 'ALL', label: t('salaryTemplates.list.currencyAll') },
    ...values.map((v) => ({ value: v, label: t('salaryTemplates.list.currencyOption', { currency: v }) })),
  ]
})

const summaryText = computed(() => {
  if (totalElements.value === 0) return t('salaryTemplates.list.summaryZero')
  const from = (page.value - 1) * pageSize + 1
  const to = Math.min(page.value * pageSize, totalElements.value)
  return t('salaryTemplates.list.summary', { from, to, total: totalElements.value })
})

function formatDate(value?: string | null) {
  if (!value) return t('salaryTemplates.list.openEnded')
  return value
}

function formatAmount(row: SalaryTemplateRow) {
  const n = typeof row.totalAmount === 'number' ? row.totalAmount : Number(String(row.totalAmount).replaceAll(',', ''))
  const normalized = Number.isFinite(n) ? n : 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: row.currency ?? 'USD' }).format(normalized)
}

function initials(name?: string) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'U'
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

async function applyFilters() {
  page.value = 1
  await loadTemplates()
}

async function resetFilters() {
  name.value = ''
  currency.value = 'ALL'
  effectiveFrom.value = ''
  effectiveTo.value = ''
  page.value = 1
  await loadTemplates()
}

async function changePage(next: number) {
  if (next < 1 || next > totalPages.value || next === page.value) return
  page.value = next
  await loadTemplates()
}
</script>

<template>
  <AppLayout>
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">{{ t('salaryTemplates.list.title') }}</h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">{{ t('salaryTemplates.list.subtitle') }}</p>
        </div>
        <UiButton leading-icon="add" @click="router.push(AppRoute.PAYROLL_BUILDER)">
          {{ t('salaryTemplates.list.createTemplate') }}
        </UiButton>
      </div>

      <UiCard>
        <UiCardBody>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div class="lg:col-span-4">
              <UiInput v-model="name" :placeholder="t('salaryTemplates.list.searchPlaceholder')" leading-icon="search" @keyup.enter="applyFilters" />
            </div>
            <div class="lg:col-span-3">
              <UiSelect v-model="currency" :options="currencyOptions" />
            </div>
            <div class="lg:col-span-3">
              <UiInput v-model="effectiveFrom" type="date" />
            </div>
            <div class="lg:col-span-2">
              <UiInput v-model="effectiveTo" type="date" />
            </div>
            <div class="lg:col-span-12 flex justify-end gap-2">
              <UiButton variant="outline" @click="resetFilters">{{ t('common.action.reset') }}</UiButton>
              <UiButton variant="primary" leading-icon="filter_list" @click="applyFilters">{{ t('common.action.apply') }}</UiButton>
            </div>
          </div>
        </UiCardBody>
      </UiCard>

      <UiCard>
        <div class="p-4 md:p-6">
          <div v-if="error" class="text-sm text-amber-600 dark:text-amber-400 mb-4">{{ error }}</div>
          <div v-if="loading" class="text-sm text-slate-500">{{ t('salaryTemplates.list.loading') }}</div>

          <UiTable
            v-else
            :headers="headers"
            :rows="rows"
            row-key="id"
            row-class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            head-row-class="border-b border-primary/10"
            body-class="divide-primary/10 dark:divide-primary/10"
            th-base-class="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"
            td-base-class="px-4 md:px-6 py-4 text-sm"
          >
            <template #cell-name="{ row }">
              <span class="font-semibold text-slate-900 dark:text-white">{{ row.name }}</span>
            </template>

            <template #cell-description="{ row }">
              <span class="text-slate-600 dark:text-slate-400 truncate block max-w-xs">{{ row.description || '-' }}</span>
            </template>

            <template #cell-effectiveFrom="{ row }">
              <span class="text-slate-700 dark:text-slate-300">{{ formatDate(row.effectiveFrom) }}</span>
            </template>

            <template #cell-effectiveTo="{ row }">
              <span :class="row.effectiveTo ? 'text-slate-700 dark:text-slate-300' : 'italic text-slate-500 dark:text-slate-500'">
                {{ formatDate(row.effectiveTo) }}
              </span>
            </template>

            <template #cell-currency="{ row }">
              <div class="flex justify-center">
              <UiBadge variant="info">{{ row.currency ?? 'USD' }}</UiBadge>
            </div>
          </template>

            <template #cell-totalAmount="{ row }">
              <span class="font-bold text-slate-900 dark:text-white">{{ formatAmount(row) }}</span>
            </template>

            <template #cell-createdBy="{ row }">
              <div class="flex items-center gap-2">
                <div class="size-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center justify-center">
                  {{ initials(row.createdBy) }}
                </div>
                <span class="text-slate-600 dark:text-slate-300">{{ row.createdBy || '-' }}</span>
              </div>
            </template>

            <template #cell-actions>
              <div class="flex items-center justify-end gap-2">
                <UiButton variant="outline" icon-only leading-icon="visibility" :title="t('common.action.view')" />
                <UiButton variant="outline" icon-only leading-icon="edit" :title="t('common.action.edit')" />
                <UiButton variant="outline" icon-only leading-icon="delete" :title="t('common.action.delete')" />
              </div>
            </template>
          </UiTable>

          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-primary/10 mt-2">
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ summaryText }}</p>
            <div class="flex items-center gap-2">
              <UiButton variant="outline" :disabled="page <= 1 || loading" @click="changePage(page - 1)">{{ t('common.action.previous') }}</UiButton>
              <span class="text-sm text-slate-600 dark:text-slate-300">{{ t('common.pagination.pageOf', { page, total: totalPages }) }}</span>
              <UiButton variant="outline" :disabled="page >= totalPages || loading" @click="changePage(page + 1)">{{ t('common.action.next') }}</UiButton>
            </div>
          </div>
        </div>
      </UiCard>
    </div>
  </AppLayout>
</template>
