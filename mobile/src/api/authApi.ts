// mobile/src/api/authApi.ts
import axiosClient from './axiosClient'

export const authApi = {
  login: (email: string, password: string) => {
    // Gọi vào đường dẫn /auth/login (sẽ ghép với baseURL thành .../api/auth/login)
    return axiosClient.post('/auth/login', { email, password })
  },

  getProfile: () => {
    return axiosClient.get('/auth/me')
  }
}
