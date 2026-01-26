import { http } from './http'

export type LoginRequest = { email: string; password: string }

export const authService = {
  async login(req: LoginRequest) {
    const { data } = await http.post('/api/auth/login', req)
    return data
  },
}
