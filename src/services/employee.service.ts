import { http } from './http'

export type CreateEmployeeRequest = {
  email: string
  firstName: string
  lastName: string
  departmentCode: string
  roleCode: string
  gender: string
  phone: string
}

export const employeeService = {
  async create(req: CreateEmployeeRequest) {
    const { data } = await http.post('/api/employees', req)
    return data
  },
}
