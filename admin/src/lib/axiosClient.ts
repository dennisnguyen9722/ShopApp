import axios from 'axios'

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  timeout: 10000, // 10 giây timeout
  headers: {
    'Content-Type': 'application/json'
  }
})

// ✅ Thêm interceptor để debug
axiosClient.interceptors.request.use(
  (config) => {
    console.log('📤 Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

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
