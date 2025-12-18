'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  // Bảo vệ lớp ngoài cùng: Không có Token thì đừng hòng nhìn thấy Sidebar
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar cố định bên trái */}
      <Sidebar />

      {/* Nội dung chính (đẩy sang phải 64 = 16rem = 256px cho bằng width sidebar) */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  )
}
