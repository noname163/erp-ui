<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { companyService } from '@/services/company.service'
import type { Company } from '@/types'
import { AppRoute } from '@/types'

const router = useRouter()
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
    error.value = e?.response?.data?.message ?? 'Failed to load companies'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const empty = computed(() => !loading.value && rows.value.length === 0)
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Companies</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">/api/companies</p>
      </div>
      <UiButton variant="primary" @click="router.push(AppRoute.CREATE_COMPANY)">Create new</UiButton>
    </div>

    <div class="ui-card">
      <div class="p-4 md:p-6">
        <div v-if="error" class="text-sm text-red-500 mb-4">{{ error }}</div>
        <div v-if="loading" class="text-sm text-slate-500">Loading...</div>

        <div v-else-if="empty" class="text-center py-14">
          <p class="font-semibold">No companies</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Create your first company.</p>
          <div class="mt-4 flex justify-center">
            <UiButton variant="primary" @click="router.push(AppRoute.CREATE_COMPANY)">Create company</UiButton>
          </div>
        </div>

        <div v-else class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="text-left text-slate-500">
              <tr class="border-b border-primary/10">
                <th class="py-3 pr-4">Code</th>
                <th class="py-3 pr-4">Name</th>
                <th class="py-3 pr-4">Email</th>
                <th class="py-3 pr-4">Industry</th>
                <th class="py-3 pr-4">Phone</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in rows" :key="c.code" class="border-b border-primary/10">
                <td class="py-3 pr-4 font-medium">{{ c.code }}</td>
                <td class="py-3 pr-4">{{ c.name }}</td>
                <td class="py-3 pr-4">{{ c.email }}</td>
                <td class="py-3 pr-4">{{ c.industry }}</td>
                <td class="py-3 pr-4">{{ c.phoneNumber }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
