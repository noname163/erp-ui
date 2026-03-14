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

export type EmployeeListQuery = {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
}

export const employeeService = {
  async list(params?: EmployeeListQuery) {
    const { data } = await http.get('/api/employees', { params })
    return data
  },

  async create(req: CreateEmployeeRequest) {
    const { data } = await http.post('/api/employees', req)
    return data
  },
}
