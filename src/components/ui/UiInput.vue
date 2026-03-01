<script setup lang="ts">
import { computed } from 'vue'

type Props = {
  modelValue: string | number | null
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  name?: string
  autocomplete?: string
  step?: string | number
  min?: string | number
  max?: string | number
  hint?: string
  error?: string
  leadingIcon?: string
  trailingIcon?: string
  trailingActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  required: false,
  disabled: false,
  trailingActive: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void; (e: 'trailing-click'): void }>()
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

      <div class="relative">
        <span
          v-if="leadingIcon"
          class="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4c669a] dark:text-slate-400"
        >
          {{ leadingIcon }}
        </span>
        <input
          v-model="value"
          :type="type"
          :placeholder="placeholder"
          :required="required"
          :disabled="disabled"
          :name="name"
          :autocomplete="autocomplete"
          :step="step"
          :min="min"
          :max="max"
          class="ui-input pr-12"
          :class="[
            leadingIcon ? 'pl-10' : '',
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : '',
          ]"
        />
        <button
          v-if="trailingIcon"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 hover:text-primary p-1"
          :class="trailingActive ? 'text-primary' : 'text-slate-500'"
          @click="$emit('trailing-click')"
        >
          <span class="material-symbols-outlined">{{ trailingIcon }}</span>
        </button>
      </div>

      <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
      <p v-else-if="hint" class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ hint }}</p>
    </label>
  </div>
</template>
