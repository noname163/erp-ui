<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardBody from '@/components/ui/UiCardBody.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { AppRoute } from '@/types'

const router = useRouter()
const { t } = useI18n()

const dashboardCards = computed(() => [
  {
    icon: 'business',
    route: AppRoute.COMPANIES,
    titleKey: 'dashboard.cards.companies.title',
    descriptionKey: 'dashboard.cards.companies.description',
  },
  {
    icon: 'apartment',
    route: AppRoute.DEPARTMENTS,
    titleKey: 'dashboard.cards.departments.title',
    descriptionKey: 'dashboard.cards.departments.description',
  },
])
</script>

<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ t('dashboard.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">{{ t('dashboard.subtitle') }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <UiCard v-for="card in dashboardCards" :key="card.route">
        <UiCardBody>
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-bold">{{ t(card.titleKey) }}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ t(card.descriptionKey) }}</p>
            </div>
            <UiIcon :name="card.icon" class="text-primary" />
          </div>
          <button class="text-primary text-sm mt-4 hover:underline" @click="router.push(card.route)">
            {{ t('common.action.open') }}
          </button>
        </UiCardBody>
      </UiCard>
    </div>
  </AppLayout>
</template>
