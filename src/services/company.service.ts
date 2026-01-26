import { http } from './http'
import type { Company, Paged } from '@/types'

export type CompanyCreateRequest = {
  email: string
  name: string
  industry: string
  taxNumber: string
  address: string
  phoneNumber: string
}

export const companyService = {
  async list(params?: { searchKey?: string; searchValue?: string; page?: number; size?: number; sortBy?: string; sortDir?: 'ASC'|'DESC' }) {
    const { data } = await http.get<Paged<Company> | any>('/api/companies', { params })
    return data
  },
  async create(req: CompanyCreateRequest) {
    const { data } = await http.post('/api/companies', req)
    return data
  },
}
