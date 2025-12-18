'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react'
import { useRouter } from 'next/navigation'
import axiosClient from '@/lib/axiosClient'
import { toast } from 'sonner'

// 1. Định nghĩa kiểu dữ liệu cho User và Role
// Khớp với những gì Backend trả về lúc Login
export interface Role {
  _id: string
  name: string
  slug: string
  permissions: string[]
}

export interface User {
  _id: string
  name: string
  email: string
  role: Role | string // Có thể là object (mới) hoặc string (cũ)
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (token: string, userData: User) => void
  logout: () => void
  loading: boolean
}

// 2. Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 3. Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUserLoggedIn()
  }, [])

  const checkUserLoggedIn = async () => {
    try {
      // Lấy token từ localStorage
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null

      if (!token) {
        setLoading(false)
        // Nếu đang ở trang dashboard mà ko có token thì đá về login
        if (window.location.pathname !== '/login') {
          router.push('/login')
        }
        return
      }

      // Gọi API /me để lấy thông tin user mới nhất (đã populate role)
      // Giúp đồng bộ role nếu admin có sửa quyền
      const { data } = await axiosClient.get('/auth/me')
      setUser(data)
    } catch (error) {
      console.error('Lỗi check user:', error)
      logout() // Token lỗi hoặc hết hạn thì logout luôn
    } finally {
      setLoading(false)
    }
  }

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token)
    setUser(userData)
    router.push('/')
    toast.success('Đăng nhập thành công')
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
    toast.info('Đã đăng xuất')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// 4. Hook để dùng Context dễ dàng
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
