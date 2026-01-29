<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
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

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')

const fieldErrors = computed(() => {
  const errors: Record<string, string> = {}
  if (!currentPassword.value) errors.currentPassword = 'Current password is required.'
  if (!newPassword.value) errors.newPassword = 'New password is required.'
  if (!confirmPassword.value) errors.confirmPassword = 'Please confirm your new password.'
  if (
    newPassword.value &&
    confirmPassword.value &&
    newPassword.value !== confirmPassword.value
  ) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  if (currentPassword.value && newPassword.value && currentPassword.value === newPassword.value) {
    errors.newPassword = 'New password must be different from your current password.'
  }
  return errors
})

const passwordStrength = computed(() => {
  const p = newPassword.value
  const hasLen = p.length >= 8
  const hasNumber = /\d/.test(p)
  const hasSymbol = /[^a-zA-Z0-9]/.test(p)
  const hasUpper = /[A-Z]/.test(p)
  const score = [hasLen, hasNumber, hasSymbol, hasUpper].filter(Boolean).length

  const label = score >= 4 ? 'Strong' : score >= 2 ? 'Medium' : 'Weak'
  const color = score >= 4 ? 'bg-green-500' : score >= 2 ? 'bg-orange-500' : 'bg-red-500'
  const bars = score >= 4 ? 4 : score >= 2 ? 2 : score >= 1 ? 1 : 0
  return { label, color, bars }
})

async function submit() {
  submitError.value = ''
  submitSuccess.value = ''

  if (Object.keys(fieldErrors.value).length) {
    submitError.value = 'Please fix the errors and try again.'
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
    submitError.value = e?.response?.data?.message ?? 'Password update failed.'
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
          <h1 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Security Settings</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">Change your account password</p>
        </div>
      </div>

      <div class="flex justify-center">
        <UiCard class="w-full max-w-md">
          <UiCardBody>
            <div class="text-center mb-8">
              <div
                class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4"
              >
                <span class="material-symbols-outlined text-3xl">lock</span>
              </div>
              <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Change Password</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Update your security credentials for the ERP System.
              </p>
            </div>

            <form class="space-y-6" @submit.prevent="submit">
              <UiInput
                v-model="currentPassword"
                label="Current Password"
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
                  label="New Password"
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
                      Security Strength
                    </span>
                    <span
                      class="text-[10px] font-bold uppercase"
                      :class="
                        passwordStrength.label === 'Strong'
                          ? 'text-green-500'
                          : passwordStrength.label === 'Medium'
                            ? 'text-orange-500'
                            : 'text-red-500'
                      "
                    >
                      {{ passwordStrength.label }}
                    </span>
                  </div>
                  <div class="flex gap-1.5 h-1.5 mb-3">
                    <div
                      v-for="i in 4"
                      :key="i"
                      class="flex-1 rounded-full"
                      :class="i <= passwordStrength.bars ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'"
                    ></div>
                  </div>
                  <p class="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-2">
                    <span class="material-symbols-outlined text-sm mt-0.5 text-primary">info</span>
                    Must be at least 8 characters and include a number and a symbol (uppercase recommended).
                  </p>
                </div>
              </div>

              <UiInput
                v-model="confirmPassword"
                label="Confirm New Password"
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
              <div v-if="submitSuccess" class="text-sm text-green-600 dark:text-green-400">{{ submitSuccess }}</div>

              <div class="pt-2 flex flex-col gap-3">
                <UiButton type="submit" variant="primary" block :disabled="submitting" leadingIcon="refresh" class="h-12">
                  {{ submitting ? 'Updating...' : 'Update Password' }}
                </UiButton>
                <button
                  type="button"
                  class="w-full py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  @click="cancel"
                >
                  Cancel and return
                </button>
              </div>
            </form>
          </UiCardBody>
        </UiCard>
      </div>
    </div>
  </AppLayout>
</template>
