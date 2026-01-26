<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import { useRouter } from 'vue-router'
import { AppRoute } from '@/types'

const router = useRouter()
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">HR Management</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Payroll & employee operations</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <UiCard>
        <UiCardBody>
          <p class="font-bold">Salary Components</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">POST /api/salaries</p>
          <button class="text-primary text-sm mt-4 hover:underline" @click="router.push(AppRoute.PAYROLL_COMPONENTS)">Open</button>
        </UiCardBody>
      </UiCard>

      <UiCard>
        <UiCardBody>
          <p class="font-bold">Salary Templates</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">POST /api/salary-templates</p>
          <button class="text-primary text-sm mt-4 hover:underline" @click="router.push(AppRoute.PAYROLL_BUILDER)">Open</button>
        </UiCardBody>
      </UiCard>

      <UiCard>
        <UiCardBody>
          <p class="font-bold">Employee Salary</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">POST /api/employee-salaries + /api/employee-salary-details</p>
          <button class="text-primary text-sm mt-4 hover:underline" @click="router.push(AppRoute.SALARY_SLIP)">Open</button>
        </UiCardBody>
      </UiCard>
    </div>
  </AppLayout>
</template>
