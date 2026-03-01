<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

type Option = { value: string; label: string }

type Props = {
  modelValue: string | null
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  name?: string
  hint?: string
  options: Option[]
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select...',
  required: false,
  disabled: false,
  name: undefined,
  hint: undefined,
})
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const rootEl = ref<HTMLElement | null>(null)
const open = ref(false)
const activeIndex = ref(-1)

const selectedIndex = computed(() => props.options.findIndex((o) => o.value === (props.modelValue ?? '')))
const selectedOption = computed(() => (selectedIndex.value >= 0 ? props.options[selectedIndex.value] : null))
const displayLabel = computed(() => selectedOption.value?.label ?? props.placeholder)
const isPlaceholder = computed(() => !selectedOption.value)

function setOpen(v: boolean) {
  if (props.disabled) return
  open.value = v
  if (v) {
    activeIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : 0
    void nextTick(() => {
      const id = `ui-select-opt-${activeIndex.value}`
      const el = rootEl.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
      el?.scrollIntoView({ block: 'nearest' })
    })
  }
}

function toggle() {
  setOpen(!open.value)
}

function pick(opt: Option) {
  emit('update:modelValue', opt.value)
  setOpen(false)
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return

  if (e.key === 'Escape') {
    e.preventDefault()
    setOpen(false)
    return
  }

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (!open.value) setOpen(true)
    const delta = e.key === 'ArrowDown' ? 1 : -1
    const next = Math.min(props.options.length - 1, Math.max(0, (activeIndex.value < 0 ? 0 : activeIndex.value) + delta))
    activeIndex.value = next
    void nextTick(() => {
      const id = `ui-select-opt-${activeIndex.value}`
      const el = rootEl.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
      el?.scrollIntoView({ block: 'nearest' })
    })
    return
  }

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (!open.value) {
      setOpen(true)
      return
    }
    const opt = props.options[activeIndex.value]
    if (opt) pick(opt)
  }
}

function onDocumentPointerDown(ev: PointerEvent) {
  const root = rootEl.value
  if (!root) return
  if (ev.target instanceof Node && !root.contains(ev.target)) setOpen(false)
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})
</script>

<template>
  <div class="flex flex-col w-full">
    <div class="flex flex-col w-full">
      <p v-if="label" class="ui-label">
        {{ label }} <span v-if="required" class="text-primary">*</span>
      </p>

      <div ref="rootEl" class="relative" @keydown="onKeydown">
        <button
          type="button"
          class="ui-select bg-none text-left flex items-center justify-between pr-12"
          :disabled="disabled"
          :aria-expanded="open ? 'true' : 'false'"
          :class="[
            isPlaceholder ? 'text-[#4c669a] dark:text-slate-400' : '',
            disabled ? 'cursor-not-allowed opacity-60' : '',
            error
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : '',
          ]"
          @click="toggle"
        >
          <span class="truncate">{{ displayLabel }}</span>
          <span
            class="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4c669a] dark:text-slate-400"
            :class="[
              open ? 'text-primary' : '',
              error ? 'text-rose-500' : '',
            ]"
          >
            {{ open ? 'expand_less' : 'expand_more' }}
          </span>
        </button>

        <div
          v-if="open"
          class="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-[#e7ebf3] dark:border-slate-800 rounded-lg shadow-xl overflow-hidden"
        >
          <div class="p-1 max-h-60 overflow-y-auto">
            <button
              v-for="(opt, idx) in options"
              :id="`ui-select-opt-${idx}`"
              :key="opt.value"
              type="button"
              class="w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center justify-between"
              :class="[
                modelValue === opt.value
                  ? 'bg-primary text-white'
                  : 'text-[#0d121b] dark:text-white hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20',
                activeIndex === idx ? (modelValue === opt.value ? '' : 'bg-primary/10 dark:bg-primary/20') : '',
              ]"
              @mousemove="activeIndex = idx"
              @click="pick(opt)"
            >
              <span class="truncate">{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <select
          class="sr-only"
          :name="name"
          :value="modelValue ?? ''"
          :disabled="disabled"
          :required="required"
          tabindex="-1"
          aria-hidden="true"
        >
          <option disabled value="">{{ placeholder }}</option>
          <option v-for="opt in options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <p v-if="error" class="text-xs text-rose-500 mt-1">{{ error }}</p>
      <p v-else-if="hint" class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ hint }}</p>
    </div>
  </div>
</template>
