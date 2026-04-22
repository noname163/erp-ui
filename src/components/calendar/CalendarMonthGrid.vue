<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/i18n";
import {
  createAssignmentMap,
  parseMonthKey,
  resolveCalendarDay,
} from "@/services/calendar.service";
import type { CalendarAssignment, CalendarDayType } from "@/services/calendar.service";

type Props = {
  month: string;
  assignments: CalendarAssignment[];
  compact?: boolean;
  interactive?: boolean;
  selectedDate?: string | null;
};

type CalendarCell = {
  key: string;
  date: string;
  day: number;
  inMonth: boolean;
  type: CalendarDayType | null;
  label: string;
  explicit: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  interactive: false,
  selectedDate: null,
});
const { t, locale } = useI18n();

const emit = defineEmits<{
  (e: "select-day", date: string): void;
}>();

const weekdayLabels = computed(() => [
  t("calendar.weekday.mon"),
  t("calendar.weekday.tue"),
  t("calendar.weekday.wed"),
  t("calendar.weekday.thu"),
  t("calendar.weekday.fri"),
  t("calendar.weekday.sat"),
  t("calendar.weekday.sun"),
]);

const assignmentMap = computed(() => createAssignmentMap(props.assignments));

const cells = computed<CalendarCell[]>(() => {
  const firstDay = parseMonthKey(props.month);
  const year = firstDay.getFullYear();
  const monthIndex = firstDay.getMonth();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIndex, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    const resolved = resolveCalendarDay(dateKey, assignmentMap.value);

    return {
      key: `${props.month}-${dateKey}`,
      date: dateKey,
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
      type: resolved.type,
      label: resolved.label,
      explicit: resolved.explicit,
    };
  });
});

const monthLabel = computed(() => {
  const localeTag = locale.value === "zh-TW" ? "zh-TW" : locale.value;
  return new Intl.DateTimeFormat(localeTag, {
    month: props.compact ? "short" : "long",
    year: "numeric",
  }).format(parseMonthKey(props.month));
});

function cardClass(cell: CalendarCell) {
  if (!cell.inMonth) {
    return "bg-slate-100/70 text-slate-300 dark:bg-slate-950 dark:text-slate-700";
  }
  if (!cell.type) {
    return "bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-white dark:ring-slate-800";
  }
  if (cell.type === "HOLIDAY") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:ring-emerald-900/60";
  }
  if (cell.type === "WEEKEND_WORK") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:ring-amber-900/60";
  }
  if (cell.type === "COMPANY_DAY_OFF") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:ring-rose-900/60";
  }
  if (cell.type === "WEEKEND") {
    return "bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800";
  }
  return "bg-primary/5 text-primary ring-1 ring-primary/10 dark:bg-primary/10 dark:text-blue-300 dark:ring-primary/20";
}

function dotClass(cell: CalendarCell) {
  if (!cell.type) return "";
  if (cell.type === "HOLIDAY") return "bg-emerald-500";
  if (cell.type === "WEEKEND_WORK") return "bg-amber-500";
  if (cell.type === "COMPANY_DAY_OFF") return "bg-rose-500";
  if (cell.type === "WEEKEND") return "bg-slate-400";
  return "bg-primary";
}

function selectedClass(cell: CalendarCell) {
  if (!cell.inMonth || cell.date !== props.selectedDate) return "";
  return "ring-2 ring-slate-900 dark:ring-white";
}

function selectDay(cell: CalendarCell) {
  if (!props.interactive || !cell.inMonth) return;
  emit("select-day", cell.date);
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="compact" class="flex items-center justify-between px-1">
      <h4 class="text-sm font-bold text-slate-900 dark:text-white">{{ monthLabel }}</h4>
      <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {{ interactive ? t("calendar.monthGrid.editable") : t("calendar.monthGrid.preview") }}
      </span>
    </div>

    <div class="overflow-hidden rounded-2xl border border-primary/10 bg-slate-200/60 dark:bg-slate-900">
      <div class="grid grid-cols-7 gap-px">
        <div
          v-for="day in weekdayLabels"
          :key="`${month}-header-${day}`"
          class="bg-white px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:bg-slate-950"
          :class="day === t('calendar.weekday.sat') || day === t('calendar.weekday.sun') ? 'text-amber-600 dark:text-amber-400' : ''"
        >
          {{ day }}
        </div>

        <div
          v-for="cell in cells"
          :key="cell.key"
          class="relative flex flex-col overflow-hidden transition-all"
          :class="[
            compact ? 'min-h-[74px] p-2' : 'min-h-[118px] p-3',
            cardClass(cell),
            selectedClass(cell),
            interactive && cell.inMonth ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-sm' : '',
          ]"
          @click="selectDay(cell)"
        >
          <div class="flex items-start justify-between gap-2">
            <span class="font-bold" :class="compact ? 'text-sm' : 'text-base'">
              {{ compact ? cell.day : String(cell.day).padStart(2, '0') }}
            </span>

            <span
              v-if="cell.inMonth && dotClass(cell)"
              class="mt-1 inline-block rounded-full"
              :class="[dotClass(cell), compact ? 'size-1.5' : 'size-2']"
            ></span>
          </div>

          <div
            v-if="!compact && cell.inMonth && cell.label"
            class="mt-3 line-clamp-2 text-[10px] font-bold uppercase tracking-[0.16em]"
          >
            {{ cell.label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
