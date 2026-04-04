<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import CalendarPageHeader from "@/components/calendar/CalendarPageHeader.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardBody from "@/components/ui/UiCardBody.vue";
import UiDropdownMenu from "@/components/ui/UiDropdownMenu.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UiTable, { type UiTableHeader } from "@/components/ui/UiTable.vue";
import {
  calendarService,
  calendarTimezoneOptions,
} from "@/services/calendar.service";
import type {
  CalendarRecord,
  CompanyCalendarListResponse,
  CompanyCalendarPagedResponse,
} from "@/services/calendar.service";
import { AppRoute } from "@/types";

const router = useRouter();

const loading = ref(false);
const error = ref("");
const nameFilter = ref("");
const regionFilter = ref("");
const timeZoneFilter = ref("ALL");
const showFilters = ref(false);
const currentPage = ref(1);
const pageSize = 5;
const openActionCode = ref<string | null>(null);

const rows = ref<CalendarRecord[]>([]);
const totalElements = ref(0);
const totalPages = ref(1);

const headers: UiTableHeader[] = [
  { key: "code", label: "Code", thClass: "min-w-[120px]" },
  { key: "name", label: "Name", thClass: "min-w-[220px]" },
  { key: "effectiveFrom", label: "Effective From" },
  { key: "effectiveTo", label: "Effective To" },
  { key: "region", label: "Region", thClass: "min-w-[140px]" },
  { key: "timezone", label: "Time Zone", thClass: "min-w-[170px]" },
  { key: "createdBy", label: "Created By", thClass: "min-w-[180px]" },
  { key: "note", label: "Note", thClass: "min-w-[260px]" },
  { key: "actions", label: "Actions", align: "right" },
];

const timeZoneOptions = [
  { value: "ALL", label: "Time zone: All" },
  ...calendarTimezoneOptions.map((item) => ({
    value: item.value,
    label: item.label,
  })),
];

const visibleCount = computed(() => rows.value.length);
const hasActiveFilters = computed(
  () =>
    nameFilter.value.trim().length > 0 ||
    regionFilter.value.trim().length > 0 ||
    timeZoneFilter.value !== "ALL",
);
const openEndedCount = computed(() => rows.value.filter((row) => !row.effectiveTo).length);
const visibleRegions = computed(() => new Set(rows.value.map((row) => row.region).filter(Boolean)).size);
const timezoneCoverage = computed(() => Array.from(new Set(rows.value.map((row) => row.timezone).filter(Boolean))));

const pageButtons = computed(() => {
  const max = totalPages.value;
  const current = currentPage.value;
  const pages = new Set<number>([1, max, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((item) => item >= 1 && item <= max)
    .sort((a, b) => a - b);
});

async function loadCalendars() {
  loading.value = true;
  error.value = "";

  try {
    const response = (await calendarService.list({
      name: nameFilter.value.trim() || undefined,
      region: regionFilter.value.trim() || undefined,
      timeZone: timeZoneFilter.value === "ALL" ? undefined : timeZoneFilter.value,
      page: currentPage.value - 1,
      size: pageSize,
      sortBy: "effectiveFrom",
      sortDir: "DESC",
    })) as CompanyCalendarPagedResponse<CompanyCalendarListResponse>;

    const data = (response?.data ?? []) as CompanyCalendarListResponse[];
    rows.value = Array.isArray(data) ? data.map(normalizeCalendarRow) : [];
    totalElements.value = Number(response?.totalElements ?? rows.value.length ?? 0);
    totalPages.value = Math.max(
      1,
      Number(response?.totalPages ?? Math.ceil(totalElements.value / pageSize) ?? 1),
    );
  } catch (e: any) {
    rows.value = [];
    totalElements.value = 0;
    totalPages.value = 1;
    error.value = e?.response?.data?.message ?? "Unable to load calendars.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadCalendars);

function normalizeCalendarRow(item: CompanyCalendarListResponse, index: number): CalendarRecord {
  const code = String(item?.code ?? `CAL-${String(index + 1).padStart(3, "0")}`);
  const creator = String(item?.createdBy ?? "System");

  return {
    id: code,
    code,
    name: String(item?.name ?? ""),
    effectiveFrom: String(item?.effectiveFrom ?? ""),
    effectiveTo: item?.effectiveTo ? String(item.effectiveTo) : null,
    region: String(item?.region ?? "-"),
    timezone: String(item?.timeZone ?? "-"),
    note: item?.note ? String(item.note) : "—",
    createdBy: {
      name: creator,
      role: "",
    },
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("");
}

async function applyFilters() {
  currentPage.value = 1;
  await loadCalendars();
}

async function resetFilters() {
  nameFilter.value = "";
  regionFilter.value = "";
  timeZoneFilter.value = "ALL";
  currentPage.value = 1;
  showFilters.value = false;
  await loadCalendars();
}

function toggleFilters() {
  showFilters.value = !showFilters.value;
}

async function setPage(page: number) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return;
  currentPage.value = page;
  await loadCalendars();
}

function setCalendarActionMenu(code: string, open: boolean) {
  if (open) {
    openActionCode.value = code;
    return;
  }

  if (openActionCode.value === code) {
    openActionCode.value = null;
  }
}

function viewCalendar(row: CalendarRecord) {
  setCalendarActionMenu(row.code, false);
  router.push({
    path: AppRoute.CALENDAR_BUILDER,
    query: {
      code: row.code,
      mode: "edit",
      name: row.name,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo ?? "",
      region: row.region,
      timezone: row.timezone,
      note: row.note,
    },
  });
}
</script>

<template>
  <AppLayout>
    <div class="mx-auto max-w-[1600px] space-y-8">
      <CalendarPageHeader
        :eyebrow="['Organization', 'Management', 'Calendars']"
        title="Company Calendars"
      >
        <template #actions>
          <UiButton variant="outline" leading-icon="filter_list" @click="toggleFilters">
            Filter
          </UiButton>
          <UiButton leading-icon="add" @click="router.push(AppRoute.CALENDAR_BUILDER)">
            Create Calendar
          </UiButton>
        </template>
      </CalendarPageHeader>

      <UiCard v-if="showFilters || hasActiveFilters">
        <UiCardBody class="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div class="lg:col-span-5">
            <UiInput
              v-model="nameFilter"
              leading-icon="search"
              placeholder="Search calendar names..."
            />
          </div>
          <div class="lg:col-span-3">
            <UiInput
              v-model="regionFilter"
              leading-icon="public"
              placeholder="Filter by region..."
            />
          </div>
          <div class="lg:col-span-4">
            <UiSelect v-model="timeZoneFilter" :options="timeZoneOptions" />
          </div>

          <div class="flex items-center justify-end lg:col-span-12">
            <div class="flex flex-wrap gap-3">
              <UiButton variant="outline" @click="resetFilters">Reset</UiButton>
              <UiButton leading-icon="search" @click="applyFilters">Apply</UiButton>
            </div>
          </div>
        </UiCardBody>
      </UiCard>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <UiCard>
          <UiCardBody>
            <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Total Active
            </p>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-3xl font-black tracking-[-0.03em] text-slate-900 dark:text-white">
                {{ totalElements }}
              </span>
              <span class="text-xs font-bold text-emerald-600">
                {{ visibleRegions }} regions
              </span>
            </div>
          </UiCardBody>
        </UiCard>

        <UiCard>
          <UiCardBody>
            <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Open-ended
            </p>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-3xl font-black tracking-[-0.03em] text-slate-900 dark:text-white">
                {{ openEndedCount }}
              </span>
              <span class="text-xs font-bold text-amber-600">Visible now</span>
            </div>
          </UiCardBody>
        </UiCard>

        <UiCard class="md:col-span-2 border-primary/20 bg-primary/5">
          <UiCardBody class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                Time Zone Coverage
              </p>
              <p class="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-white">
                {{ timezoneCoverage.length }} active zones
              </p>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {{ timezoneCoverage.length ? timezoneCoverage.slice(0, 3).join(" • ") : "No calendars returned for the current filters." }}
              </p>
            </div>
            <div class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UiIcon name="public" size="28px" />
            </div>
          </UiCardBody>
        </UiCard>
      </div>

      <UiCard class="overflow-visible">
        <div class="p-0">
          <div v-if="error" class="px-4 py-4 text-sm text-amber-600 md:px-6">{{ error }}</div>
          <div v-if="loading" class="px-4 py-4 text-sm text-slate-500 md:px-6">Loading calendars...</div>

          <UiTable
            v-else
            :headers="headers"
            :rows="rows"
            row-key="id"
            row-class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            th-base-class="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400"
            td-base-class="px-6 py-4 text-sm"
            table-class="min-w-[1280px]"
            head-class="bg-slate-50/80 dark:bg-slate-800/60"
            head-row-class="border-b border-primary/10"
          >
            <template #cell-code="{ row }">
              <span class="font-mono text-xs font-bold text-primary">
                {{ row.code }}
              </span>
            </template>

            <template #cell-name="{ row }">
              <span class="font-medium text-slate-900 dark:text-white">{{ row.name }}</span>
            </template>

            <template #cell-effectiveFrom="{ row }">
              <span class="text-sm text-slate-500 dark:text-slate-300">
                {{ row.effectiveFrom }}
              </span>
            </template>

            <template #cell-effectiveTo="{ row }">
              <span
                :class="
                  row.effectiveTo
                    ? 'text-sm text-slate-500 dark:text-slate-300'
                    : 'italic text-slate-400 dark:text-slate-500'
                "
              >
                {{ row.effectiveTo ?? "—" }}
              </span>
            </template>

            <template #cell-region="{ row }">
              <span class="text-sm text-slate-900 dark:text-white">{{ row.region }}</span>
            </template>

            <template #cell-timezone="{ row }">
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ row.timezone }}</span>
            </template>

            <template #cell-createdBy="{ row }">
              <div class="flex items-center gap-2">
                <div class="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {{ initials(row.createdBy.name) }}
                </div>
                <span class="whitespace-nowrap text-xs font-semibold text-slate-900 dark:text-white">
                  {{ row.createdBy.name }}
                </span>
              </div>
            </template>

            <template #cell-note="{ row }">
              <span
                class="block max-w-[280px] truncate text-xs text-slate-500 dark:text-slate-400"
                :title="row.note"
              >
                {{ row.note }}
              </span>
            </template>

            <template #cell-actions="{ row }">
              <div class="flex justify-end">
                <UiDropdownMenu
                  :model-value="openActionCode === row.code"
                  panel-class="w-36"
                  @update:model-value="(open) => setCalendarActionMenu(row.code, open)"
                >
                  <template #trigger="{ toggle }">
                    <button
                      type="button"
                      class="rounded-lg p-1 text-slate-400 transition-colors hover:bg-primary/5 hover:text-primary"
                      @click.stop="toggle"
                    >
                      <UiIcon name="more_vert" size="18px" />
                    </button>
                  </template>

                  <template #default="{ close }">
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-primary/10 hover:text-primary dark:text-slate-200 dark:hover:bg-slate-900"
                      @click.stop="
                        close();
                        viewCalendar(row);
                      "
                    >
                      <UiIcon name="visibility" size="18px" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      disabled
                      class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 dark:text-slate-600"
                      title="Delete endpoint is not configured"
                    >
                      <UiIcon name="delete" size="18px" />
                      <span>Delete</span>
                    </button>
                  </template>
                </UiDropdownMenu>
              </div>
            </template>

            <template #empty>
              <div class="py-10 text-sm text-slate-500">No calendars found.</div>
            </template>
          </UiTable>
        </div>

        <div class="border-t border-primary/10 px-4 py-4 md:px-6">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
              Showing {{ visibleCount }} of {{ totalElements }} calendars
            </p>

            <div class="flex items-center gap-2">
              <UiButton variant="outline" icon-only :disabled="currentPage <= 1" @click="setPage(currentPage - 1)">
                <UiIcon name="chevron_left" size="20px" />
              </UiButton>

              <UiButton
                v-for="page in pageButtons"
                :key="page"
                :variant="page === currentPage ? 'primary' : 'outline'"
                @click="setPage(page)"
              >
                {{ page }}
              </UiButton>

              <UiButton variant="outline" icon-only :disabled="currentPage >= totalPages" @click="setPage(currentPage + 1)">
                <UiIcon name="chevron_right" size="20px" />
              </UiButton>
            </div>
          </div>
        </div>
      </UiCard>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <UiCard class="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 lg:col-span-2">
          <div class="relative p-6 md:p-8">
            <div class="relative z-10 max-w-xl">
              <h2 class="text-2xl font-bold tracking-[-0.03em] text-white">
                Automate Recurring Holidays
              </h2>
              <p class="mt-3 text-sm text-slate-300">
                Sync region-specific holidays into operational calendars so staffing plans and delivery timelines stay aligned.
              </p>
              <button
                type="button"
                class="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                <UiIcon name="sync" size="18px" />
                Configure Sync
              </button>
            </div>

            <div class="absolute -bottom-10 -right-8 text-white/10">
              <UiIcon name="auto_awesome" size="180px" />
            </div>
          </div>
        </UiCard>

        <UiCard>
          <UiCardBody class="flex h-full flex-col justify-center text-center">
            <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UiIcon name="history" size="22px" />
            </div>
            <h3 class="mt-4 text-lg font-bold text-slate-900 dark:text-white">Audit Logs</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
              View recent modifications to company calendar policies.
            </p>
            <button type="button" class="mt-5 text-sm font-semibold text-primary hover:underline">
              View History
            </button>
          </UiCardBody>
        </UiCard>
      </div>
    </div>
  </AppLayout>
</template>
