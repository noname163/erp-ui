<script setup lang="ts">
import UiIcon from './UiIcon.vue'

type Props = {
  variant?: 'primary' | 'outline'
  type?: 'button' | 'submit'
  disabled?: boolean
  block?: boolean
  leadingIcon?: string
  trailingIcon?: string
  iconOnly?: boolean
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
  block: false,
  leadingIcon: undefined,
  trailingIcon: undefined,
  iconOnly: false,
  iconSize: 18,
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="ui-btn"
    :class="[
      variant === 'primary' ? 'ui-btn-primary' : 'ui-btn-outline',
      iconOnly ? 'ui-btn-icon' : '',
      block ? 'w-full' : '',
      disabled ? 'opacity-60 cursor-not-allowed' : ''
    ]"
  >
    <UiIcon v-if="leadingIcon" :name="leadingIcon" :size="iconSize" />
    <slot />
    <UiIcon v-if="trailingIcon" :name="trailingIcon" :size="iconSize" />
  </button>
</template>
