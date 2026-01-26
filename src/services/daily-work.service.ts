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

export const dailyWorkService = {
  async createMany(req: EmployeeDailyWorkRequest[]) {
    const { data } = await http.post('/api/employee-daily-works', req)
    return data
  },
}
