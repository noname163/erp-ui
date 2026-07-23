<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import CalendarLegendOption from "@/components/calendar/CalendarLegendOption.vue";
import CalendarMonthGrid from "@/components/calendar/CalendarMonthGrid.vue";
import CalendarPageHeader from "@/components/calendar/CalendarPageHeader.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardBody from "@/components/ui/UiCardBody.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UiTextarea from "@/components/ui/UiTextarea.vue";
import {
  addMonths,
  calendarService,
  calendarTimezoneOptions,
  createAssignment,
  createAssignmentMap,
  defaultCalendarDateNote,
  formatDisplayDate,
  formatMonthLabel,
  getDateKeysForWeekdaysInMonth,
  getMonthDateKeys,
  getMonthsForView,
  summarizeMonths,
} from "@/services/calendar.service";
import type {
  CalendarAssignment,
  CalendarDayType,
  CalendarWeekday,
  CalendarViewMode,
  CompanyCalendarDateResponse,
  CompanyCalendarRequest,
} from "@/services/calendar.service";
import { useI18n } from "@/i18n";
import { AppRoute } from "@/types";

type CalendarEditorSelection = CalendarDayType | "CLEAR_DATE";
type CalendarEditorOption = {
  value: CalendarEditorSelection;
  label: string;
  description: string;
  icon: string;
  dotClass: string;
};
type CalendarWeekdayOption = {
  value: CalendarWeekday;
  label: string;
};

const weekdaySortOrder: CalendarWeekday[] = [1, 2, 3, 4, 5, 6, 0];

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const form = ref(calendarService.createDraft());
const assignments = ref<CalendarAssignment[]>(calendarService.createAssignments());
const focusMonth = ref("2026-04");
const selectedType = ref<CalendarEditorSelection>("NORMAL");
const assignmentLabel = ref("");
const selectedDate = ref<string | null>(null);
const batchMonth = ref("2026-04");
const batchWeekdays = ref<CalendarWeekday[]>([]);
const viewMode = ref<CalendarViewMode>("MONTH");
const saving = ref(false);
const loadingDetails = ref(false);
const error = ref("");
const message = ref("");

const regionOptions = computed(() => [
  { value: "THAILAND", label: t("calendar.region.thailand") },
  { value: "VIETNAM", label: t("calendar.region.vietnam") },
  { value: "SINGAPORE", label: t("calendar.region.singapore") },
  { value: "GLOBAL", label: t("calendar.region.global") },
]);
const weekdayOptions = computed<CalendarWeekdayOption[]>(() => [
  { value: 1, label: t("calendar.weekday.mon") },
  { value: 2, label: t("calendar.weekday.tue") },
  { value: 3, label: t("calendar.weekday.wed") },
  { value: 4, label: t("calendar.weekday.thu") },
  { value: 5, label: t("calendar.weekday.fri") },
  { value: 6, label: t("calendar.weekday.sat") },
  { value: 0, label: t("calendar.weekday.sun") },
]);

const editorOptions = computed<CalendarEditorOption[]>(() => [
  {
    value: "NORMAL",
    label: t("calendar.dayType.normal.label"),
    description: t("calendar.dayType.normal.description"),
    icon: "check_circle",
    dotClass: "bg-primary",
  },
  {
    value: "WEEKEND",
    label: t("calendar.dayType.weekend.label"),
    description: t("calendar.dayType.weekend.description"),
    icon: "event_busy",
    dotClass: "bg-slate-400",
  },
  {
    value: "HOLIDAY",
    label: t("calendar.dayType.holiday.label"),
    description: t("calendar.dayType.holiday.description"),
    icon: "celebration",
    dotClass: "bg-emerald-500",
  },
  {
    value: "WEEKEND_WORK",
    label: t("calendar.dayType.weekendWork.label"),
    description: t("calendar.dayType.weekendWork.description"),
    icon: "bolt",
    dotClass: "bg-amber-500",
  },
  {
    value: "COMPANY_DAY_OFF",
    label: t("calendar.dayType.companyDayOff.label"),
    description: t("calendar.dayType.companyDayOff.description"),
    icon: "block",
    dotClass: "bg-rose-500",
  },
  {
    value: "CLEAR_DATE",
    label: t("calendar.builder.clearOption.label"),
    description: t("calendar.builder.clearOption.description"),
    icon: "backspace",
    dotClass: "bg-slate-900 dark:bg-white",
  },
]);

const calendarCode = computed(() => queryString(route.query.code));
const isEditMode = computed(() => calendarCode.value.length > 0);
const pageTitle = computed(() =>
  t(isEditMode.value ? "calendar.builder.titleEdit" : "calendar.builder.titleCreate"),
);
const pageEyebrow = computed(() =>
  isEditMode.value
    ? [t("calendar.builder.breadcrumb.organization"), t("calendar.builder.breadcrumb.calendars"), calendarCode.value]
    : [
        t("calendar.builder.breadcrumb.organization"),
        t("calendar.builder.breadcrumb.calendars"),
        t("calendar.builder.breadcrumb.newCalendar"),
      ],
);
const pageDescription = computed(() =>
  isEditMode.value
    ? t("calendar.builder.descriptionEdit")
    : t("calendar.builder.descriptionCreate"),
);

const visibleMonths = computed(() => getMonthsForView(focusMonth.value, viewMode.value));
const assignmentMap = computed(() => createAssignmentMap(assignments.value));
const visibleCounts = computed(() => summarizeMonths(visibleMonths.value, assignmentMap.value));

const currentHeading = computed(() => {
  if (viewMode.value === "MONTH") return formatMonthLabel(focusMonth.value);

  if (viewMode.value === "QUARTER") {
    const first = visibleMonths.value[0];
    const quarter = Math.floor((Number(first.split("-")[1]) - 1) / 3) + 1;
    const year = first.split("-")[0];
    return `Q${quarter} ${year}`;
  }

  return t("calendar.builder.yearOverview", { year: focusMonth.value.split("-")[0] });
});

const currentSelection = computed(() => {
  return editorOptions.value.find((item) => item.value === selectedType.value) ?? editorOptions.value[0];
});

const selectedDateLabel = computed(() => {
  return selectedDate.value ? formatDisplayDate(selectedDate.value) : "";
});

const compiledCalendarRequest = computed<CompanyCalendarRequest>(() => ({
  name: form.value.name.trim(),
  effectiveFrom: form.value.effectiveFrom,
  effectiveTo: form.value.effectiveTo,
  region: form.value.region,
  timeZone: form.value.timezone,
  note: form.value.description.trim(),
  dates: assignments.value
    .map((item) => ({
      calDate: item.date,
      dayType: item.type,
      note: item.label?.trim() || defaultCalendarDateNote(item.type),
    }))
    .sort((left, right) => left.calDate.localeCompare(right.calDate)),
}));

watch(
  () => route.fullPath,
  () => {
    void initializeEditor();
  },
  { immediate: true },
);

async function initializeEditor() {
  error.value = "";
  message.value = "";
  selectedDate.value = null;
  assignmentLabel.value = "";
  selectedType.value = "NORMAL";
  batchWeekdays.value = [];
  viewMode.value = "MONTH";

  if (!isEditMode.value) {
    form.value = calendarService.createDraft();
    assignments.value = calendarService.createAssignments();
    focusMonth.value = resolveFocusMonth(form.value.effectiveFrom, "2026-04");
    batchMonth.value = focusMonth.value;
    return;
  }

  form.value = buildDraftFromQuery();
  assignments.value = [];
  focusMonth.value = resolveFocusMonth(form.value.effectiveFrom, "2026-04");
  await loadCalendarDates(calendarCode.value);
  batchMonth.value = focusMonth.value;
}

function setViewMode(mode: CalendarViewMode) {
  viewMode.value = mode;
}

function moveRange(direction: -1 | 1) {
  const step = viewMode.value === "MONTH" ? 1 : viewMode.value === "QUARTER" ? 3 : 12;
  focusMonth.value = addMonths(focusMonth.value, direction * step);
}

function applyDaySelection(date: string) {
  selectedDate.value = date;
  error.value = "";
  message.value = "";
  const nextType = selectedType.value;

  if (nextType === "CLEAR_DATE") {
    assignments.value = assignments.value.filter((item) => item.date !== date);
    return;
  }

  assignments.value = assignments.value.filter((item) => item.date !== date);
  assignments.value = [...assignments.value, createAssignment(date, nextType, assignmentLabel.value)].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function toggleBatchWeekday(day: CalendarWeekday) {
  const nextWeekdays = batchWeekdays.value.includes(day)
    ? batchWeekdays.value.filter((item) => item !== day)
    : [...batchWeekdays.value, day];

  batchWeekdays.value = nextWeekdays.sort(
    (left, right) => weekdaySortOrder.indexOf(left) - weekdaySortOrder.indexOf(right),
  );
}

function isBatchWeekdaySelected(day: CalendarWeekday) {
  return batchWeekdays.value.includes(day);
}

function applyWeekdaySelection() {
  error.value = "";
  message.value = "";

  if (!batchMonth.value) {
    error.value = t("calendar.builder.validation.batchMonthRequired");
    return;
  }
  if (batchWeekdays.value.length === 0) {
    error.value = t("calendar.builder.validation.batchWeekdaysRequired");
    return;
  }

  const dates = getDateKeysForWeekdaysInMonth(batchMonth.value, batchWeekdays.value);
  const dateSet = new Set(dates);
  const retainedAssignments = assignments.value.filter((item) => !dateSet.has(item.date));
  focusMonth.value = batchMonth.value;

  if (selectedType.value === "CLEAR_DATE") {
    assignments.value = retainedAssignments;
    message.value = t("calendar.builder.messages.weekdayPatternApplied", {
      count: dates.length,
      month: formatMonthLabel(batchMonth.value),
    });
    return;
  }

  assignments.value = [
    ...retainedAssignments,
    ...dates.map((date) => createAssignment(date, selectedType.value as CalendarDayType, assignmentLabel.value)),
  ].sort((left, right) => left.date.localeCompare(right.date));
  selectedDate.value = dates[dates.length - 1] ?? selectedDate.value;
  message.value = t("calendar.builder.messages.weekdayPatternApplied", {
    count: dates.length,
    month: formatMonthLabel(batchMonth.value),
  });
}

async function loadCalendarDates(code: string) {
  if (!code) return;

  loadingDetails.value = true;

  try {
    const response = await calendarService.listDates(code);
    const items = normalizeCollection(response);
    assignments.value = items
      .map(normalizeAssignment)
      .filter((item): item is CalendarAssignment => item !== null)
      .sort((left, right) => left.date.localeCompare(right.date));

    if (assignments.value.length > 0) {
      focusMonth.value = assignments.value[0].date.slice(0, 7);
    }
  } catch (e: any) {
    assignments.value = [];
    error.value = e?.response?.data?.message ?? t("calendar.builder.errors.loadDatesFailed");
  } finally {
    loadingDetails.value = false;
  }
}

async function saveCalendar() {
  error.value = "";
  message.value = "";

  if (!compiledCalendarRequest.value.name) {
    error.value = t("calendar.builder.validation.nameRequired");
    return;
  }
  if (!compiledCalendarRequest.value.effectiveFrom || !compiledCalendarRequest.value.effectiveTo) {
    error.value = t("calendar.builder.validation.effectiveDatesRequired");
    return;
  }
  if (compiledCalendarRequest.value.effectiveFrom < getTodayDateKey()) {
    error.value = t("calendar.builder.validation.pastEffectiveFrom");
    return;
  }
  if (!compiledCalendarRequest.value.region) {
    error.value = t("calendar.builder.validation.regionRequired");
    return;
  }
  if (!compiledCalendarRequest.value.timeZone) {
    error.value = t("calendar.builder.validation.timezoneRequired");
    return;
  }
  if (!compiledCalendarRequest.value.note) {
    error.value = t("calendar.builder.validation.notesRequired");
    return;
  }

  saving.value = true;

  try {
    const response = isEditMode.value
      ? await calendarService.update(calendarCode.value, compiledCalendarRequest.value)
      : await calendarService.create(compiledCalendarRequest.value);

    if (response.status === 200 || response.status === 201) {
      await router.push(AppRoute.CALENDARS);
      return;
    }
    message.value = t("calendar.builder.messages.unexpectedStatus", { status: response.status });
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? (isEditMode.value
      ? t("calendar.builder.errors.updateFailed")
      : t("calendar.builder.errors.createFailed"));
  } finally {
    saving.value = false;
  }
}

function exportCsv() {
  const rows = visibleMonths.value.flatMap((month) =>
    getMonthDateKeys(month).map((date) => {
      const explicit = assignmentMap.value.get(date);
      return [
        date,
        explicit?.type ?? "",
        explicit?.label ?? "",
      ];
    }),
  );

  const csv = [["date", "type", "label"], ...rows]
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `calendar-${viewMode.value.toLowerCase()}-${focusMonth.value}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildDraftFromQuery() {
  const defaults = calendarService.createDraft();
  return {
    name: queryString(route.query.name) || defaults.name,
    effectiveFrom: queryString(route.query.effectiveFrom) || defaults.effectiveFrom,
    effectiveTo: queryString(route.query.effectiveTo) || defaults.effectiveTo,
    region: queryString(route.query.region) || defaults.region,
    timezone: queryString(route.query.timezone) || defaults.timezone,
    description: sanitizeNote(queryString(route.query.note)) || "",
  };
}

function normalizeCollection(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => item !== null);
  }

  const record = asRecord(payload);
  if (!record) return [];

  const directCollection = firstDefined(
    record.content,
    record.data,
    record.items,
    record.results,
    record.rows,
    record.records,
  );

  if (Array.isArray(directCollection)) {
    return directCollection
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => item !== null);
  }

  if (directCollection && typeof directCollection === "object") {
    return normalizeCollection(directCollection);
  }

  return [];
}

function normalizeAssignment(item: Record<string, unknown>) {
  const date = toDateString(firstDefined(item.calDate, item.date, item.workDate));
  if (!date) return null;

  const type = normalizeDayType(firstDefined(item.dayType, item.type));
  if (!type) return null;
  const response = item as CompanyCalendarDateResponse;

  return createAssignment(date, type, queryString(firstDefined(item.note, item.label, response.note)));
}

function normalizeDayType(value: unknown): CalendarDayType | null {
  const token = queryString(value)
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (token === "HOLIDAY") return "HOLIDAY";
  if (token === "WEEKEND_WORK") return "WEEKEND_WORK";
  if (token === "COMPANY_DAY_OFF") return "COMPANY_DAY_OFF";
  if (token === "NORMAL") return "NORMAL";
  if (token === "WEEKEND") return "WEEKEND";
  return null;
}

function queryString(value: unknown): string {
  if (Array.isArray(value)) return queryString(value[0]);
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function toDateString(value: unknown) {
  const normalized = queryString(value);
  if (!normalized) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function resolveFocusMonth(date: string, fallback: string) {
  const normalized = toDateString(date);
  return normalized ? normalized.slice(0, 7) : fallback;
}

function sanitizeNote(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-" || trimmed === "\u2014") return "";
  return trimmed;
}

function firstDefined(...values: unknown[]) {
  return values.find((value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });
}

function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
</script>

<template>
  <AppLayout>
    <div class="space-y-8">
      <CalendarPageHeader
        :eyebrow="pageEyebrow"
        :title="pageTitle"
        :description="pageDescription"
      >
        <template #actions>
          <UiButton variant="outline" leading-icon="arrow_back" @click="router.push(AppRoute.CALENDARS)">
            {{ t('calendar.builder.actions.backToList') }}
          </UiButton>
        </template>
      </CalendarPageHeader>

      <div
        v-if="isEditMode"
        class="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700"
      >
        {{ t('calendar.builder.editBanner', { code: calendarCode }) }}
      </div>

      <div class="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div class="space-y-6 xl:col-span-4">
          <UiCard>
            <UiCardBody class="space-y-5">
              <div class="flex items-center gap-3">
                <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UiIcon name="settings_suggest" size="22px" />
                </div>
                <div>
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ t('calendar.builder.sections.configuration') }}</h2>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    {{ isEditMode ? t('calendar.builder.sections.configurationEditHint') : t('calendar.builder.sections.configurationCreateHint') }}
                  </p>
                </div>
              </div>

              <UiInput
                v-model="form.name"
                :label="t('calendar.builder.fields.calendarName')"
                :placeholder="t('calendar.builder.fields.calendarName')"
                required
              />

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UiInput v-model="form.effectiveFrom" :label="t('common.field.effectiveFrom')" type="date" required />
                <UiInput v-model="form.effectiveTo" :label="t('common.field.effectiveTo')" type="date" required />
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UiSelect v-model="form.region" :label="t('common.field.region')" :options="regionOptions" />
                <UiSelect v-model="form.timezone" :label="t('common.field.timezone')" :options="calendarTimezoneOptions" />
              </div>

              <UiTextarea
                v-model="form.description"
                :label="t('calendar.builder.fields.notes')"
                :rows="4"
                :placeholder="t('calendar.builder.fields.notesPlaceholder')"
              />
            </UiCardBody>
          </UiCard>

          <UiCard>
            <UiCardBody class="space-y-5">
              <div class="flex items-center gap-3">
                <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UiIcon name="brush" size="22px" />
                </div>
                <div>
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ t('calendar.builder.sections.dateAssignment') }}</h2>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    {{ t('calendar.builder.sections.dateAssignmentHint') }}
                  </p>
                </div>
              </div>

              <div class="space-y-3">
                <CalendarLegendOption
                  v-for="option in editorOptions"
                  :key="option.value"
                  :label="option.label"
                  :description="option.description"
                  :dot-class="option.dotClass"
                  :icon="option.icon"
                  :selected="selectedType === option.value"
                  @select="selectedType = option.value"
                />
              </div>

              <UiInput
                v-model="assignmentLabel"
                :label="t('calendar.builder.fields.assignmentLabel')"
                :placeholder="t('calendar.builder.fields.assignmentPlaceholder')"
                :disabled="selectedType === 'CLEAR_DATE'"
                :hint="
                  selectedType === 'CLEAR_DATE'
                    ? t('calendar.builder.hints.clearMode')
                    : t('calendar.builder.hints.assignmentLabel')
                "
              />

              <section class="space-y-4 border-t border-primary/10 pt-5">
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ t('calendar.builder.sections.batchAssignment') }}</h3>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t('calendar.builder.hints.batchAssignment') }}</p>
                </div>

                <div class="grid grid-cols-1 gap-4">
                  <UiInput
                    v-model="batchMonth"
                    :label="t('calendar.builder.fields.batchMonth')"
                    type="month"
                  />
                </div>

                <div class="space-y-2">
                  <p class="ui-label">{{ t('calendar.builder.fields.batchWeekdays') }}</p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="weekday in weekdayOptions"
                      :key="weekday.value"
                      type="button"
                      class="rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
                      :class="isBatchWeekdaySelected(weekday.value)
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'"
                      @click="toggleBatchWeekday(weekday.value)"
                    >
                      {{ weekday.label }}
                    </button>
                  </div>
                </div>

                <UiButton block leading-icon="calendar_month" @click="applyWeekdaySelection">
                  {{ t('calendar.builder.actions.applyWeekdayPattern') }}
                </UiButton>
              </section>
            </UiCardBody>
          </UiCard>

          <UiButton block leading-icon="save" :disabled="saving || loadingDetails" @click="saveCalendar">
            {{ saving ? t('common.state.saving') : isEditMode ? t('calendar.builder.actions.saveChanges') : t('calendar.builder.actions.saveCalendarTemplate') }}
          </UiButton>

          <p v-if="error" class="text-sm font-medium text-red-500">{{ error }}</p>
          <p v-if="message" class="text-sm font-medium text-emerald-600">{{ message }}</p>
        </div>

        <div class="xl:col-span-8">
          <UiCard class="overflow-hidden">
            <div class="border-b border-primary/10 px-4 py-4 md:px-6">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex items-center gap-3">
                  <UiButton variant="outline" icon-only @click="moveRange(-1)">
                    <UiIcon name="chevron_left" size="20px" />
                  </UiButton>
                  <div>
                    <h3 class="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-white">
                      {{ currentHeading }}
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                      {{ t('calendar.builder.sections.calendarSurfaceHint') }}
                    </p>
                  </div>
                  <UiButton variant="outline" icon-only @click="moveRange(1)">
                    <UiIcon name="chevron_right" size="20px" />
                  </UiButton>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UiButton :variant="viewMode === 'MONTH' ? 'primary' : 'outline'" @click="setViewMode('MONTH')">
                    {{ t('calendar.builder.viewModes.month') }}
                  </UiButton>
                  <UiButton :variant="viewMode === 'QUARTER' ? 'primary' : 'outline'" @click="setViewMode('QUARTER')">
                    {{ t('calendar.builder.viewModes.quarter') }}
                  </UiButton>
                  <UiButton :variant="viewMode === 'YEAR' ? 'primary' : 'outline'" @click="setViewMode('YEAR')">
                    {{ t('calendar.builder.viewModes.year') }}
                  </UiButton>
                </div>
              </div>
            </div>

            <div class="p-4 md:p-6">
              <div v-if="loadingDetails" class="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-950/50">
                {{ t('calendar.builder.loadingDates') }}
              </div>

              <CalendarMonthGrid
                v-else-if="viewMode === 'MONTH'"
                :month="visibleMonths[0]"
                :assignments="assignments"
                :selected-date="selectedDate"
                interactive
                @select-day="applyDaySelection"
              />

              <div v-else-if="!loadingDetails && viewMode === 'QUARTER'" class="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <CalendarMonthGrid
                  v-for="month in visibleMonths"
                  :key="month"
                  :month="month"
                  :assignments="assignments"
                  :selected-date="selectedDate"
                  compact
                  interactive
                  @select-day="applyDaySelection"
                />
              </div>

              <div v-else-if="!loadingDetails" class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                <CalendarMonthGrid
                  v-for="month in visibleMonths"
                  :key="month"
                  :month="month"
                  :assignments="assignments"
                  :selected-date="selectedDate"
                  compact
                  interactive
                  @select-day="applyDaySelection"
                />
              </div>
            </div>

            <div class="border-t border-primary/10 bg-slate-50/70 px-4 py-4 md:px-6 dark:bg-slate-950/40">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex flex-wrap items-center gap-5">
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span class="size-3 rounded-full bg-primary"></span>
                    {{ visibleCounts.NORMAL }} {{ t('calendar.builder.summary.workDays') }}
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span class="size-3 rounded-full bg-emerald-500"></span>
                    {{ visibleCounts.HOLIDAY }} {{ t('calendar.builder.summary.holidays') }}
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span class="size-3 rounded-full bg-slate-400"></span>
                    {{ visibleCounts.WEEKEND }} {{ t('calendar.builder.summary.weekends') }}
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span class="size-3 rounded-full bg-amber-500"></span>
                    {{ visibleCounts.WEEKEND_WORK + visibleCounts.COMPANY_DAY_OFF }} {{ t('calendar.builder.summary.overrides') }}
                  </div>
                </div>

                <UiButton variant="outline" leading-icon="download" @click="exportCsv">
                  {{ t('calendar.builder.actions.exportCsv') }}
                </UiButton>
              </div>
            </div>
          </UiCard>
        </div>
      </div>

      <div
        class="fixed bottom-6 right-6 z-40 hidden max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-slate-900 px-5 py-4 text-white shadow-2xl xl:flex"
      >
        <UiIcon name="info" size="20px" class="mt-0.5 text-emerald-400" :fill="1" />
        <div class="text-sm">
          <p class="font-bold">{{ t('calendar.builder.selection.active') }}</p>
          <p class="mt-1 text-slate-300">
            <template v-if="selectedType === 'CLEAR_DATE'">
              {{ t('calendar.builder.selection.clearDescription') }}
            </template>
            <template v-else>
              {{ t('calendar.builder.selection.applyDescription', {
                type: currentSelection.label,
                labelSuffix: assignmentLabel ? t('calendar.builder.selection.labelSuffix', { label: assignmentLabel }) : '',
              }) }}
            </template>
          </p>
          <p v-if="selectedDateLabel" class="mt-1 text-slate-400">
            {{ t('calendar.builder.selection.selectedDate', { date: selectedDateLabel }) }}
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
