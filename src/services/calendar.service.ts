import { http } from "./http";

export type CalendarDayType =
  | "NORMAL"
  | "WEEKEND"
  | "HOLIDAY"
  | "WEEKEND_WORK"
  | "COMPANY_DAY_OFF";
export type CalendarViewMode = "MONTH" | "QUARTER" | "YEAR";

export interface CalendarOwner {
  name: string;
  role: string;
}

export interface CalendarRecord {
  id: string;
  code: string;
  name: string;
  region: string;
  timezone: string;
  note: string;
  createdBy: CalendarOwner;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface CalendarAssignment {
  date: string;
  type: CalendarDayType;
  label?: string;
}

export interface ResolvedCalendarDay {
  type: CalendarDayType | null;
  label: string;
  explicit: boolean;
}

export interface CalendarDraft {
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  region: string;
  timezone: string;
  description: string;
}

export interface CalendarTypeOption {
  value: CalendarDayType;
  label: string;
  description: string;
  icon: string;
  dotClass: string;
}

export type CompanyCalendarListQuery = {
  name?: string;
  region?: string;
  timeZone?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
};

export type CompanyCalendarListResponse = {
  code?: string;
  name?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  region?: string;
  timeZone?: string;
  note?: string;
  createdBy?: string;
};

export type CompanyCalendarDateRequest = {
  calDate: string;
  dayType: CalendarDayType;
  note: string;
};

export type CompanyCalendarRequest = {
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  dates: CompanyCalendarDateRequest[];
  region: string;
  timeZone: string;
  note: string;
};

export type CompanyCalendarDateResponse = {
  calDate?: string;
  dayType?: CalendarDayType;
  note?: string;
};

export type CompanyCalendarResponse = {
  code?: string;
  name?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  region?: string;
  timeZone?: string;
  note?: string;
  dates?: CompanyCalendarDateResponse[];
};

export type CompanyCalendarPagedResponse<T> = {
  data?: T[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
  message?: string;
  success?: boolean;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const shortMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

const displayDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const draftSeed: CalendarDraft = {
  name: "APAC Operations 2026",
  effectiveFrom: "2026-01-01",
  effectiveTo: "2026-12-31",
  region: "THAILAND",
  timezone: "Asia/Bangkok",
  description:
    "Regional operating calendar for warehouse, support, and finance teams. Use date assignments to mark holidays, shutdowns, and weekend coverage.",
};

const assignmentSeed: CalendarAssignment[] = [];

export const calendarTypeOptions: CalendarTypeOption[] = [
  {
    value: "NORMAL",
    label: "Working date",
    description: "Standard operation hours",
    icon: "check_circle",
    dotClass: "bg-primary",
  },
  {
    value: "WEEKEND",
    label: "Weekend",
    description: "Non-working days",
    icon: "event_busy",
    dotClass: "bg-slate-400",
  },
  {
    value: "HOLIDAY",
    label: "Holiday",
    description: "Public or regional holiday",
    icon: "celebration",
    dotClass: "bg-emerald-500",
  },
  {
    value: "WEEKEND_WORK",
    label: "Weekend work",
    description: "Overtime or special shift coverage",
    icon: "bolt",
    dotClass: "bg-amber-500",
  },
  {
    value: "COMPANY_DAY_OFF",
    label: "Company day-off",
    description: "Closed for operations",
    icon: "block",
    dotClass: "bg-rose-500",
  },
];

export const calendarRegionOptions = [
  { value: "THAILAND", label: "Thailand" },
  { value: "VIETNAM", label: "Vietnam" },
  { value: "SINGAPORE", label: "Singapore" },
  { value: "GLOBAL", label: "Global" },
];

export const calendarTimezoneOptions = [
  { value: "Asia/Bangkok", label: "UTC+07:00 Asia/Bangkok" },
  { value: "Asia/Ho_Chi_Minh", label: "UTC+07:00 Asia/Ho_Chi_Minh" },
  { value: "Asia/Singapore", label: "UTC+08:00 Asia/Singapore" },
  { value: "UTC", label: "UTC" },
];

export const calendarService = {
  async list(params?: CompanyCalendarListQuery) {
    const { data } = await http.get<CompanyCalendarPagedResponse<CompanyCalendarListResponse> | any>(
      "/api/company-calendars",
      { params },
    );
    return data;
  },
  async listDates(code: string) {
    const { data } = await http.get<CompanyCalendarDateResponse[] | any>(
      `/api/company-calendars/${encodeURIComponent(code)}/dates`,
    );
    return data;
  },
  async create(req: CompanyCalendarRequest) {
    const response = await http.post<CompanyCalendarResponse>("/api/company-calendars", req);
    return {
      status: response.status,
      data: response.data,
    };
  },
  async update(code: string, req: CompanyCalendarRequest) {
    const response = await http.put<CompanyCalendarResponse>(
      `/api/company-calendars/${encodeURIComponent(code)}`,
      req,
    );
    return {
      status: response.status,
      data: response.data,
    };
  },
  createDraft() {
    return { ...draftSeed };
  },
  createAssignments() {
    return assignmentSeed.map((item) => ({ ...item }));
  },
};

export function createAssignmentMap(assignments: CalendarAssignment[]) {
  return new Map(assignments.map((item) => [item.date, item] as const));
}

export function resolveCalendarDay(
  date: string,
  assignmentMap: Map<string, CalendarAssignment>,
): ResolvedCalendarDay {
  const assigned = assignmentMap.get(date);
  if (assigned) {
    return {
      type: assigned.type,
      label: assigned.label ?? defaultCalendarDateNote(assigned.type),
      explicit: true,
    };
  }

  return {
    type: null,
    label: "",
    explicit: false,
  };
}

export function summarizeMonths(
  months: string[],
  assignmentMap: Map<string, CalendarAssignment>,
) {
  const totals: Record<CalendarDayType, number> = {
    NORMAL: 0,
    WEEKEND: 0,
    HOLIDAY: 0,
    WEEKEND_WORK: 0,
    COMPANY_DAY_OFF: 0,
  };

  for (const month of months) {
    for (const date of getMonthDateKeys(month)) {
      const type = resolveCalendarDay(date, assignmentMap).type;
      if (type) totals[type] += 1;
    }
  }

  return totals;
}

export function createAssignment(
  date: string,
  type: CalendarDayType,
  label?: string,
): CalendarAssignment {
  const trimmed = label?.trim();
  const next: CalendarAssignment = { date, type };
  const defaultLabel = defaultCalendarDateNote(type);

  if (trimmed) next.label = trimmed;
  else if (defaultLabel) next.label = defaultLabel;

  return next;
}

export function addMonths(month: string, delta: number) {
  const parsed = parseMonthKey(month);
  parsed.setMonth(parsed.getMonth() + delta);
  return formatMonthKey(parsed);
}

export function getMonthsForView(month: string, viewMode: CalendarViewMode) {
  const base = parseMonthKey(month);
  const year = base.getFullYear();
  const monthIndex = base.getMonth();

  if (viewMode === "MONTH") return [formatMonthKey(base)];

  if (viewMode === "QUARTER") {
    const quarterStart = Math.floor(monthIndex / 3) * 3;
    return Array.from({ length: 3 }, (_, index) =>
      formatMonthKey(new Date(year, quarterStart + index, 1)),
    );
  }

  return Array.from({ length: 12 }, (_, index) =>
    formatMonthKey(new Date(year, index, 1)),
  );
}

export function getMonthDateKeys(month: string) {
  const parsed = parseMonthKey(month);
  const year = parsed.getFullYear();
  const monthIndex = parsed.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) =>
    toDateKey(new Date(year, monthIndex, index + 1)),
  );
}

export function formatMonthLabel(month: string, short = false) {
  return (short ? shortMonthFormatter : monthFormatter).format(parseMonthKey(month));
}

export function formatDisplayDate(date: string) {
  return displayDateFormatter.format(parseDateKey(date));
}

export function isWeekend(date: string) {
  const day = parseDateKey(date).getDay();
  return day === 0 || day === 6;
}

export function parseDateKey(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function parseMonthKey(month: string) {
  const [year, monthValue] = month.split("-").map(Number);
  return new Date(year, monthValue - 1, 1);
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function defaultCalendarDateNote(type: CalendarDayType): string {
  if (type === "NORMAL") return "Working day";
  if (type === "HOLIDAY") return "Holiday";
  if (type === "WEEKEND_WORK") return "Weekend work";
  if (type === "COMPANY_DAY_OFF") return "Company day-off";
  if (type === "WEEKEND") return "Weekend";
  return "Working day";
}
