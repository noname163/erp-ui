<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AppRoute } from '@/types'
import { useAuthStore } from '@/stores/auth'

type NavItem = { label: string; icon: string; to: string; roles?: string[] }

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const items = computed<NavItem[]>(() => [
    { label: 'Dashboard', icon: 'dashboard', to: AppRoute.DASHBOARD, roles: ['SYSTEM_ADMIN', "ADMIN", 'COMPANY_MANAGER'] },
    { label: 'Companies', icon: 'business', to: AppRoute.COMPANIES, roles: ['SYSTEM_ADMIN', "ADMIN"] },
    { label: 'Departments', icon: 'apartment', to: AppRoute.DEPARTMENTS, roles: ['SYSTEM_ADMIN', "ADMIN", 'COMPANY_MANAGER'] },
    { label: 'HR Overview', icon: 'group', to: AppRoute.HR_OVERVIEW, roles: ['HUMAN_RESOURCES'] },
    { label: 'Employee Management', icon: 'group', to: AppRoute.EMPLOYEES, roles: ['SYSTEM_ADMIN', 'ADMIN', 'HUMAN_RESOURCES', 'COMPANY_MANAGER'] },
    { label: 'Salary Components', icon: 'tune', to: AppRoute.PAYROLL_COMPONENTS, roles: ['HUMAN_RESOURCES'] },
    { label: 'Salary Templates', icon: 'description', to: AppRoute.PAYROLL_TEMPLATES, roles: ['HUMAN_RESOURCES'] },
    { label: 'Salary Slip', icon: 'receipt_long', to: AppRoute.SALARY_SLIP_LIST, roles: ['HUMAN_RESOURCES', 'COMPANY_MANAGER', 'EMPLOYEE'] },
    { label: 'Authentication', icon: 'verified_user', to: AppRoute.RESET_PASSWORD },
    { label: 'Working Logs', icon: 'history', to: AppRoute.LOG_WORK_LIST, roles: ['EMPLOYEE', 'HUMAN_RESOURCES'] },
    { label: 'Bulk Log Work', icon: 'playlist_add', to: AppRoute.BULK_LOG_WORK, roles: ['HUMAN_RESOURCE'] },
])

function canSee(roles?: string[]) {
    if (!roles) return true
    if (!auth.activeRole) return false
    return roles.includes(auth.activeRole)
}

function isActive(path: string) {
    return route.path === path
}
</script>

<template>
    <aside class="w-72 hidden lg:flex flex-col border-r border-primary/10 bg-white dark:bg-slate-950">
        <div class="p-5 border-b border-primary/10">
            <p class="text-xs text-slate-500 dark:text-slate-400">Active role</p>
            <p class="font-semibold">{{ auth.activeRole ?? 'Not selected' }}</p>
        </div>

        <nav class="p-3 flex-1 overflow-auto">
            <button v-for="it in items" :key="it.to" v-show="canSee(it.roles)"
                class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="isActive(it.to) ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'"
                @click="router.push(it.to)">
                <span class="material-symbols-outlined">{{ it.icon }}</span>
                <span>{{ it.label }}</span>
            </button>
        </nav>
    </aside>
</template>
