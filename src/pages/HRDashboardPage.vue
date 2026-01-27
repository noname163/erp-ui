<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue'
import { useRouter } from 'vue-router'
import { AppRoute } from '@/types'

const router = useRouter()

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type LeaveRequest = {
  employeeName: string
  employeeTitle: string
  type: string
  dates: string
  status: LeaveStatus
  avatarUrl?: string
}

const leaveRequests: LeaveRequest[] = [
  {
    employeeName: 'Guy Hawkins',
    employeeTitle: 'Fullstack Dev',
    type: 'Sick Leave',
    dates: 'Oct 12 - 14',
    status: 'PENDING',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDkiwQ4YY8gYeGI3LA3WpXKyC_YVr8QxUQbkAR2qVYAmbI5USGkV9dTGa9EvhxNjqZiv3I1arD37wSqEltf8WUpKAno8DP_A6eifWBpTvCMK9PIvQ0-GzFazVXi9SRSCxPTy4pU75fegLc-1tQz2LQW8Lu5Cerk4K43QcyKnlTCJaNbrHoG9nCWDlXYRH4rUagvXJCRCZ4OVVEfxXUzIshZR5YvGqAaGgqeSEyCSqFZySFQwxPmZTyXTWINNtZ95fcsllAaLBglbu2Q',
  },
  {
    employeeName: 'Kristin Watson',
    employeeTitle: 'UI Designer',
    type: 'Vacation',
    dates: 'Oct 20 - 27',
    status: 'APPROVED',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDD9ha0wpRfvb0Xke1wwNHQWgb781nuQbWbXlUr4GQvHeIwABqD6D61DvHRXkfKwD3nloqcNAAHm1vqHwGZYxfQlwqZ5HfZjtoOc9MlTT-XeD_Lf8x0B1fTMdmESkDngAIyBnvNNfMQcy95quJQPwJ-poiAQQX-vRxD_vkEJAVRABlUZrWvyhWmgADIqeUZwxXlOaMJLBZwh5HrIjALB8Y-XeqAh41Bh26uhoCu83HJavocPHKS8BFqELp0Wge_YumuQMHkIbaJLbNT',
  },
  {
    employeeName: 'Robert Fox',
    employeeTitle: 'Sales Lead',
    type: 'Personal',
    dates: 'Oct 15',
    status: 'PENDING',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAMh7IzJRKwbumjYf4K0gpf_OAVGhG3eTG_4-1YeAy8rn9dRRaTRQZnSgRND0ICNxMz9v0iOcAfa3VSoYMbGnG3XymAuB_h0VcpXG3v-iauxM2uoMKLKA_jiZcxDUEt_v7zNhP3bjAdIdI9sNNsd8AKVHXe86TYk6f4mEQ1kWicFDsB3090U9-Ui1RPUTHyAnMPWT-izcQr2L5k-U4cLz03TF97VEGqamLS9YXYDbEDqDXgkywT6YZCQ1wvRRatxYjbpI9-NuLPe46p',
  },
]

const leaveHeaders: UiTableHeader[] = [
  { key: 'employee', label: 'Employee' },
  { key: 'type', label: 'Type' },
  { key: 'dates', label: 'Dates' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

function statusPillClass(status: LeaveStatus) {
  if (status === 'APPROVED') return 'bg-green-100 text-green-700'
  if (status === 'REJECTED') return 'bg-red-100 text-red-700'
  return 'bg-amber-100 text-amber-700'
}

function exportReport() {
  const header = ['employeeName', 'employeeTitle', 'type', 'dates', 'status']
  const rows = leaveRequests.map(r => [r.employeeName, r.employeeTitle, r.type, r.dates, r.status])
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
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">HR Overview</h2>
          <p class="text-slate-500">Welcome back, here's what's happening today.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <UiButton variant="outline" @click="exportReport">Export Report</UiButton>
          <UiButton variant="primary" @click="router.push(AppRoute.CREATE_EMPLOYEE)">+ Add Employee</UiButton>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex justify-between items-start mb-4">
            <div class="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
              <span class="material-symbols-outlined">groups</span>
            </div>
            <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p class="text-slate-500 text-sm font-medium">Total Employees</p>
          <h3 class="text-2xl font-bold mt-1">1,248</h3>
        </div>

        <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex justify-between items-start mb-4">
            <div class="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600">
              <span class="material-symbols-outlined">pending_actions</span>
            </div>
            <span class="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">8 New</span>
          </div>
          <p class="text-slate-500 text-sm font-medium">Pending Leave</p>
          <h3 class="text-2xl font-bold mt-1">12</h3>
        </div>

        <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex justify-between items-start mb-4">
            <div class="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600">
              <span class="material-symbols-outlined">payments</span>
            </div>
            <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">On track</span>
          </div>
          <p class="text-slate-500 text-sm font-medium">Active Payroll</p>
          <h3 class="text-2xl font-bold mt-1">$450k</h3>
        </div>

        <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex justify-between items-start mb-4">
            <div class="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600">
              <span class="material-symbols-outlined">event_available</span>
            </div>
            <span class="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Today</span>
          </div>
          <p class="text-slate-500 text-sm font-medium">On Leave</p>
          <h3 class="text-2xl font-bold mt-1">24</h3>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div class="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 class="font-bold text-slate-900 dark:text-white">Department Distribution</h3>
          </div>
          <div class="flex-1 p-6 flex flex-col items-center justify-center min-h-[300px]">
            <div class="relative w-48 h-48 rounded-full border-[20px] border-primary flex items-center justify-center mb-6">
              <div class="absolute inset-[-20px] rounded-full border-[20px] border-slate-200 border-t-transparent border-l-transparent rotate-45"></div>
              <div class="text-center">
                <p class="text-2xl font-bold">1,248</p>
                <p class="text-xs text-slate-500 uppercase tracking-wide">Total Staff</p>
              </div>
            </div>
            <div class="w-full space-y-3">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Engineering</span>
                </div>
                <span class="font-bold">45%</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>Sales &amp; Marketing</span>
                </div>
                <span class="font-bold">28%</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-slate-300 rounded-full"></div>
                  <span>Operations</span>
                </div>
                <span class="font-bold">15%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="xl:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 class="font-bold text-slate-900 dark:text-white">Recent Leave Requests</h3>
            <button class="text-primary text-sm font-semibold hover:underline" @click="exportReport">View All</button>
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
              <span class="text-sm text-slate-600 dark:text-slate-400">{{ row.type }}</span>
            </template>

            <template #cell-dates="{ row }">
              <span class="text-sm text-slate-600 dark:text-slate-400">{{ row.dates }}</span>
            </template>

            <template #cell-status="{ row }">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold" :class="statusPillClass(row.status)">
                {{ row.status }}
              </span>
            </template>

            <template #cell-actions>
              <div class="flex justify-end gap-2">
                <button class="p-1 hover:text-green-600 transition-colors" title="Approve">
                  <span class="material-symbols-outlined text-lg">check_circle</span>
                </button>
                <button class="p-1 hover:text-red-600 transition-colors" title="Reject">
                  <span class="material-symbols-outlined text-lg">cancel</span>
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
              <p class="font-bold">Salary Components</p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage payroll components</p>
            </div>
            <span class="material-symbols-outlined text-slate-500">account_balance_wallet</span>
          </div>
        </button>

        <button
          class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-left hover:border-primary/40 transition-colors"
          @click="router.push(AppRoute.PAYROLL_BUILDER)"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold">Salary Templates</p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Build salary templates</p>
            </div>
            <span class="material-symbols-outlined text-slate-500">description</span>
          </div>
        </button>

        <button
          class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-left hover:border-primary/40 transition-colors"
          @click="router.push(AppRoute.SALARY_SLIP)"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold">Employee Salaries</p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Create salary slips</p>
            </div>
            <span class="material-symbols-outlined text-slate-500">payments</span>
          </div>
        </button>
      </div>
    </div>
  </AppLayout>
</template>
