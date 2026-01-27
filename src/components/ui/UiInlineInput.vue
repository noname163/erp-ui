<script setup lang="ts">
type Props = {
  modelValue: string | number | null
  type?: string
  placeholder?: string
  disabled?: boolean
  name?: string
  autocomplete?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    :value="(props.modelValue ?? '').toString()"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :name="name"
    :autocomplete="autocomplete"
    class="w-full border-none bg-transparent focus:ring-0 text-sm p-0 font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
    @input="onInput"
  />
</template>

