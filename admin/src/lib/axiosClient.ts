import axios from 'axios'

// 🧩 Tự động chọn API URL theo môi trường
const baseURL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5001/api' // ✅ chạy local (backend port 5001)
    : process.env.NEXT_PUBLIC_API_URL ||
      'https://supermall-api.onrender.com/api' // ✅ production (Render)

console.log('🔗 API baseURL:', baseURL)

const axiosClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ✅ Request interceptor – tự động gắn token vào header
axiosClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    console.log('📤 Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// ✅ Response interceptor – log phản hồi & xử lý lỗi mạng
axiosClient.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error(
        '🔴 Network Error: Không thể kết nối backend tại',
        error.config?.baseURL
      )
    }
    console.error('❌ Response Error:', error.message)
    return Promise.reject(error)
  }
)

export default axiosClient
