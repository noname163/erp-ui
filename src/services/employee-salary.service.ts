import { http } from './http'

export type EmployeeSalaryRequest = {
  userProfileCode: string
  effectiveFrom: string
  effectiveTo: string
  totalAmount: string
  currency: string
}

export type EmployeeSalaryDetailRequest = {
  salaryCode: string
  employeeSalaryCode: string
  amount: string
}

export const employeeSalaryService = {
  async createMaster(req: EmployeeSalaryRequest) {
    const { data } = await http.post('/api/employee-salaries', req)
    return data
  },
  async createDetails(req: EmployeeSalaryDetailRequest[]) {
    const { data } = await http.post('/api/employee-salary-details', req)
    return data
  },
}
