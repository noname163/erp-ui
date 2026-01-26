<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { companyService } from '@/services/company.service'
import { AppRoute } from '@/types'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const success = ref('')

const form = ref({
  name: '',
  email: '',
  industry: '',
  taxNumber: '',
  address: '',
  phoneNumber: '',
})

async function submit() {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await companyService.create(form.value)
    success.value = 'Company created'
    router.push(AppRoute.COMPANIES)
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Create company failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="w-full max-w-4xl mx-auto">
      <div class="flex items-center gap-2 mb-6">
        <button class="text-slate-500 text-sm font-medium hover:text-primary" @click="router.push(AppRoute.COMPANIES)">Organizations</button>
        <span class="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
        <span class="text-slate-900 dark:text-white text-sm font-semibold">Create New Company</span>
      </div>

      <div class="ui-card">
        <div class="p-6 md:p-8">
          <div class="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 class="text-xl font-bold">Company information</h1>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">POST /api/companies</p>
            </div>
          </div>

          <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="submit">
            <UiInput v-model="form.name" label="Company Name" required placeholder="NovaTech Solutions" />
            <UiInput v-model="form.email" label="Company Email" required type="email" placeholder="contact@company.com" />
            <UiInput v-model="form.industry" label="Industry" required placeholder="Software & Tech" />
            <UiInput v-model="form.taxNumber" label="Tax Number" required placeholder="0123456789" />
            <div class="md:col-span-2">
              <UiInput v-model="form.address" label="Address" required placeholder="123 Main St, District 1" />
            </div>
            <UiInput v-model="form.phoneNumber" label="Phone Number" required placeholder="+84 123 456 789" />

            <div class="md:col-span-2">
              <div v-if="error" class="text-sm text-red-500 mb-3">{{ error }}</div>
              <div v-if="success" class="text-sm text-green-600 mb-3">{{ success }}</div>
              <div class="flex gap-3">
                <UiButton variant="outline" @click.prevent="router.push(AppRoute.COMPANIES)">Cancel</UiButton>
                <UiButton type="submit" variant="primary" :disabled="loading">
                  <span v-if="loading">Saving...</span>
                  <span v-else>Create</span>
                </UiButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
