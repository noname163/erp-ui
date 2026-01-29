<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { AppRoute, type RoleCode } from '@/types'

const router = useRouter()
const auth = useAuthStore()

const LS_REMEMBER_EMAIL = 'erp.login.rememberEmail'

const email = ref('admin@enterprise.io')
const password = ref('admin123')
const showPassword = ref(false)
const remember = ref(false)
const loading = ref(false)
const error = ref('')

onMounted(() => {
    const remembered = localStorage.getItem(LS_REMEMBER_EMAIL)
    if (remembered) {
        email.value = remembered
        remember.value = true
    }
})

async function submit() {
    error.value = ''
    loading.value = true
    try {
        const { firstLogin } = await auth.login(email.value, password.value)
        if (remember.value) localStorage.setItem(LS_REMEMBER_EMAIL, email.value)
        else localStorage.removeItem(LS_REMEMBER_EMAIL)
        console.log('firstLogin', firstLogin)
        if (firstLogin) {
            router.push(AppRoute.RESET_PASSWORD)
            return
        }
        router.push(homeForRole(auth.activeRole))
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Login failed'
    } finally {
        loading.value = false
    }
}

function homeForRole(role: RoleCode | null) {
    if (role === 'HUMAN_RESOURCES') return AppRoute.HR_OVERVIEW
    if (role === 'EMPLOYEE') return AppRoute.LOG_WORK
    if (role === 'ADMIN') return AppRoute.DASHBOARD
    return AppRoute.DASHBOARD
}
</script>

<template>
    <div class="bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-hidden min-h-screen">
        <div class="flex min-h-screen w-full">
            <div
                class="w-full lg:w-[480px] flex flex-col justify-center px-8 lg:px-16 bg-white dark:bg-slate-900 z-10 shadow-xl">
                <div class="mb-10">
                    <div class="flex items-center gap-3 mb-10">
                        <div class="bg-slate-900 dark:bg-slate-800 p-2 rounded-lg">
                            <UiIcon name="corporate_fare" size="30px" class="text-white" />
                        </div>
                        <span class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">ERP Admin</span>
                    </div>

                    <h1 class="text-h1 text-slate-900 dark:text-white mb-3">Welcome back</h1>
                    <p class="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                        Please enter your credentials to access your account.
                    </p>
                </div>

                <form class="space-y-6" @submit.prevent="submit">
                    <div>
                        <p class="ui-label mb-1.5 text-slate-700 dark:text-slate-200">Email Address</p>
                        <UiInput v-model="email" type="email" placeholder="admin@company.com" required
                            autocomplete="username" name="email" />
                    </div>

                    <div>
                        <div class="flex justify-between items-center mb-1.5">
                            <p class="ui-label text-slate-700 dark:text-slate-200">Password</p>
                            <button type="button"
                                class="text-xs font-semibold text-primary hover:underline transition-colors"
                                @click="error = 'Forgot password is not implemented yet.'">
                                Forgot password?
                            </button>
                        </div>
                        <UiInput v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
                            required autocomplete="current-password" name="password"
                            :trailingIcon="showPassword ? 'visibility_off' : 'visibility'"
                            @trailing-click="showPassword = !showPassword" />
                    </div>

                    <div class="flex items-center">
                        <input id="remember" v-model="remember" type="checkbox"
                            class="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary" />
                        <label class="ml-2 text-sm text-slate-500 dark:text-slate-400" for="remember">
                            Remember this device for 30 days
                        </label>
                    </div>

                    <div v-if="error" class="text-sm text-red-500">{{ error }}</div>

                    <UiButton type="submit" variant="primary" block :disabled="loading" class="h-12"
                        trailingIcon="login">
                        <span class="text-button">{{ loading ? 'Signing in...' : 'Sign In' }}</span>
                    </UiButton>
                </form>

                <div class="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div class="flex flex-col gap-4">
                        <p class="text-[13px] text-slate-400 leading-relaxed">
                            Restricted access. Role-based access control (RBAC) is active. Authorized users only.
                        </p>
                        <div class="flex items-center gap-4">
                            <UiBadge variant="info" icon="security">SSL Encrypted</UiBadge>
                            <UiBadge variant="info" icon="verified_user">MFA Enabled</UiBadge>
                        </div>
                    </div>
                </div>
            </div>

            <div class="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
                <div class="absolute inset-0 bg-cover bg-center"
                    style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBkSDCGZS9zvkwzyre3bhXpUTG-TjvgKI1lLBVlUDIRIBSz11FkfoVta88i6i_dg3WSWOsrL1UfFAl274G3Nkla94b68fOJmTWNroHbr3YIlf9jgtyUhJeav8bqqKvRFb6S4K45zAgRy1ZepOSBsnAMx40z0iWv7PvbcQQQ2NByWh8RvXLWPpC0IFUM_P5_8_ONkWELfCwxiT2xjV8BubJtNyegQawUkFakzkaET4ewKxEQKu9gUGeqWAEi6o4XPG_uDA8ydGrjSqZN');">
                </div>
                <div class="absolute inset-0 bg-primary/85"></div>

                <div class="relative z-20 flex flex-col justify-between h-full p-16 text-white">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-1 bg-white opacity-50 rounded-full"></div>
                        <span class="text-xs font-bold uppercase tracking-[0.2em] text-white/80">System Portal</span>
                    </div>
                    <div>
                        <h2 class="text-5xl font-bold leading-[1.15] mb-6 tracking-tight">
                            Centralized Operations &amp; <br />
                            <span class="text-white/60">Resource Planning.</span>
                        </h2>
                        <p class="text-xl text-white/80 max-w-xl leading-relaxed">
                            Efficiency meets professional design. Our secure ERP system manages your entire
                            organization's workflow with
                            precision and security.
                        </p>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex -space-x-3">
                            <div class="w-10 h-10 rounded-full border-2 border-white/20 bg-slate-200 overflow-hidden">
                                <img alt="avatar" class="w-full h-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3p9MXvxctG8d1l5a9LoAn4edwJ_kVS_ngGer2qTkYS9S7wSrFex6hG3fCcp9wUhNbKNuqw6S_aUd2revhKtD_FmrBNJwArqkugjzBE0YPkOHHCAJc4qeYDA2xZU5Q7ezaSPjOT9BTye10nlPM0CWfr4PGzuIXwR3nEgXTV3BK8VgP738uxcWx8T1TfvZ2_142O4r3MEtNoHr8QitrFW6JvQpo4FJGYw-nYzM1HWFK-eIPUhuE3qDCuJsAYeNdMXTFxn2Lbb3GR_uI" />
                            </div>
                            <div class="w-10 h-10 rounded-full border-2 border-white/20 bg-slate-200 overflow-hidden">
                                <img alt="avatar" class="w-full h-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfLHGXhUXUAhsxONiWHcPlW2xBqgp0I4-TXsZkseXJEuNvDkbsCs3SB0nSxM2D1bkPaKLPNtzow4qQtfjT_-zjWNLWkVhO7tgFEPRlK3zgi53im0z9fMaxlFMm72slhEKJn3VyHGWqaFt-EyxJCVnHN4pHB9_Z-2qExb8BKataXd0TdxlhIeAF5t_pquARAQLy_QosKiN-sTsh2Q6xLON1XfuheMktX1WL5QjnK6-3_1NNzPvqNgoUqUF9TOh-CduBHuS6nhnfMtT2" />
                            </div>
                            <div
                                class="w-10 h-10 rounded-full border-2 border-white/20 bg-slate-900/70 text-xs flex items-center justify-center font-bold">
                                +12
                            </div>
                        </div>
                        <p class="text-xs text-white/50 tracking-wide">© 2024 ERP ADMIN SYSTEM • V2.1.0</p>
                    </div>
                </div>

                <div class="absolute top-0 right-0 p-12">
                    <div class="w-32 h-32 border-t border-r border-white/10"></div>
                </div>
                <div class="absolute bottom-0 right-0 p-12">
                    <div class="w-16 h-16 rounded-full border border-white/10"></div>
                </div>
            </div>
        </div>
    </div>
</template>
