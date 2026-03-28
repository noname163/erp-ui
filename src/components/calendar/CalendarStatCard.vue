<script setup lang="ts">
import UiCard from "@/components/ui/UiCard.vue";
import UiCardBody from "@/components/ui/UiCardBody.vue";
import UiIcon from "@/components/ui/UiIcon.vue";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: string;
  accent?: "default" | "primary";
};

withDefaults(defineProps<Props>(), {
  hint: "",
  icon: undefined,
  accent: "default",
});
</script>

<template>
  <UiCard :class="accent === 'primary' ? 'border-primary/20 bg-primary/5' : ''">
    <UiCardBody class="flex items-start justify-between gap-4">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
          {{ label }}
        </p>
        <p class="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-900 dark:text-white">
          {{ value }}
        </p>
        <p v-if="hint" class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {{ hint }}
        </p>
      </div>

      <div
        v-if="icon"
        class="flex size-11 shrink-0 items-center justify-center rounded-2xl"
        :class="accent === 'primary' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'"
      >
        <UiIcon :name="icon" size="22px" />
      </div>
    </UiCardBody>
  </UiCard>
</template>
