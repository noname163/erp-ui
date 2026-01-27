<script setup lang="ts">
type Props = {
  name: string
  size?: number | string
  fill?: 0 | 1
  wght?: number
  grad?: number
  opsz?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 20,
  fill: 0,
  wght: 400,
  grad: 0,
  opsz: 24,
})
</script>

<template>
  <span
    class="material-symbols-outlined"
    :style="{
      fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
      fontVariationSettings: `'FILL' ${props.fill}, 'wght' ${props.wght}, 'GRAD' ${props.grad}, 'opsz' ${props.opsz}`,
    }"
  >
    {{ props.name }}
  </span>
</template>

