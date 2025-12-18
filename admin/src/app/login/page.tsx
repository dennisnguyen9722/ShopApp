/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ShoppingBag } from 'lucide-react'
import axiosClient from '@/lib/axiosClient' // Import axios đã cấu hình

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('') // Thêm biến hiển thị lỗi
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('') // Reset lỗi cũ

    try {
      // 1. Gọi API Login thật
      const { data } = await axiosClient.post('/auth/login', {
        email: formData.email,
        password: formData.password
      })

      // 2. Nếu thành công -> Lưu Token vào LocalStorage
      // (Để sau này các trang khác biết là đã đăng nhập)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // 3. Chuyển hướng về trang chủ
      router.push('/')
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err)
      // Hiển thị thông báo lỗi từ Server gửi về (nếu có)
      setError(
        err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-screen overflow-hidden lg:grid lg:grid-cols-2">
      {/* CỘT TRÁI: ẢNH DECOR */}
      <div className="hidden relative h-full w-full bg-zinc-900 lg:flex flex-col justify-between p-10 text-white">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920"
          alt="Login Background"
          className="absolute inset-0 h-full w-full object-cover opacity-50 z-0"
        />
        <div className="relative z-10 flex items-center text-lg font-medium">
          <ShoppingBag className="mr-2 h-6 w-6" />
          SuperMall Admin
        </div>
        <div className="relative z-10">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Hệ thống quản lý bán hàng chuyên nghiệp, giúp bạn kiểm soát
              kho, đơn hàng và doanh thu hiệu quả.&rdquo;
            </p>
            <footer className="text-sm opacity-80">
              Designed by Developer
            </footer>
          </blockquote>
        </div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG NHẬP */}
      <div className="flex items-center justify-center h-full bg-white p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Đăng nhập hệ thống
            </h1>
            <p className="text-sm text-muted-foreground text-gray-500">
              Nhập email và mật khẩu admin để tiếp tục
            </p>
          </div>

          {/* HIỂN THỊ LỖI NẾU CÓ */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@supermall.com"
                required
                className="h-11"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <a
                  href="#"
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-11"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <Button
              disabled={loading}
              className="h-11 bg-black hover:bg-zinc-800 text-white font-semibold"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đăng nhập ngay
            </Button>
          </form>

          <p className="px-8 text-center text-sm text-muted-foreground text-gray-500">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Điều khoản dịch vụ
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
