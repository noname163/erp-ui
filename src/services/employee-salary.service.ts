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
}
