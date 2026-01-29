import { http } from './http'

export type LoginRequest = { email: string; password: string }
export type ResetPasswordRequest = {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export const authService = {
  async login(req: LoginRequest) {
    const { data } = await http.post('/api/auth/login', req)
    return data
  },

  async resetPassword(req: ResetPasswordRequest) {
    const { data } = await http.post('/api/auth/reset-password', req)
    return data
  },
}
