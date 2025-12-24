'use client'

import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default function ProfilePage() {
  const { user } = useAuth()

  // Hàm helper để lấy tên Role an toàn (Chuẩn TypeScript không dùng any)
  const getRoleName = () => {
    if (!user?.role) return 'Thành viên'

    // Kiểm tra nếu role là object (đã populate) và khác null
    if (typeof user.role === 'object' && user.role !== null) {
      // ✅ FIX: Ép kiểu về object có thuộc tính name thay vì dùng 'any'
      return (user.role as { name: string }).name || 'Thành viên'
    }

    // Nếu là string thì trả về luôn
    return String(user.role)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <h1 className="text-3xl font-bold text-slate-800">Hồ sơ cá nhân</h1>

      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-8 items-start p-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32 border-4 border-white shadow-md">
              <AvatarImage src={user?.avatar} className="object-cover" />
              <AvatarFallback className="text-4xl bg-indigo-100 text-indigo-600 font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Badge className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1 text-sm">
              {getRoleName()}
            </Badge>
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-5 w-full">
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Họ và tên
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900">
                {user?.name || 'Chưa cập nhật'}
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Email đăng nhập
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900">
                {user?.email}
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Mã định danh (ID)
              </label>
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg font-mono text-sm text-slate-500 select-all">
                {user?._id}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
