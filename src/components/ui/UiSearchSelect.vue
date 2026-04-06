<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import UiInput from './UiInput.vue'
import { useI18n } from '@/i18n'

export type UiSearchSelectOption = {
  value: string
  label: string
  subtitle?: string
  avatarUrl?: string
}

type Props = {
  modelValue: string
  options: UiSearchSelectOption[]
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  allowFreeText?: boolean
  leadingIcon?: string
  showValue?: boolean
  sectionTitle?: string
  sectionIcon?: string
  noResultsText?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  required: false,
  disabled: false,
  allowFreeText: true,
  leadingIcon: 'search',
  showValue: true,
  sectionTitle: '',
  sectionIcon: '',
  noResultsText: '',
})
const { t } = useI18n()
const footerText = computed(() => props.noResultsText || t('common.state.noMoreResults'))

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'select', opt: UiSearchSelectOption): void
}>()

const rootEl = ref<HTMLElement | null>(null)
const open = ref(false)
const query = ref('')

const selectedOption = computed(() => props.options.find((o) => o.value === props.modelValue) ?? null)

function syncQueryFromModel() {
  if (selectedOption.value) {
    query.value = selectedOption.value.label
    return
  }
  if (props.allowFreeText) query.value = props.modelValue ?? ''
}

watch(
  () => props.modelValue,
  () => syncQueryFromModel(),
  { immediate: true },
)

const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => {
    const hay = `${o.label} ${o.value} ${o.subtitle ?? ''}`.toLowerCase()
    return hay.includes(q)
  })
})

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function onInput(v: string) {
  query.value = v
  open.value = true
  if (!props.allowFreeText) return
  emit('update:modelValue', v)
}

function pick(opt: UiSearchSelectOption) {
  emit('update:modelValue', opt.value)
  emit('select', opt)
  query.value = opt.label
  open.value = false
}

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onDocumentPointerDown(ev: PointerEvent) {
  const root = rootEl.value
  if (!root) return
  if (ev.target instanceof Node && !root.contains(ev.target)) close()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})
</script>

<template>
  <section>
    <div v-if="sectionTitle" class="flex items-center gap-2 mb-4">
      <span v-if="sectionIcon" class="text-primary">
        <slot name="section-icon">
          <span class="material-symbols-outlined text-[20px]">{{ sectionIcon }}</span>
        </slot>
      </span>
      <h3 class="text-slate-900 dark:text-white font-semibold">{{ sectionTitle }}</h3>
    </div>

    <div ref="rootEl" class="relative w-full">
      <UiInput
        :model-value="query"
        :label="label"
        :placeholder="placeholder"
        :leadingIcon="leadingIcon"
        :trailingIcon="open ? 'keyboard_arrow_up' : 'unfold_more'"
        :trailingActive="open"
        :disabled="disabled"
        :required="required"
        @update:modelValue="onInput"
        @focusin="open = true"
        @keydown.esc.prevent="close"
        @trailing-click="toggle"
      />

      <div
        v-if="open"
        class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden"
      >
        <div class="max-h-60 overflow-y-auto">
          <button
            v-for="opt in filteredOptions"
            :key="opt.value"
            type="button"
            class="w-full text-left px-4 py-3 flex items-center gap-3 cursor-pointer border-l-4 transition-colors"
            :class="
              modelValue === opt.value
                ? 'bg-blue-50 dark:bg-primary/20 border-primary'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border-transparent'
            "
            @click="pick(opt)"
          >
            <div
              v-if="opt.avatarUrl"
              class="w-9 h-9 rounded-full bg-center bg-cover border border-primary/20"
              :style="{ backgroundImage: `url('${opt.avatarUrl}')` }"
            />
            <div
              v-else
              class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              {{ initials(opt.label) }}
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-semibold text-slate-900 dark:text-white">
                {{ opt.label }}<template v-if="showValue"> ({{ opt.value }})</template>
              </span>
              <span v-if="opt.subtitle" class="text-xs text-slate-500 dark:text-slate-400">{{ opt.subtitle }}</span>
            </div>
          </button>
        </div>
        <div
          class="px-4 py-2 text-center text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700"
        >
          {{ footerText }}
        </div>
      </div>
    </div>
  </section>
</template>
