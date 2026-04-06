<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import { AppRoute } from '@/types'

const router = useRouter()
const { t } = useI18n()

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type LeaveRequest = {
  employeeName: string
  employeeTitle: string
  typeKey: 'sickLeave' | 'vacation' | 'personal'
  dates: string
  status: LeaveStatus
  avatarUrl?: string
}

const leaveRequests: LeaveRequest[] = [
  {
    employeeName: 'Guy Hawkins',
    employeeTitle: 'Fullstack Dev',
    typeKey: 'sickLeave',
    dates: 'Oct 12 - 14',
    status: 'PENDING',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDkiwQ4YY8gYeGI3LA3WpXKyC_YVr8QxUQbkAR2qVYAmbI5USGkV9dTGa9EvhxNjqZiv3I1arD37wSqEltf8WUpKAno8DP_A6eifWBpTvCMK9PIvQ0-GzFazVXi9SRSCxPTy4pU75fegLc-1tQz2LQW8Lu5Cerk4K43QcyKnlTCJaNbrHoG9nCWDlXYRH4rUagvXJCRCZ4OVVEfxXUzIshZR5YvGqAaGgqeSEyCSqFZySFQwxPmZTyXTWINNtZ95fcsllAaLBglbu2Q',
  },
  {
    employeeName: 'Kristin Watson',
    employeeTitle: 'UI Designer',
    typeKey: 'vacation',
    dates: 'Oct 20 - 27',
    status: 'APPROVED',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDD9ha0wpRfvb0Xke1wwNHQWgb781nuQbWbXlUr4GQvHeIwABqD6D61DvHRXkfKwD3nloqcNAAHm1vqHwGZYxfQlwqZ5HfZjtoOc9MlTT-XeD_Lf8x0B1fTMdmESkDngAIyBnvNNfMQcy95quJQPwJ-poiAQQX-vRxD_vkEJAVRABlUZrWvyhWmgADIqeUZwxXlOaMJLBZwh5HrIjALB8Y-XeqAh41Bh26uhoCu83HJavocPHKS8BFqELp0Wge_YumuQMHkIbaJLbNT',
  },
  {
    employeeName: 'Robert Fox',
    employeeTitle: 'Sales Lead',
    typeKey: 'personal',
    dates: 'Oct 15',
    status: 'PENDING',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAMh7IzJRKwbumjYf4K0gpf_OAVGhG3eTG_4-1YeAy8rn9dRRaTRQZnSgRND0ICNxMz9v0iOcAfa3VSoYMbGnG3XymAuB_h0VcpXG3v-iauxM2uoMKLKA_jiZcxDUEt_v7zNhP3bjAdIdI9sNNsd8AKVHXe86TYk6f4mEQ1kWicFDsB3090U9-Ui1RPUTHyAnMPWT-izcQr2L5k-U4cLz03TF97VEGqamLS9YXYDbEDqDXgkywT6YZCQ1wvRRatxYjbpI9-NuLPe46p',
  },
]

const leaveHeaders = computed<UiTableHeader[]>(() => [
  { key: 'employee', label: t('hrOverview.leaveRequests.headers.employee') },
  { key: 'type', label: t('hrOverview.leaveRequests.headers.type') },
  { key: 'dates', label: t('hrOverview.leaveRequests.headers.dates') },
  { key: 'status', label: t('hrOverview.leaveRequests.headers.status') },
  { key: 'actions', label: t('hrOverview.leaveRequests.headers.actions'), align: 'right' },
])

function statusBadgeVariant(status: LeaveStatus) {
  if (status === 'APPROVED') return 'success' as const
  if (status === 'REJECTED') return 'error' as const
  return 'warning' as const
}

function statusBadgeIcon(status: LeaveStatus) {
  if (status === 'APPROVED') return 'check_circle'
  if (status === 'REJECTED') return 'cancel'
  return 'warning'
}

function statusLabel(status: LeaveStatus) {
  if (status === 'APPROVED') return t('common.status.approved')
  if (status === 'REJECTED') return t('common.status.rejected')
  return t('common.status.pending')
}

function exportReport() {
  const header = ['employeeName', 'employeeTitle', 'type', 'dates', 'status']
  const rows = leaveRequests.map(r => [
    r.employeeName,
    r.employeeTitle,
    t(`hrOverview.leaveRequests.types.${r.typeKey}`),
    r.dates,
    statusLabel(r.status),
  ])
  const csv = [header, ...rows]
    .map(cols => cols.map(v => `"${String(v).replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'hr-report.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <AppLayout>
    <div class="space-y-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">{{ t('hrOverview.title') }}</h2>
          <p class="text-slate-500">{{ t('hrOverview.subtitle') }}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <UiButton variant="outline" leadingIcon="file_download" @click="exportReport">{{ t('hrOverview.actions.exportReport') }}</UiButton>
          <UiButton variant="primary" leadingIcon="add_circle" @click="router.push(AppRoute.CREATE_EMPLOYEE)">{{ t('hrOverview.actions.addEmployee') }}</UiButton>
        </div>
      </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div class="flex justify-between items-start mb-4">
                <div class="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                  <UiIcon name="groups" />
                </div>
                <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{{ t('hrOverview.metrics.totalEmployeesTrend') }}</span>
              </div>
              <p class="text-slate-500 text-sm font-medium">{{ t('hrOverview.metrics.totalEmployees') }}</p>
              <h3 class="text-2xl font-bold mt-1">1,248</h3>
            </div>

            <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div class="flex justify-between items-start mb-4">
                <div class="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600">
                  <UiIcon name="pending_actions" />
                </div>
                <span class="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">{{ t('hrOverview.metrics.pendingLeaveTrend') }}</span>
              </div>
              <p class="text-slate-500 text-sm font-medium">{{ t('hrOverview.metrics.pendingLeave') }}</p>
              <h3 class="text-2xl font-bold mt-1">12</h3>
            </div>

            <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div class="flex justify-between items-start mb-4">
                <div class="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600">
                  <UiIcon name="payments" />
                </div>
                <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{{ t('hrOverview.metrics.activePayrollTrend') }}</span>
              </div>
              <p class="text-slate-500 text-sm font-medium">{{ t('hrOverview.metrics.activePayroll') }}</p>
              <h3 class="text-2xl font-bold mt-1">$450k</h3>
            </div>

            <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div class="flex justify-between items-start mb-4">
                <div class="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600">
                  <UiIcon name="event_available" />
                </div>
                <span class="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{{ t('hrOverview.metrics.onLeaveTrend') }}</span>
              </div>
              <p class="text-slate-500 text-sm font-medium">{{ t('hrOverview.metrics.onLeave') }}</p>
              <h3 class="text-2xl font-bold mt-1">24</h3>
            </div>
          </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div class="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 class="font-bold text-slate-900 dark:text-white">{{ t('hrOverview.departments.title') }}</h3>
          </div>
          <div class="flex-1 p-6 flex flex-col items-center justify-center min-h-[300px]">
            <div class="relative w-48 h-48 rounded-full border-[20px] border-primary flex items-center justify-center mb-6">
              <div class="absolute inset-[-20px] rounded-full border-[20px] border-slate-200 border-t-transparent border-l-transparent rotate-45"></div>
              <div class="text-center">
                <p class="text-2xl font-bold">1,248</p>
                <p class="text-xs text-slate-500 uppercase tracking-wide">{{ t('hrOverview.departments.totalStaff') }}</p>
              </div>
            </div>
            <div class="w-full space-y-3">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-primary rounded-full"></div>
                  <span>{{ t('hrOverview.departments.engineering') }}</span>
                </div>
                <span class="font-bold">45%</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>{{ t('hrOverview.departments.salesMarketing') }}</span>
                </div>
                <span class="font-bold">28%</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-slate-300 rounded-full"></div>
                  <span>{{ t('hrOverview.departments.operations') }}</span>
                </div>
                <span class="font-bold">15%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="xl:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 class="font-bold text-slate-900 dark:text-white">{{ t('hrOverview.leaveRequests.title') }}</h3>
            <button class="text-primary text-sm font-semibold hover:underline" @click="exportReport">{{ t('hrOverview.actions.viewAll') }}</button>
          </div>
          <UiTable
            :headers="leaveHeaders"
            :rows="leaveRequests"
            :row-key="(_, i) => i"
            row-class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <template #cell-employee="{ row }">
              <div class="flex items-center gap-3">
                <div
                  class="size-8 rounded-full bg-slate-200 bg-cover bg-center"
                  :style="row.avatarUrl ? { backgroundImage: `url('${row.avatarUrl}')` } : undefined"
                ></div>
                <div class="text-sm">
                  <p class="font-semibold">{{ row.employeeName }}</p>
                  <p class="text-xs text-slate-500">{{ row.employeeTitle }}</p>
                </div>
              </div>
            </template>

            <template #cell-type="{ row }">
              <span class="text-sm text-slate-600 dark:text-slate-400">{{ t(`hrOverview.leaveRequests.types.${row.typeKey}`) }}</span>
            </template>

            <template #cell-dates="{ row }">
              <span class="text-sm text-slate-600 dark:text-slate-400">{{ row.dates }}</span>
            </template>

            <template #cell-status="{ row }">
              <UiBadge :variant="statusBadgeVariant(row.status)" :icon="statusBadgeIcon(row.status)">
                {{ statusLabel(row.status) }}
              </UiBadge>
            </template>

            <template #cell-actions>
              <div class="flex justify-end gap-2">
                <button class="p-1 hover:text-green-600 transition-colors" :title="t('hrOverview.leaveRequests.actions.approve')">
                  <UiIcon name="check_circle" size="18px" />
                </button>
                <button class="p-1 hover:text-red-600 transition-colors" :title="t('hrOverview.leaveRequests.actions.reject')">
                  <UiIcon name="cancel" size="18px" />
                </button>
              </div>
            </template>
          </UiTable>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-left hover:border-primary/40 transition-colors"
          @click="router.push(AppRoute.PAYROLL_COMPONENTS)"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold">{{ t('hrOverview.quickLinks.salaryComponents.title') }}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ t('hrOverview.quickLinks.salaryComponents.description') }}</p>
            </div>
            <UiIcon name="account_balance_wallet" class="text-slate-500" />
          </div>
        </button>

        <button
          class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-left hover:border-primary/40 transition-colors"
          @click="router.push(AppRoute.PAYROLL_BUILDER)"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold">{{ t('hrOverview.quickLinks.salaryTemplates.title') }}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ t('hrOverview.quickLinks.salaryTemplates.description') }}</p>
            </div>
            <UiIcon name="description" class="text-slate-500" />
          </div>
        </button>

        <button
          class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-left hover:border-primary/40 transition-colors"
          @click="router.push(AppRoute.SALARY_SLIP)"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold">{{ t('hrOverview.quickLinks.employeeSalaries.title') }}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ t('hrOverview.quickLinks.employeeSalaries.description') }}</p>
            </div>
            <UiIcon name="payments" class="text-slate-500" />
          </div>
        </button>
      </div>
    </div>
  </AppLayout>
</template>
