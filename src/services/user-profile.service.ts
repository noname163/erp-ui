import { http } from './http'

export type UserProfileOptionResponse = {
  code: string
  name: string
}

export const userProfileService = {
  async options(params?: { name?: string }) {
    const { data } = await http.get<UserProfileOptionResponse[] | any>('/api/v1/user-profiles/options', { params })
    return data
  },
}
