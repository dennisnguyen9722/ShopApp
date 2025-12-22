'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
// 👇 Import Header bạn mới tạo (Kiểm tra lại đường dẫn file Header nhé)
import Header from '@/components/Header'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  // Bảo vệ lớp ngoài cùng
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Sidebar cố định bên trái */}
      <Sidebar />

      {/* 2. Wrapper cho phần bên phải (Đẩy sang phải 64 để tránh Sidebar) 
         Thay vì thẻ main, ta dùng div bao ngoài để chứa cả Header và Main
      */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* 🔥 GẮN HEADER VÀO ĐÂY */}
        <Header />

        {/* Nội dung chính (Page content) */}
        <main className="p-8 flex-1 bg-[#F5F5F9]">{children}</main>
      </div>
    </div>
  )
}
