<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

type Option = { value: string; label: string }

let __uiInlineSelectId = 0

type Props = {
  modelValue: string | null
  placeholder?: string
  disabled?: boolean
  required?: boolean
  name?: string
  options: Option[]
}

const props = withDefaults(defineProps<Props>(), { placeholder: 'Select...', disabled: false, required: false })
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const rootEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLElement | null>(null)
const open = ref(false)
const activeIndex = ref(-1)
const menuEl = ref<HTMLElement | null>(null)
const openUp = ref(false)
const instanceId = __uiInlineSelectId++

const menuStyle = ref<Record<string, string>>({})

const selectedIndex = computed(() => props.options.findIndex((o) => o.value === (props.modelValue ?? '')))
const selectedOption = computed(() => (selectedIndex.value >= 0 ? props.options[selectedIndex.value] : null))
const displayLabel = computed(() => selectedOption.value?.label ?? props.placeholder)
const isPlaceholder = computed(() => !selectedOption.value)

function updateMenuPosition() {
  if (!open.value) return
  const triggerRect = triggerEl.value?.getBoundingClientRect()
  const menuRect = menuEl.value?.getBoundingClientRect()
  if (!triggerRect || !menuRect) return

  const gap = 8
  const width = Math.max(Math.ceil(triggerRect.width), 220)
  const left = Math.min(
    Math.max(8, triggerRect.left),
    Math.max(8, window.innerWidth - width - 8),
  )

  const wouldOverflowBottom = triggerRect.bottom + menuRect.height + gap > window.innerHeight
  const hasSpaceAbove = triggerRect.top - menuRect.height - gap > 0
  openUp.value = wouldOverflowBottom && hasSpaceAbove

  const top = openUp.value ? triggerRect.top - menuRect.height - gap : triggerRect.bottom + gap
  menuStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${Math.max(8, top)}px`,
    width: `${width}px`,
    zIndex: '50',
  }
}

function setOpen(v: boolean) {
  if (props.disabled) return
  open.value = v
  if (v) {
    openUp.value = false
    activeIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : 0
    void nextTick(() => {
      updateMenuPosition()

      const id = `ui-inline-select-${instanceId}-opt-${activeIndex.value}`
      const el = menuEl.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
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
      updateMenuPosition()
      const id = `ui-inline-select-${instanceId}-opt-${activeIndex.value}`
      const el = menuEl.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
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
  const menu = menuEl.value
  if (!root) return
  if (!(ev.target instanceof Node)) return
  if (root.contains(ev.target)) return
  if (menu?.contains(ev.target)) return
  setOpen(false)
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  window.addEventListener('resize', updateMenuPosition)
  window.addEventListener('scroll', updateMenuPosition, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  window.removeEventListener('resize', updateMenuPosition)
  window.removeEventListener('scroll', updateMenuPosition, true)
})
</script>

<template>
  <div ref="rootEl" class="relative w-full" @keydown="onKeydown">
    <button
      ref="triggerEl"
      type="button"
      class="w-full border-none bg-transparent focus:ring-0 text-sm p-0 font-medium text-slate-900 dark:text-white text-left pr-6"
      :class="[
        isPlaceholder ? 'text-slate-400' : '',
        disabled ? 'cursor-not-allowed opacity-60' : ''
      ]"
      :disabled="disabled"
      :aria-expanded="open ? 'true' : 'false'"
      @click="toggle"
    >
      <span class="truncate">{{ displayLabel }}</span>
      <span
        class="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[18px] text-slate-400"
        :class="open ? 'text-primary' : ''"
      >
        {{ open ? 'expand_less' : 'expand_more' }}
      </span>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="menuEl"
        class="bg-white dark:bg-slate-900 border border-[#e7ebf3] dark:border-slate-800 rounded-lg shadow-xl overflow-hidden"
        :style="menuStyle"
      >
        <div class="p-1 max-h-60 overflow-y-auto overflow-x-hidden">
          <button
            v-for="(opt, idx) in options"
            :id="`ui-inline-select-${instanceId}-opt-${idx}`"
            :key="opt.value"
            type="button"
            class="w-full text-left px-3 py-2 text-sm rounded transition-colors"
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
    </Teleport>

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
</template>
