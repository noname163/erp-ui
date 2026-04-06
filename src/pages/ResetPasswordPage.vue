<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth'
import { AppRoute } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const submitting = ref(false)
const submitError = ref('')

const fieldErrors = computed(() => {
  const errors: Record<string, string> = {}
  if (!currentPassword.value) errors.currentPassword = t('resetPassword.error.currentRequired')
  if (!newPassword.value) errors.newPassword = t('resetPassword.error.newRequired')
  if (!confirmPassword.value) errors.confirmPassword = t('resetPassword.error.confirmRequired')

  if (newPassword.value && confirmPassword.value && newPassword.value !== confirmPassword.value) {
    errors.confirmPassword = t('resetPassword.error.passwordMismatch')
  }

  if (currentPassword.value && newPassword.value && currentPassword.value === newPassword.value) {
    errors.newPassword = t('resetPassword.error.samePassword')
  }

  return errors
})

const passwordStrength = computed(() => {
  const passwordValue = newPassword.value
  const checks = {
    hasLength: passwordValue.length >= 8,
    hasNumber: /\d/.test(passwordValue),
    hasSymbol: /[^a-zA-Z0-9]/.test(passwordValue),
    hasUpper: /[A-Z]/.test(passwordValue),
  }
  const score = Object.values(checks).filter(Boolean).length

  if (score >= 4) {
    return {
      label: t('resetPassword.strengthStrong'),
      toneClass: 'text-green-500',
      barClass: 'bg-green-500',
      bars: 4,
    }
  }

  if (score >= 2) {
    return {
      label: t('resetPassword.strengthMedium'),
      toneClass: 'text-orange-500',
      barClass: 'bg-orange-500',
      bars: 2,
    }
  }

  return {
    label: t('resetPassword.strengthWeak'),
    toneClass: 'text-red-500',
    barClass: 'bg-red-500',
    bars: score >= 1 ? 1 : 0,
  }
})

async function submit() {
  submitError.value = ''

  if (Object.keys(fieldErrors.value).length) {
    submitError.value = t('resetPassword.error.fixAndTryAgain')
    return
  }

  submitting.value = true
  try {
    await authService.resetPassword({
      oldPassword: currentPassword.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    })

    auth.logout()
    router.replace(AppRoute.LOGIN)
  } catch (e: any) {
    submitError.value = e?.response?.data?.message ?? t('resetPassword.error.updateFailed')
  } finally {
    submitting.value = false
  }
}

function cancel() {
  router.push(AppRoute.DASHBOARD)
}
</script>

<template>
  <AppLayout>
    <div class="geometric-bg -m-6 md:-m-10 p-6 md:p-10 min-h-[calc(100vh-64px)]">
      <div class="flex items-center gap-3 text-primary mb-6">
        <UiIcon name="lock" size="30px" />
        <div>
          <h1 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{{ t('resetPassword.pageTitle') }}</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('resetPassword.pageSubtitle') }}</p>
        </div>
      </div>

      <div class="flex justify-center">
        <UiCard class="w-full max-w-md">
          <UiCardBody>
            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <span class="material-symbols-outlined text-3xl">lock</span>
              </div>
              <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ t('resetPassword.cardTitle') }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">{{ t('resetPassword.cardSubtitle') }}</p>
            </div>

            <form class="space-y-6" @submit.prevent="submit">
              <UiInput
                v-model="currentPassword"
                :label="t('resetPassword.currentPassword')"
                :type="showCurrent ? 'text' : 'password'"
                placeholder="••••••••"
                required
                autocomplete="current-password"
                name="currentPassword"
                :error="fieldErrors.currentPassword"
                :trailingIcon="showCurrent ? 'visibility_off' : 'visibility'"
                @trailing-click="showCurrent = !showCurrent"
              />

              <div>
                <UiInput
                  v-model="newPassword"
                  :label="t('resetPassword.newPassword')"
                  :type="showNew ? 'text' : 'password'"
                  placeholder="••••••••"
                  required
                  autocomplete="new-password"
                  name="newPassword"
                  :error="fieldErrors.newPassword"
                  :trailingIcon="showNew ? 'visibility_off' : 'visibility'"
                  @trailing-click="showNew = !showNew"
                />

                <div class="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-primary/10">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {{ t('resetPassword.strengthLabel') }}
                    </span>
                    <span class="text-[10px] font-bold uppercase" :class="passwordStrength.toneClass">
                      {{ passwordStrength.label }}
                    </span>
                  </div>
                  <div class="flex gap-1.5 h-1.5 mb-3">
                    <div
                      v-for="index in 4"
                      :key="index"
                      class="flex-1 rounded-full"
                      :class="index <= passwordStrength.bars ? passwordStrength.barClass : 'bg-slate-200 dark:bg-slate-700'"
                    ></div>
                  </div>
                  <p class="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-2">
                    <span class="material-symbols-outlined text-sm mt-0.5 text-primary">info</span>
                    {{ t('resetPassword.passwordHint') }}
                  </p>
                </div>
              </div>

              <UiInput
                v-model="confirmPassword"
                :label="t('resetPassword.confirmPassword')"
                :type="showConfirm ? 'text' : 'password'"
                placeholder="••••••••"
                required
                autocomplete="new-password"
                name="confirmPassword"
                :error="fieldErrors.confirmPassword"
                :trailingIcon="showConfirm ? 'visibility_off' : 'visibility'"
                @trailing-click="showConfirm = !showConfirm"
              />

              <div v-if="submitError" class="text-sm text-red-500">{{ submitError }}</div>

              <div class="pt-2 flex flex-col gap-3">
                <UiButton type="submit" variant="primary" block :disabled="submitting" leadingIcon="refresh" class="h-12">
                  {{ submitting ? t('resetPassword.updating') : t('resetPassword.updatePassword') }}
                </UiButton>
                <button
                  type="button"
                  class="w-full py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  @click="cancel"
                >
                  {{ t('resetPassword.cancelAndReturn') }}
                </button>
              </div>
            </form>
          </UiCardBody>
        </UiCard>
      </div>
    </div>
  </AppLayout>
</template>
