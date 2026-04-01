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
  calendarRegionOptions,
  calendarService,
  calendarTimezoneOptions,
  calendarTypeOptions,
  createAssignment,
  createAssignmentMap,
  defaultCalendarDateNote,
  formatDisplayDate,
  formatMonthLabel,
  getMonthDateKeys,
  getMonthsForView,
  isWeekend,
  summarizeMonths,
} from "@/services/calendar.service";
import type {
  CalendarAssignment,
  CalendarDayType,
  CalendarViewMode,
  CompanyCalendarDateResponse,
  CompanyCalendarRequest,
} from "@/services/calendar.service";
import { AppRoute } from "@/types";

type CalendarEditorSelection = CalendarDayType | "CLEAR_DATE";
type CalendarEditorOption = {
  value: CalendarEditorSelection;
  label: string;
  description: string;
  icon: string;
  dotClass: string;
};

const router = useRouter();
const route = useRoute();

const form = ref(calendarService.createDraft());
const assignments = ref<CalendarAssignment[]>(calendarService.createAssignments());
const focusMonth = ref("2026-04");
const selectedType = ref<CalendarEditorSelection>("WORKING_DAY");
const assignmentLabel = ref("");
const selectedDate = ref<string | null>(null);
const viewMode = ref<CalendarViewMode>("MONTH");
const saving = ref(false);
const loadingDetails = ref(false);
const error = ref("");
const message = ref("");

const clearOption: CalendarEditorOption = {
  value: "CLEAR_DATE",
  label: "Clear date",
  description: "Remove an explicit override and revert to the default calendar day",
  icon: "backspace",
  dotClass: "bg-slate-900 dark:bg-white",
};

const editorOptions: CalendarEditorOption[] = [...calendarTypeOptions, clearOption];

const calendarCode = computed(() => queryString(route.query.code));
const isEditMode = computed(() => calendarCode.value.length > 0);
const pageTitle = computed(() => (isEditMode.value ? "Edit Calendar" : "Create Calendar"));
const pageEyebrow = computed(() =>
  isEditMode.value
    ? ["Organization", "Calendars", calendarCode.value]
    : ["Organization", "Calendars", "New Calendar"],
);
const pageDescription = computed(() =>
  isEditMode.value
    ? "Loaded from the selected calendar code. Dates are fetched from the company calendar dates endpoint and shown in the existing editor layout."
    : "Define operating periods and assign exceptions for holidays, shutdowns, and weekend coverage.",
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

  return `${focusMonth.value.split("-")[0]} Calendar Overview`;
});

const currentSelection = computed(() => {
  return editorOptions.find((item) => item.value === selectedType.value) ?? editorOptions[0];
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
    .sort((a, b) => a.calDate.localeCompare(b.calDate)),
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
  selectedType.value = "WORKING_DAY";
  viewMode.value = "MONTH";

  if (!isEditMode.value) {
    form.value = calendarService.createDraft();
    assignments.value = calendarService.createAssignments();
    focusMonth.value = resolveFocusMonth(form.value.effectiveFrom, "2026-04");
    return;
  }

  form.value = buildDraftFromQuery();
  assignments.value = [];
  focusMonth.value = resolveFocusMonth(form.value.effectiveFrom, "2026-04");
  await loadCalendarDates(calendarCode.value);
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
  const nextType = selectedType.value;

  if (nextType === "CLEAR_DATE") {
    assignments.value = assignments.value.filter((item) => item.date !== date);
    return;
  }

  const naturalWeekend = isWeekend(date);

  assignments.value = assignments.value.filter((item) => item.date !== date);

  if (nextType === "WORKING_DAY" && !naturalWeekend) {
    return;
  }

  if (nextType === "WEEKEND" && naturalWeekend) {
    return;
  }

  assignments.value = [...assignments.value, createAssignment(date, nextType, assignmentLabel.value)].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
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
      .sort((a, b) => a.date.localeCompare(b.date));

    if (assignments.value.length > 0) {
      focusMonth.value = assignments.value[0].date.slice(0, 7);
    }
  } catch (e: any) {
    assignments.value = [];
    error.value = e?.response?.data?.message ?? "Unable to load calendar dates.";
  } finally {
    loadingDetails.value = false;
  }
}

async function saveCalendar() {
  error.value = "";
  message.value = "";

  if (isEditMode.value) {
    message.value = "Calendar dates are loaded in edit mode. An update API is not configured in this client yet.";
    return;
  }

  if (!compiledCalendarRequest.value.name) {
    error.value = "Calendar name is required.";
    return;
  }
  if (!compiledCalendarRequest.value.effectiveFrom || !compiledCalendarRequest.value.effectiveTo) {
    error.value = "Effective dates are required.";
    return;
  }
  if (!compiledCalendarRequest.value.region) {
    error.value = "Region is required.";
    return;
  }
  if (!compiledCalendarRequest.value.timeZone) {
    error.value = "Timezone is required.";
    return;
  }
  if (!compiledCalendarRequest.value.note) {
    error.value = "Notes are required.";
    return;
  }
  if (compiledCalendarRequest.value.dates.length === 0) {
    error.value = "Add at least one calendar date before saving.";
    return;
  }

  saving.value = true;

  try {
    const response = await calendarService.create(compiledCalendarRequest.value);
    if (response.status === 201) {
      await router.push(AppRoute.CALENDARS);
      return;
    }
    message.value = `Calendar saved with status ${response.status}.`;
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? "Create company calendar failed";
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
        explicit?.type ?? (isWeekend(date) ? "WEEKEND" : "WORKING_DAY"),
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
  const response = item as CompanyCalendarDateResponse;

  return createAssignment(date, type, queryString(firstDefined(item.note, item.label, response.note)));
}

function normalizeDayType(value: unknown): CalendarDayType {
  const token = queryString(value)
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (token === "HOLIDAY") return "HOLIDAY";
  if (token === "WEEKEND_WORK") return "WEEKEND_WORK";
  if (token === "COMPANY_DAY_OFF") return "COMPANY_DAY_OFF";
  if (token === "WEEKEND") return "WEEKEND";
  return "WORKING_DAY";
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
  if (!trimmed || trimmed === "-" || trimmed === "â€”") return "";
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
            Back to List
          </UiButton>
        </template>
      </CalendarPageHeader>

      <div
        v-if="isEditMode"
        class="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700"
      >
        Viewing calendar <span class="font-bold">{{ calendarCode }}</span> in edit layout. Dates are loaded from
        <span class="font-mono">/api/company-calendars/{{ calendarCode }}/dates</span>.
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
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white">Configuration</h2>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    {{ isEditMode ? "Metadata passed from the calendar list selection." : "Core metadata for the calendar template." }}
                  </p>
                </div>
              </div>

              <UiInput
                v-model="form.name"
                label="Calendar Name"
                placeholder="APAC Operations 2026"
                required
              />

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UiInput v-model="form.effectiveFrom" label="Effective From" type="date" required />
                <UiInput v-model="form.effectiveTo" label="Effective To" type="date" required />
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UiSelect v-model="form.region" label="Region" :options="calendarRegionOptions" />
                <UiSelect v-model="form.timezone" label="Timezone" :options="calendarTimezoneOptions" />
              </div>

              <UiTextarea
                v-model="form.description"
                label="Notes"
                :rows="4"
                placeholder="Describe the teams or rules covered by this calendar..."
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
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white">Date Assignment</h2>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    Pick a date type, then click a day in month view.
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
                label="Assignment Label"
                placeholder="Optional note for the next clicked date"
                :disabled="selectedType === 'CLEAR_DATE'"
                :hint="
                  selectedType === 'CLEAR_DATE'
                    ? 'Clear mode does not use labels. Click dates to remove overrides.'
                    : 'Used for holidays, day-offs, and special coverage labels.'
                "
              />
            </UiCardBody>
          </UiCard>

          <UiButton block leading-icon="save" :disabled="saving || loadingDetails" @click="saveCalendar">
            {{ saving ? "Saving..." : isEditMode ? "Update API Required" : "Save Calendar Template" }}
          </UiButton>

          <p v-if="isEditMode" class="text-xs text-slate-500 dark:text-slate-400">
            Editing is enabled locally. Persisting changes needs an update endpoint for company calendars.
          </p>
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
                      Click any visible date to apply the selected calendar action in month, quarter, or year view.
                    </p>
                  </div>
                  <UiButton variant="outline" icon-only @click="moveRange(1)">
                    <UiIcon name="chevron_right" size="20px" />
                  </UiButton>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UiButton :variant="viewMode === 'MONTH' ? 'primary' : 'outline'" @click="setViewMode('MONTH')">
                    Month
                  </UiButton>
                  <UiButton :variant="viewMode === 'QUARTER' ? 'primary' : 'outline'" @click="setViewMode('QUARTER')">
                    Quarter
                  </UiButton>
                  <UiButton :variant="viewMode === 'YEAR' ? 'primary' : 'outline'" @click="setViewMode('YEAR')">
                    Year
                  </UiButton>
                </div>
              </div>
            </div>

            <div class="p-4 md:p-6">
              <div v-if="loadingDetails" class="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-950/50">
                Loading calendar dates...
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
                    {{ visibleCounts.WORKING_DAY }} Work Days
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span class="size-3 rounded-full bg-emerald-500"></span>
                    {{ visibleCounts.HOLIDAY }} Holidays
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span class="size-3 rounded-full bg-slate-400"></span>
                    {{ visibleCounts.WEEKEND }} Weekends
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span class="size-3 rounded-full bg-amber-500"></span>
                    {{ visibleCounts.WEEKEND_WORK + visibleCounts.COMPANY_DAY_OFF }} Overrides
                  </div>
                </div>

                <UiButton variant="outline" leading-icon="download" @click="exportCsv">
                  Export to CSV
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
          <p class="font-bold">Selection Active</p>
          <p class="mt-1 text-slate-300">
            <template v-if="selectedType === 'CLEAR_DATE'">
              Clicking dates will remove explicit overrides and restore the default day type.
            </template>
            <template v-else>
              Clicking dates will assign <span class="text-blue-300">{{ currentSelection.label }}</span>
              <span v-if="assignmentLabel"> with "{{ assignmentLabel }}"</span>.
            </template>
          </p>
          <p v-if="selectedDateLabel" class="mt-1 text-slate-400">
            Selected date: {{ selectedDateLabel }}
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
