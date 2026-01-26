<script setup lang="ts">
type Props = {
  variant?: 'primary' | 'outline'
  type?: 'button' | 'submit'
  disabled?: boolean
  block?: boolean
}

withDefaults(defineProps<Props>(), { variant: 'primary', type: 'button', disabled: false, block: false })
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="ui-btn"
    :class="[
      variant === 'primary' ? 'ui-btn-primary' : 'ui-btn-outline',
      block ? 'w-full' : '',
      disabled ? 'opacity-60 cursor-not-allowed' : ''
    ]"
  >
    <slot />
  </button>
</template>
