import { http } from './http'

export type DailyWorkUnit = 'HOUR' | 'DAY' | 'PRODUCT'
export type WorkType = 'NORMAL' | 'HOLIDAY_WORK' | 'WEEKEND_WORK' | 'PTO_PAID' | 'PTO_UNPAID' | 'UNPAID_LEAVE'

export type EmployeeDailyWorkRequest = {
  userProfileCode: string
  workingDate: string
  startTime: string
  endTime: string
  quantity: number
  unit: DailyWorkUnit
  workType: WorkType
  usedPto?: boolean
  otTime?: number
}

export type EmployeeDailyWorkListQuery = {
  employeeCode?: string;
  startDate?: string;
  endDate?: string;
  usedPto?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
};

export type EmployeeDailyWorkListResponse = {
  id?: string | number;
  code?: string;
  userProfileCode?: string;
  employeeName?: string;
  fullName?: string;
  workType?: WorkType;
  departmentName?: string;
  department?: string;
  logDay?: string;
  startTime?: string;
  endTime?: string;
  otTime?: number | string;
  usedPto?: boolean;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  editedBy?: string;
  editedByName?: string;
  avatarUrl?: string;
  avatar?: string;
};

export type EmployeeDailyWorkPagedResponse<T> = {
  content?: T[]
  data?: T[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  last?: boolean
  message?: string
  success?: boolean
}

export const dailyWorkService = {
  async createMany(req: EmployeeDailyWorkRequest[]) {
    const { data } = await http.post('/api/employee-daily-works', req)
    return data
  },
  async list(query: EmployeeDailyWorkListQuery = {}) {
    const { data } = await http.get<EmployeeDailyWorkPagedResponse<EmployeeDailyWorkListResponse>>(
      '/api/employee-daily-works',
      { params: query },
    )
    return data
  },
}
