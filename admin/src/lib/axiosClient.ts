import axios from 'axios'

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ✅ SỬA ĐOẠN NÀY: Thêm logic lấy Token gắn vào Header
axiosClient.interceptors.request.use(
  (config) => {
    // 1. Lấy token từ LocalStorage (nếu đang chạy ở trình duyệt)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')

      // 2. Nếu có token thì kẹp vào Header "Authorization"
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

// Đoạn Response bên dưới giữ nguyên
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
