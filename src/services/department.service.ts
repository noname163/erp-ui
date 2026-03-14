import { http } from './http'
import type { Department, Paged } from '@/types'

export type DepartmentCreateRequest = { name: string; description?: string }
export type SelectionOptionResponse = { code: string; name: string }

export const departmentService = {
  async list(params?: { searchKey?: string; searchValue?: string; page?: number; size?: number; sortBy?: string; sortDir?: 'ASC'|'DESC' }) {
    const { data } = await http.get<Paged<Department> | any>('/api/departments', { params })
    return data
  },
  async options(params?: { name?: string }) {
    const { data } = await http.get<SelectionOptionResponse[]>('/api/departments/options', { params })
    return data
  },
  async create(req: DepartmentCreateRequest) {
    const { data } = await http.post('/api/departments', req)
    return data
  },
}
