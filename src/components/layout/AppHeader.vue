<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UiButton from '@/components/ui/UiButton.vue'
import { AppRoute } from '@/types'

const auth = useAuthStore()
const router = useRouter()

const initials = computed(() => {
  const email = auth.user?.email ?? ''
  return email ? email.slice(0, 1).toUpperCase() : 'U'
})

function logout() {
  auth.logout()
  router.replace(AppRoute.LOGIN)
}
</script>

<template>
  <header class="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 bg-white dark:bg-background-dark px-6 md:px-10 py-3 shadow-sm">
    <div class="flex items-center gap-4 text-primary dark:text-white">
      <div class="size-8">
        <svg class="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path clip-rule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fill-rule="evenodd"></path>
        </svg>
      </div>
      <h2 class="text-[#0d121b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">ERP Admin System</h2>
    </div>

    <div class="flex items-center gap-3">
      <div class="hidden md:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
        <span class="material-symbols-outlined text-[18px]">person</span>
        <span>{{ auth.user?.email ?? 'User' }}</span>
      </div>
      <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
        {{ initials }}
      </div>
      <UiButton variant="outline" @click="logout">Logout</UiButton>
    </div>
  </header>
</template>
