<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { departmentService } from '@/services/department.service'
import type { Department } from '@/types'

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
    error.value = e?.response?.data?.message ?? 'Failed to load departments'
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
    error.value = e?.response?.data?.message ?? 'Create department failed'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Departments</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">GET/POST /api/departments</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="ui-card xl:col-span-2">
        <div class="p-4 md:p-6">
          <div v-if="error" class="text-sm text-red-500 mb-4">{{ error }}</div>
          <div v-if="loading" class="text-sm text-slate-500">Loading...</div>

          <div v-else class="overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="text-left text-slate-500">
                <tr class="border-b border-primary/10">
                  <th class="py-3 pr-4">Code</th>
                  <th class="py-3 pr-4">Name</th>
                  <th class="py-3 pr-4">Company</th>
                  <th class="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in rows" :key="d.id" class="border-b border-primary/10">
                  <td class="py-3 pr-4 font-medium">{{ d.code }}</td>
                  <td class="py-3 pr-4">{{ d.name }}</td>
                  <td class="py-3 pr-4">{{ d.companyName }}</td>
                  <td class="py-3 pr-4">{{ d.status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="ui-card">
        <div class="p-4 md:p-6">
          <h2 class="text-lg font-bold mb-4">Create department</h2>
          <div class="space-y-4">
            <UiInput v-model="name" label="Name" required />
            <UiInput v-model="description" label="Description" />
            <UiButton variant="primary" block :disabled="loading" @click="create">Create</UiButton>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
