<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type CSSProperties } from "vue";

type Props = {
  modelValue?: boolean;
  placement?: "bottom-start" | "bottom-end";
  offset?: number;
  panelClass?: string;
  hoverable?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placement: "bottom-end",
  offset: 8,
  panelClass: "",
  hoverable: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const triggerRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const internalOpen = ref(false);
const positioned = ref(false);
const position = ref({ top: 0, left: 0 });
const closeTimer = ref<number | null>(null);

const isControlled = computed(() => props.modelValue !== undefined);
const isOpen = computed({
  get() {
    return isControlled.value ? Boolean(props.modelValue) : internalOpen.value;
  },
  set(value: boolean) {
    if (!isControlled.value) internalOpen.value = value;
    emit("update:modelValue", value);
  },
});

const floatingStyle = computed<CSSProperties>(() => ({
  top: `${position.value.top}px`,
  left: `${position.value.left}px`,
  visibility: positioned.value ? "visible" : "hidden",
}));

function clearCloseTimer() {
  if (closeTimer.value !== null) {
    window.clearTimeout(closeTimer.value);
    closeTimer.value = null;
  }
}

function updatePosition() {
  const trigger = triggerRef.value;
  const panel = panelRef.value;

  if (!trigger || !panel) return;

  const triggerRect = trigger.getBoundingClientRect();
  const panelWidth = panel.offsetWidth || 144;
  const viewportPadding = 8;

  let left =
    props.placement === "bottom-start"
      ? triggerRect.left
      : triggerRect.right - panelWidth;

  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - panelWidth - viewportPadding));

  position.value = {
    top: triggerRect.bottom + props.offset,
    left,
  };
  positioned.value = true;
}

function openMenu() {
  clearCloseTimer();
  positioned.value = false;
  isOpen.value = true;
  nextTick(updatePosition);
}

function closeMenu() {
  clearCloseTimer();
  positioned.value = false;
  isOpen.value = false;
}

function toggleMenu() {
  if (isOpen.value) {
    closeMenu();
    return;
  }

  openMenu();
}

function scheduleClose() {
  if (!props.hoverable) return;

  clearCloseTimer();
  closeTimer.value = window.setTimeout(() => {
    closeMenu();
  }, 120);
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!isOpen.value) return;

  const target = event.target;
  if (!(target instanceof Node)) return;

  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) return;

  closeMenu();
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    closeMenu();
  }
}

function addGlobalListeners() {
  document.addEventListener("pointerdown", onDocumentPointerDown, true);
  document.addEventListener("keydown", onDocumentKeydown);
  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);
}

function removeGlobalListeners() {
  document.removeEventListener("pointerdown", onDocumentPointerDown, true);
  document.removeEventListener("keydown", onDocumentKeydown);
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
}

watch(
  () => isOpen.value,
  (open) => {
    if (open) {
      addGlobalListeners();
      nextTick(updatePosition);
      return;
    }

    removeGlobalListeners();
    clearCloseTimer();
    positioned.value = false;
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  removeGlobalListeners();
  clearCloseTimer();
});
</script>

<template>
  <div
    class="inline-flex"
    @mouseenter="hoverable ? openMenu() : undefined"
    @mouseleave="hoverable ? scheduleClose() : undefined"
  >
    <div ref="triggerRef" class="inline-flex">
      <slot
        name="trigger"
        :open="isOpen"
        :toggle="toggleMenu"
        :openMenu="openMenu"
        :closeMenu="closeMenu"
      />
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="panelRef"
      class="fixed z-[80]"
      :style="floatingStyle"
      @mouseenter="clearCloseTimer"
      @mouseleave="hoverable ? scheduleClose() : undefined"
    >
      <div
        class="rounded-xl border border-primary/10 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-950"
        :class="panelClass"
      >
        <slot :close="closeMenu" />
      </div>
    </div>
  </Teleport>
</template>
