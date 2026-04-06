import { http } from './http'

export type UserProfileOptionResponse = {
  code: string
  name: string
}

export type UserProfileOptionParams = {
  firstName?: string
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
}

export const userProfileService = {
  async options(params?: UserProfileOptionParams) {
    const { data } = await http.get<UserProfileOptionResponse[] | any>('/api/v1/user-profiles/options', { params })
    return data
  },
}
