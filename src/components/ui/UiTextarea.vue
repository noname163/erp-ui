<script setup lang="ts">
import { computed } from 'vue'

type Props = {
  modelValue: string | null
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  name?: string
  rows?: number
  hint?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  required: false,
  disabled: false,
  rows: 3,
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const value = computed({
  get: () => (props.modelValue ?? '').toString(),
  set: (v: string) => emit('update:modelValue', v),
})
</script>

<template>
  <div class="flex flex-col w-full">
    <label class="flex flex-col w-full">
      <p v-if="label" class="ui-label">
        {{ label }} <span v-if="required" class="text-primary">*</span>
      </p>

      <textarea
        v-model="value"
        class="ui-textarea"
        :rows="rows"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :name="name"
        :class="[
          error
            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
            : '',
          disabled ? 'cursor-not-allowed opacity-60' : '',
        ]"
      />

      <p v-if="error" class="text-xs text-rose-500 mt-1">{{ error }}</p>
      <p v-else-if="hint" class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ hint }}</p>
    </label>
  </div>
</template>

