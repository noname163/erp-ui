<script setup lang="ts">
type Option = { value: string; label: string }

type Props = {
  modelValue: string | null
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options: Option[]
  error?: string
}

const props = withDefaults(defineProps<Props>(), { placeholder: 'Select...', required: false, disabled: false })
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="flex flex-col w-full">
    <label class="flex flex-col w-full">
      <p v-if="label" class="ui-label">
        {{ label }} <span v-if="required" class="text-primary">*</span>
      </p>
      <select
        :value="modelValue ?? ''"
        class="ui-select"
        :disabled="disabled"
        :required="required"
        :class="error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''"
        @change="onChange"
      >
        <option disabled value="">{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
    </label>
  </div>
</template>
