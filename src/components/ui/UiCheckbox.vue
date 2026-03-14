<script setup lang="ts">
import { computed } from 'vue'

type Props = {
  modelValue: boolean
  label: string
  description?: string
  disabled?: boolean
  name?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  description: undefined,
  name: undefined,
  error: undefined,
})

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const value = computed({
  get: () => !!props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})
</script>

<template>
  <div class="w-full">
    <label class="flex items-start gap-3" :class="disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'">
      <input
        v-model="value"
        type="checkbox"
        :disabled="disabled"
        :name="name"
        class="mt-0.5 w-5 h-5 text-primary border-slate-300 dark:border-slate-700 rounded focus:ring-primary/20 dark:bg-slate-900"
        :class="error ? 'border-rose-500 focus:ring-rose-500/20' : ''"
      />
      <span class="flex flex-col">
        <span class="text-sm font-semibold text-slate-900 dark:text-white">{{ label }}</span>
        <span v-if="description" class="text-xs text-slate-500 dark:text-slate-400">{{ description }}</span>
        <span v-if="error" class="text-xs text-rose-500 mt-1">{{ error }}</span>
      </span>
    </label>
  </div>
</template>

