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

export type UpdateEmployeeRequest = Omit<CreateEmployeeRequest, 'gender'>

export type EmployeeListQuery = {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
}

export const employeeService = {
  async list(params?: EmployeeListQuery) {
    const { data } = await http.get('/api/v1/employees', { params })
    return data
  },

  async create(req: CreateEmployeeRequest) {
    const { data } = await http.post('/api/v1/employees', req)
    return data
  },

  async update(code: string, req: UpdateEmployeeRequest) {
    const { data } = await http.put(`/api/v1/employees/${encodeURIComponent(code)}`, req)
    return data
  },

  async remove(code: string) {
    await http.delete(`/api/v1/employees/${encodeURIComponent(code)}`)
  },
}
