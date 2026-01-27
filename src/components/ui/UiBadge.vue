<script setup lang="ts">
import UiIcon from './UiIcon.vue'

type Props = {
  variant?: 'success' | 'warning' | 'error' | 'info'
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  icon: undefined,
})

function cls() {
  if (props.variant === 'success') return 'ui-badge-success'
  if (props.variant === 'warning') return 'ui-badge-warning'
  if (props.variant === 'error') return 'ui-badge-error'
  return 'ui-badge-info'
}
</script>

<template>
  <span :class="cls()">
    <UiIcon v-if="icon" :name="icon" :size="14" />
    <slot />
  </span>
</template>

