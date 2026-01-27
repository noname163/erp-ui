<script setup lang="ts">
type Option = { value: string; label: string }

type Props = {
  modelValue: string | null
  placeholder?: string
  disabled?: boolean
  required?: boolean
  options: Option[]
}

const props = withDefaults(defineProps<Props>(), { placeholder: 'Select...', disabled: false, required: false })
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <select
    :value="modelValue ?? ''"
    class="w-full border-none bg-transparent focus:ring-0 text-sm p-0"
    :disabled="disabled"
    :required="required"
    @change="onChange"
  >
    <option disabled value="">{{ placeholder }}</option>
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>

