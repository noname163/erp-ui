<script setup lang="ts">
import UiIcon from "@/components/ui/UiIcon.vue";

type Props = {
  label: string;
  description: string;
  dotClass: string;
  icon: string;
  selected?: boolean;
};

withDefaults(defineProps<Props>(), {
  selected: false,
});

defineEmits<{
  (e: "select"): void;
}>();
</script>

<template>
  <div
    class="overflow-hidden rounded-xl border-2 transition-all"
    :class="
      selected
        ? 'border-primary bg-primary/5 shadow-[0_10px_30px_rgba(19,91,236,0.08)]'
        : 'border-transparent bg-slate-50/70 hover:border-primary/20 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900'
    "
  >
    <button
      type="button"
      class="w-full p-4 text-left"
      @click="$emit('select')"
    >
      <div class="flex items-center gap-4">
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-2xl ring-4 ring-offset-0"
          :class="[dotClass, selected ? 'ring-primary/15' : 'ring-slate-200/70 dark:ring-slate-800']"
        >
          <UiIcon :name="icon" size="18px" class="text-white" />
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-bold text-slate-900 dark:text-white">{{ label }}</p>
            <UiIcon
              :name="selected ? 'radio_button_checked' : 'radio_button_unchecked'"
              size="18px"
              :class="selected ? 'text-primary' : 'text-slate-300 dark:text-slate-600'"
            />
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ description }}</p>
        </div>
      </div>
    </button>
  </div>
</template>
