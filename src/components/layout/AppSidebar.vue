<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { appNavItems, canSeeNavItem, isNavItemActive } from './navigation'
import { translateRole } from '@/i18n/role'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const visibleItems = computed(() =>
  appNavItems.filter((item) => !item.hidden && canSeeNavItem(item, auth.activeRole)),
)

const activeRoleLabel = computed(() => translateRole(t, auth.activeRole))
</script>

<template>
  <aside class="w-72 hidden lg:flex flex-col border-r border-primary/10 bg-white dark:bg-slate-950">
    <div class="p-5 border-b border-primary/10">
      <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('common.role.label') }}</p>
      <p class="font-semibold">{{ activeRoleLabel }}</p>
    </div>

    <nav class="p-3 flex-1 overflow-auto">
      <button
        v-for="item in visibleItems"
        :key="item.to"
        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="isNavItemActive(item, route.path) ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'"
        @click="router.push(item.to)"
      >
        <span class="material-symbols-outlined">{{ item.icon }}</span>
        <span>{{ t(item.labelKey) }}</span>
      </button>
    </nav>
  </aside>
</template>
