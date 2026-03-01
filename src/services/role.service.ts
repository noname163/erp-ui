import { http } from './http'

export type SelectionOptionResponse = {
  code: string
  name: string
}

export const roleService = {
  async options(params?: { name?: string }) {
    const { data } = await http.get<SelectionOptionResponse[]>('/api/roles/options', { params })
    return data
  },
}
