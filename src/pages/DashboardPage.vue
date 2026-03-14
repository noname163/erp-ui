<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { useRouter } from 'vue-router'
import { AppRoute } from '@/types'

const router = useRouter()
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">System overview</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <UiCard>
        <UiCardBody>
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-bold">Companies</p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage tenant companies</p>
            </div>
            <UiIcon name="business" class="text-primary" />
          </div>
          <button class="text-primary text-sm mt-4 hover:underline" @click="router.push(AppRoute.COMPANIES)">Open</button>
        </UiCardBody>
      </UiCard>

      <UiCard>
        <UiCardBody>
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-bold">Departments</p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Company departments</p>
            </div>
            <UiIcon name="apartment" class="text-primary" />
          </div>
          <button class="text-primary text-sm mt-4 hover:underline" @click="router.push(AppRoute.DEPARTMENTS)">Open</button>
        </UiCardBody>
      </UiCard>
    </div>
  </AppLayout>
</template>
