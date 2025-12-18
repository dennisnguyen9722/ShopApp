/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useState } from 'react'
import { User, Mail, Shield, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Cài đặt tài khoản</h3>
        <p className="text-sm text-muted-foreground text-gray-500">
          Quản lý thông tin cá nhân và tùy chọn hệ thống.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin của tôi</CardTitle>
          <CardDescription>
            Thông tin cơ bản về tài khoản đang đăng nhập.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Email</Label>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <Input value={user.email} disabled className="bg-gray-50" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Vai trò (Role)</Label>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <Input
                value={user.role?.toUpperCase()}
                disabled
                className="bg-gray-50 font-bold text-indigo-600"
              />
            </div>
            <p className="text-xs text-gray-500">
              * Vai trò quyết định các chức năng bạn có thể truy cập trong hệ
              thống.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Đăng xuất khỏi thiết bị này
        </Button>
      </div>
    </div>
  )
}
