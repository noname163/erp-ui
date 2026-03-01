<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiTextarea from '@/components/ui/UiTextarea.vue'
import UiCheckbox from '@/components/ui/UiCheckbox.vue'
import UiSearchSelect from '@/components/ui/UiSearchSelect.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { dailyWorkService, type DailyWorkUnit, type WorkType } from '@/services/daily-work.service'
import { AppRoute } from '@/types'

const router = useRouter()

const loading = ref(false)
const error = ref('')
const message = ref('')

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

const employeeOptions = [
  {
    value: 'EMP-001',
    label: 'John Doe',
    subtitle: 'Senior Software Engineer',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWJWqEACDCp7b4ZK1Z8D2DF3NZn1QBd5WlCrOjlj2ziGRcMEVx-F3EgdMtd9oufp0EQ9pfpb_8UHEqgjs27NEx2xSz7J8wuJ0-F87vuyCcpukfsBKF1qJ7rr1aURquQM06RNIqMMYaJnlyr6hsXerFgRKTyBJw-lsrFKR5EpzGyYILr2VuGiQERrP5eqcfffGJIv_OmNzRkCZPoI11xx3Cd5f1EjjqA7mzqlqOr-rRINaL4bUqB_9evxLuHknia9mD9G2xoor7VrVo',
  },
  { value: 'EMP-042', label: 'John Smith', subtitle: 'Project Manager' },
  { value: 'EMP-089', label: 'Johnathan Johnson', subtitle: 'QA Specialist' },
]

const unitOptions = [
  { value: 'HOUR', label: 'HOUR' },
  { value: 'DAY', label: 'DAY' },
  { value: 'PRODUCT', label: 'PRODUCT' },
]
const workTypeOptions = [
  { value: 'NORMAL', label: 'NORMAL' },
  { value: 'HOLIDAY_WORK', label: 'HOLIDAY_WORK' },
  { value: 'WEEKEND_WORK', label: 'WEEKEND_WORK' },
  { value: 'PTO_PAID', label: 'PTO_PAID' },
  { value: 'PTO_UNPAID', label: 'PTO_UNPAID' },
  { value: 'UNPAID_LEAVE', label: 'UNPAID_LEAVE' },
]

const canSubmit = computed(() => !loading.value)

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
    message.value = typeof res === 'string' ? res : 'Daily work created'
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Create daily work failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="max-w-3xl mx-auto space-y-6">
      <nav class="flex items-center gap-2 text-sm">
        <button class="text-slate-500 dark:text-slate-400 hover:text-primary" @click="router.push(AppRoute.DASHBOARD)">
          Dashboard
        </button>
        <UiIcon name="chevron_right" size="16" class="text-slate-300" />
        <button class="text-slate-500 dark:text-slate-400 hover:text-primary" @click="router.push(AppRoute.LOG_WORK)">
          Timesheets
        </button>
        <UiIcon name="chevron_right" size="16" class="text-slate-300" />
        <span class="text-slate-900 dark:text-white font-medium">Log Work</span>
      </nav>

      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Log Daily Work</h1>
        <p class="text-slate-500 dark:text-slate-400">Enter your hours for accurate payroll and project tracking.</p>
      </div>

      <UiCard class="!overflow-visible relative shadow-sm border border-slate-200 dark:border-slate-800">
        <div class="p-6 md:p-8 space-y-8">
          <div v-if="error" class="text-sm text-rose-600">{{ error }}</div>
          <div v-if="message" class="text-sm text-green-600">{{ message }}</div>

          <form class="space-y-8" @submit.prevent="submit">
            <UiSearchSelect
              v-model="form.userProfileCode"
              :options="employeeOptions"
              sectionTitle="Employee Selection"
              sectionIcon="badge"
              label="Select Employee"
              placeholder="Search by name or ID..."
              required
            />

            <section class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-2 mb-4">
                <UiIcon name="calendar_today" size="20" class="text-primary" />
                <h3 class="text-slate-900 dark:text-white font-semibold">Date &amp; Work Type</h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UiInput v-model="form.workingDate" label="Date of Work" type="date" required />
                <UiSelect v-model="form.workType" label="Work Type" :options="workTypeOptions" required />
              </div>
            </section>

            <section class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-2 mb-4">
                <UiIcon name="schedule" size="20" class="text-primary" />
                <h3 class="text-slate-900 dark:text-white font-semibold">Duration &amp; Metrics</h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UiInput v-model="form.startTime" label="Start Time" type="time" required />
                <UiInput v-model="form.endTime" label="End Time" type="time" required />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <UiInput v-model="form.quantity" label="Quantity" type="number" :step="0.5" required />
                <UiSelect v-model="form.unit" label="Unit" :options="unitOptions" required />
              </div>

              <div class="mt-6">
                <UiInput v-model="form.otTime" label="OT Time (Hours)" type="number" :step="0.5" hint="Optional" />
              </div>
            </section>

            <section class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <UiCheckbox
                v-model="form.usedPto"
                label="Used PTO (Paid Time Off)"
                description="Check this if you are logging hours against your vacation balance."
              />
            </section>

            <section class="pt-2">
              <UiTextarea
                v-model="form.description"
                label="Work Description / Notes (Optional)"
                placeholder="Summarize your tasks for the day..."
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
                Cancel
              </button>

              <div class="w-full sm:w-auto">
                <UiButton type="submit" variant="primary" block :disabled="!canSubmit">
                  <span v-if="loading" class="inline-flex items-center justify-center gap-2">
                    <span class="h-4 w-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                  <span v-else>Submit Daily Log</span>
                </UiButton>
              </div>
            </div>
          </form>
        </div>
      </UiCard>

      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4 flex gap-4">
        <UiIcon name="info" class="text-blue-500 dark:text-blue-400" />
        <div class="text-sm text-blue-800 dark:text-blue-300">
          <p class="font-semibold mb-1">Weekly Submission Policy</p>
          <p>
            Please ensure all logs for the current week are submitted by Friday, 5:00 PM for timely payroll processing.
            For weekend overtime, logs must be submitted by Monday morning.
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
