<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { companyService } from '@/services/company.service'
import { useI18n } from '@/i18n'
import { AppRoute } from '@/types'

const router = useRouter()
const { t } = useI18n()
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
    success.value = t('companies.create.successCreated')
    router.push(AppRoute.COMPANIES)
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? t('companies.create.createFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="w-full max-w-4xl mx-auto">
      <div class="flex items-center gap-2 mb-6">
        <button class="text-slate-500 text-sm font-medium hover:text-primary" @click="router.push(AppRoute.COMPANIES)">{{ t('companies.create.breadcrumb') }}</button>
        <UiIcon name="chevron_right" size="16px" class="text-slate-400" />
        <span class="text-slate-900 dark:text-white text-sm font-semibold">{{ t('companies.create.title') }}</span>
      </div>

      <div class="ui-card">
        <div class="p-6 md:p-8">
          <div class="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 class="text-xl font-bold">{{ t('companies.create.cardTitle') }}</h1>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">POST /api/companies</p>
            </div>
          </div>

          <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="submit">
            <UiInput v-model="form.name" :label="t('companies.create.fields.name.label')" required :placeholder="t('companies.create.fields.name.placeholder')" />
            <UiInput v-model="form.email" :label="t('companies.create.fields.email.label')" required type="email" :placeholder="t('companies.create.fields.email.placeholder')" />
            <UiInput v-model="form.industry" :label="t('companies.create.fields.industry.label')" required :placeholder="t('companies.create.fields.industry.placeholder')" />
            <UiInput v-model="form.taxNumber" :label="t('companies.create.fields.taxNumber.label')" required :placeholder="t('companies.create.fields.taxNumber.placeholder')" />
            <div class="md:col-span-2">
              <UiInput v-model="form.address" :label="t('companies.create.fields.address.label')" required :placeholder="t('companies.create.fields.address.placeholder')" />
            </div>
            <UiInput v-model="form.phoneNumber" :label="t('companies.create.fields.phoneNumber.label')" required :placeholder="t('companies.create.fields.phoneNumber.placeholder')" />

            <div class="md:col-span-2">
              <div v-if="error" class="text-sm text-red-500 mb-3">{{ error }}</div>
              <div v-if="success" class="text-sm text-green-600 mb-3">{{ success }}</div>
              <div class="flex gap-3">
                <UiButton variant="outline" @click.prevent="router.push(AppRoute.COMPANIES)">{{ t('common.action.cancel') }}</UiButton>
                <UiButton type="submit" variant="primary" :disabled="loading">
                  <span v-if="loading">{{ t('common.state.saving') }}</span>
                  <span v-else>{{ t('common.action.create') }}</span>
                </UiButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
