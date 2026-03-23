<script setup lang="ts">
import UiIcon from "@/components/ui/UiIcon.vue";

type Props = {
  eyebrow?: string[];
  title: string;
  description?: string;
};

withDefaults(defineProps<Props>(), {
  eyebrow: () => [],
  description: "",
});
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <div
        v-if="eyebrow.length"
        class="flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400"
      >
        <template v-for="(item, index) in eyebrow" :key="`${item}-${index}`">
          <span>{{ item }}</span>
          <UiIcon
            v-if="index < eyebrow.length - 1"
            name="chevron_right"
            size="14px"
            class="text-slate-300"
          />
        </template>
      </div>
      <h1 class="mt-3 text-3xl md:text-4xl font-bold tracking-[-0.03em] text-slate-900 dark:text-white">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
        {{ description }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex flex-wrap gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>
