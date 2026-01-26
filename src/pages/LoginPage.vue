<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import { useAuthStore } from '@/stores/auth'
import { AppRoute, type RoleCode } from '@/types'

const router = useRouter()
const auth = useAuthStore()

const email = ref('admin@enterprise.io')
const password = ref('admin123')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function submit() {
    error.value = ''
    loading.value = true
    try {
        await auth.login(email.value, password.value)
        console.log('Logged in with role:', auth.activeRole)
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
    <div
        class="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col relative overflow-hidden">
        <header
            class="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 bg-white dark:bg-background-dark px-6 md:px-10 py-3 shadow-sm z-10">
            <div class="flex items-center gap-4 text-primary dark:text-white">
                <div class="size-8">
                    <svg class="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path clip-rule="evenodd"
                            d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
                            fill="currentColor" fill-rule="evenodd"></path>
                    </svg>
                </div>
                <h2 class="text-[#0d121b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">ERP Admin
                    System</h2>
            </div>
            <UiButton variant="primary">Contact Support</UiButton>
        </header>

        <main class="flex-1 flex items-center justify-center p-6 md:py-12 z-10">
            <div class="w-full max-w-[480px] flex flex-col gap-6">
                <div class="text-center">
                    <h1 class="text-[#0d121b] dark:text-white tracking-tight text-[32px] font-bold leading-tight pb-2">
                        ERP Portal Access</h1>
                    <p class="text-[#4c669a] dark:text-slate-400 text-base">Secure enterprise resource management</p>
                </div>

                <UiCard>
                    <UiCardBody>
                        <div class="flex items-center justify-between mb-8">
                            <div>
                                <p class="text-[#0d121b] dark:text-white text-xl font-bold leading-tight">Welcome Back
                                </p>
                                <p class="text-[#4c669a] dark:text-slate-400 text-sm mt-1">Please enter your credentials
                                </p>
                            </div>
                            <div class="bg-primary/10 p-3 rounded-full text-primary">
                                <span class="material-symbols-outlined text-3xl">lock_person</span>
                            </div>
                        </div>

                        <form class="space-y-4" @submit.prevent="submit">
                            <UiInput v-model="email" label="Email Address" type="email" placeholder="name@company.com"
                                required autocomplete="username" />
                            <UiInput v-model="password" label="Password" :type="showPassword ? 'text' : 'password'"
                                placeholder="Enter your password" required autocomplete="current-password"
                                :trailingIcon="showPassword ? 'visibility_off' : 'visibility'"
                                @trailing-click="showPassword = !showPassword" />

                            <div v-if="error" class="text-sm text-red-500">{{ error }}</div>

                            <div class="pt-2">
                                <UiButton type="submit" variant="primary" block :disabled="loading">
                                    <span v-if="loading">Signing in...</span>
                                    <span v-else>Sign In</span>
                                </UiButton>
                            </div>
                        </form>
                    </UiCardBody>
                </UiCard>
            </div>
        </main>
    </div>
</template>
