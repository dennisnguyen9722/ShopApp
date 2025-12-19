// mobile/src/api/axiosClient.ts
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// 👇 Link server Render (Đã thêm /api ở cuối để không bị lỗi 404)
const BASE_URL = 'https://supermall-api.onrender.com/api'

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor: Tự động gắn Token vào mỗi request (nếu đã đăng nhập)
axiosClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default axiosClient
