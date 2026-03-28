<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
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
  CompanyCalendarRequest,
  CalendarViewMode,
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

const form = ref(calendarService.createDraft());
const assignments = ref<CalendarAssignment[]>(calendarService.createAssignments());
const focusMonth = ref("2026-04");
const selectedType = ref<CalendarEditorSelection>("WORKING_DAY");
const assignmentLabel = ref("");
const selectedDate = ref<string | null>(null);
const viewMode = ref<CalendarViewMode>("MONTH");
const loading = ref(false);
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

async function saveCalendar() {
  error.value = "";
  message.value = "";

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

  loading.value = true;

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
    loading.value = false;
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
</script>

<template>
  <AppLayout>
    <div class="space-y-8">
      <CalendarPageHeader
        :eyebrow="['Organization', 'Calendars', 'New Calendar']"
        title="Create Calendar"
        description="Define operating periods and assign exceptions for holidays, shutdowns, and weekend coverage."
      >
        <template #actions>
          <UiButton variant="outline" leading-icon="arrow_back" @click="router.push(AppRoute.CALENDARS)">
            Back to List
          </UiButton>
        </template>
      </CalendarPageHeader>

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
                    Core metadata for the calendar template.
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

          <UiButton block leading-icon="save" :disabled="loading" @click="saveCalendar">
            {{ loading ? "Saving..." : "Save Calendar Template" }}
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
              <CalendarMonthGrid
                v-if="viewMode === 'MONTH'"
                :month="visibleMonths[0]"
                :assignments="assignments"
                :selected-date="selectedDate"
                interactive
                @select-day="applyDaySelection"
              />

              <div v-else-if="viewMode === 'QUARTER'" class="grid grid-cols-1 gap-4 xl:grid-cols-3">
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

              <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
