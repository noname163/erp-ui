<script setup lang="ts">
import { computed } from 'vue'
import { SUPPORTED_LOCALES, setLocale, useI18n, type SupportedLocale } from '@/i18n'

const { t, locale } = useI18n()

const localeOptions = computed(() =>
  SUPPORTED_LOCALES.map((value) => ({
    value,
    label: value === 'zh-TW' ? t('common.locale.zhTW') : t(`common.locale.${value}`),
  })),
)

function onLocaleChange(event: Event) {
  const nextLocale = (event.target as HTMLSelectElement).value as SupportedLocale
  setLocale(nextLocale)
}
</script>

<template>
  <label class="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
    <span class="material-symbols-outlined text-[18px]">language</span>
    <span class="hidden md:inline">{{ t('common.locale.label') }}</span>
    <select
      class="border border-primary/20 rounded-md px-2 py-1 text-sm text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-900"
      :value="locale"
      @change="onLocaleChange"
    >
      <option v-for="option in localeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
  </label>
</template>
