import { http } from './http'

export type EmployeeSalaryRequest = {
  userProfileCode: string
  effectiveFrom: string
  effectiveTo: string
  totalAmount: string
  currency: string
}

export type EmployeeSalaryDetailCreateRequest = {
  salaryCode: string
  employeeSalaryCode: string
  amount: string
}

export type EmployeeSalarySlipRequest = EmployeeSalaryRequest & {
  salaryDetails: EmployeeSalarySlipDetailRequest[]
}

export type EmployeeSalarySlipDetailRequest = {
  salaryCode: string
  amount: string
  dependencyCode?: string
}

export type EmployeeSalaryListQuery = {
  employeeName?: string
  minAmount?: string
  maxAmount?: string
  effectiveFrom?: string
  effectiveTo?: string
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
}

export type EmployeeSalaryListResponse = {
  salaryCode: string
  employeeName: string
  effectiveFrom: string
  effectiveTo?: string | null
  totalAmount: string
  currency: string
}

export type EmployeeSalaryPagedResponse<T> = {
  data?: T[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  last?: boolean
  message?: string
  success?: boolean
}

export const employeeSalaryService = {
  async createMaster(req: EmployeeSalaryRequest) {
    const { data } = await http.post('/api/employee-salaries', req)
    return data
  },
  async createSlip(req: EmployeeSalarySlipRequest) {
    const { data } = await http.post('/api/employee-salaries', req)
    return data
  },
  async createDetails(req: EmployeeSalaryDetailCreateRequest[]) {
    const { data } = await http.post('/api/employee-salary-details', req)
    return data
  },
  async list(query: EmployeeSalaryListQuery = {}) {
    const { data } = await http.get<EmployeeSalaryPagedResponse<EmployeeSalaryListResponse>>('/api/employee-salaries', {
      params: query,
    })
    return data
  },
}
