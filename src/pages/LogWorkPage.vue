<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiTextarea from '@/components/ui/UiTextarea.vue'
import UiCheckbox from '@/components/ui/UiCheckbox.vue'
import UiSearchSelect, { type UiSearchSelectOption } from '@/components/ui/UiSearchSelect.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { dailyWorkService, type DailyWorkUnit, type WorkType } from '@/services/daily-work.service'
import { userProfileService } from '@/services/user-profile.service'
import { useI18n } from '@/i18n'
import { AppRoute } from '@/types'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const loading = ref(false)
const loadingEmployees = ref(false)
const error = ref('')
const message = ref('')
const selectedWorkCode = computed(() => {
  const code = route.query.code
  return typeof code === 'string' ? code : ''
})

const defaultForm = () => ({
  userProfileCode: '',
  workingDate: '',
  startTime: '09:00',
  endTime: '17:00',
  quantity: 8,
  unit: 'HOUR' as DailyWorkUnit,
  workType: 'NORMAL' as WorkType,
  usedPto: false,
  otTime: 0,
  description: '',
})

const form = ref(defaultForm())

const employeeOptions = ref<UiSearchSelectOption[]>([])

const unitOptions = computed(() => [
  { value: 'HOUR', label: t('logWork.options.unit.hour') },
  { value: 'DAY', label: t('logWork.options.unit.day') },
  { value: 'PRODUCT', label: t('logWork.options.unit.product') },
])
const workTypeOptions = computed(() => [
  { value: 'NORMAL', label: t('logWork.options.workType.normal') },
  { value: 'HOLIDAY_WORK', label: t('logWork.options.workType.holidayWork') },
  { value: 'WEEKEND_WORK', label: t('logWork.options.workType.weekendWork') },
  { value: 'PTO_PAID', label: t('logWork.options.workType.ptoPaid') },
  { value: 'PTO_UNPAID', label: t('logWork.options.workType.ptoUnpaid') },
  { value: 'UNPAID_LEAVE', label: t('logWork.options.workType.unpaidLeave') },
])

const canSubmit = computed(() => !loading.value)

function normalizeUserOptions(res: any): UiSearchSelectOption[] {
  const raw = (res?.content ?? res?.data ?? res?.options ?? res ?? []) as any[]
  if (!Array.isArray(raw)) return []
  return raw
    .map((item: any) => {
      const value = String(item?.code ?? item?.userProfileCode ?? item?.id ?? '').trim()
      const label = String(item?.name ?? item?.fullName ?? item?.email ?? value).trim()
      const subtitle = String(item?.positionName ?? item?.jobTitle ?? item?.departmentName ?? '').trim()
      if (!value) return null
      const option: UiSearchSelectOption = { value, label }
      if (subtitle) option.subtitle = subtitle
      return option
    })
    .filter((item: UiSearchSelectOption | null): item is UiSearchSelectOption => Boolean(item))
}

async function loadEmployeeOptions() {
  loadingEmployees.value = true
  try {
    const res = await userProfileService.options({ page: 0, size: 200, sortDir: 'ASC' })
    employeeOptions.value = normalizeUserOptions(res)
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? t('logWork.errors.loadEmployees')
  } finally {
    loadingEmployees.value = false
  }
}

function cancel() {
  form.value = defaultForm()
  error.value = ''
  message.value = ''
}

async function submit() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const payload = [{
      ...form.value,
      quantity: Number(form.value.quantity),
      otTime: Number(form.value.otTime),
      description: undefined,
    }]
    const res = await dailyWorkService.createMany(payload)
    message.value = typeof res === 'string' ? res : t('logWork.success.created')
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? t('logWork.errors.createFailed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEmployeeOptions()
})
</script>

<template>
  <AppLayout>
    <div class="max-w-3xl mx-auto space-y-6">
      <nav class="flex items-center gap-2 text-sm">
        <button class="text-slate-500 dark:text-slate-400 hover:text-primary" @click="router.push(AppRoute.DASHBOARD)">
          {{ t('navigation.dashboard') }}
        </button>
        <UiIcon name="chevron_right" size="16" class="text-slate-300" />
        <button class="text-slate-500 dark:text-slate-400 hover:text-primary" @click="router.push(AppRoute.LOG_WORK_LIST)">
          {{ t('logWork.breadcrumb.list') }}
        </button>
        <UiIcon name="chevron_right" size="16" class="text-slate-300" />
        <span class="text-slate-900 dark:text-white font-medium">{{ t('logWork.breadcrumb.current') }}</span>
      </nav>

      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{{ t('logWork.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400">{{ t('logWork.subtitle') }}</p>
      </div>

      <UiCard class="!overflow-visible relative shadow-sm border border-slate-200 dark:border-slate-800">
        <div class="p-6 md:p-8 space-y-8">
          <div v-if="selectedWorkCode" class="text-sm text-primary">
            {{ t('logWork.selectedCode', { code: selectedWorkCode }) }}
          </div>
          <div v-if="error" class="text-sm text-rose-600">{{ error }}</div>
          <div v-if="message" class="text-sm text-green-600">{{ message }}</div>

          <form class="space-y-8" @submit.prevent="submit">
            <UiSearchSelect
              v-model="form.userProfileCode"
              :options="employeeOptions"
              :section-title="t('logWork.sections.employeeSelection')"
              sectionIcon="badge"
              :label="t('logWork.fields.employee')"
              :placeholder="t('logWork.fields.employeePlaceholder')"
              :disabled="loadingEmployees"
              required
            />

            <section class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-2 mb-4">
                <UiIcon name="calendar_today" size="20" class="text-primary" />
                <h3 class="text-slate-900 dark:text-white font-semibold">{{ t('logWork.sections.dateAndWorkType') }}</h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UiInput v-model="form.workingDate" :label="t('logWork.fields.dateOfWork')" type="date" required />
                <UiSelect v-model="form.workType" :label="t('common.field.workType')" :options="workTypeOptions" required />
              </div>
            </section>

            <section class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-2 mb-4">
                <UiIcon name="schedule" size="20" class="text-primary" />
                <h3 class="text-slate-900 dark:text-white font-semibold">{{ t('logWork.sections.durationAndMetrics') }}</h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UiInput v-model="form.startTime" :label="t('common.field.startTime')" type="time" required />
                <UiInput v-model="form.endTime" :label="t('common.field.endTime')" type="time" required />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <UiInput v-model="form.quantity" :label="t('common.field.quantity')" type="number" :step="0.5" required />
                <UiSelect v-model="form.unit" :label="t('common.field.unit')" :options="unitOptions" required />
              </div>

              <div class="mt-6">
                <UiInput v-model="form.otTime" :label="t('common.field.otTime')" type="number" :step="0.5" :hint="t('logWork.fields.optionalHint')" />
              </div>
            </section>

            <section class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <UiCheckbox
                v-model="form.usedPto"
                :label="t('logWork.fields.usedPto')"
                :description="t('logWork.fields.usedPtoDescription')"
              />
            </section>

            <section class="pt-2">
              <UiTextarea
                v-model="form.description"
                :label="t('logWork.fields.description')"
                :placeholder="t('logWork.fields.descriptionPlaceholder')"
                :rows="3"
              />
            </section>

            <div
              class="bg-slate-50 dark:bg-slate-800/50 p-6 -mx-6 md:-mx-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800"
            >
              <button
                type="button"
                class="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                :disabled="loading"
                @click="cancel"
              >
                {{ t('common.action.cancel') }}
              </button>

              <div class="w-full sm:w-auto">
                <UiButton type="submit" variant="primary" block :disabled="!canSubmit">
                  <span v-if="loading" class="inline-flex items-center justify-center gap-2">
                    <span class="h-4 w-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    {{ t('common.state.saving') }}
                  </span>
                  <span v-else>{{ t('logWork.actions.submitDailyLog') }}</span>
                </UiButton>
              </div>
            </div>
          </form>
        </div>
      </UiCard>

      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4 flex gap-4">
        <UiIcon name="info" class="text-blue-500 dark:text-blue-400" />
        <div class="text-sm text-blue-800 dark:text-blue-300">
          <p class="font-semibold mb-1">{{ t('logWork.notice.title') }}</p>
          <p>{{ t('logWork.notice.body') }}</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
