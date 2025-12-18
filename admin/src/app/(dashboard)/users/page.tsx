/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Plus,
  Trash2,
  Shield,
  Loader2,
  User as UserIcon,
  Search
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// --- TYPES ---
interface Role {
  _id: string
  name: string
  slug: string
}

interface User {
  _id: string
  name: string
  email: string
  role: Role // Role bây giờ là Object (đã populate)
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([]) // ✨ State lưu danh sách Role để chọn
  const [loading, setLoading] = useState(false)

  // State Form
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '' // Sẽ lưu _id của Role
  })

  // 1. FETCH DATA (Users & Roles)
  const fetchData = async () => {
    setLoading(true)
    try {
      // Gọi song song cả 2 API
      const [resUsers, resRoles] = await Promise.all([
        axiosClient.get('/users'),
        axiosClient.get('/roles')
      ])
      setUsers(resUsers.data || [])
      setRoles(resRoles.data || [])
    } catch (error: any) {
      console.error('Lỗi tải dữ liệu:', error)
      if (error.response?.status === 403) {
        toast.warning('Bạn không có quyền truy cập trang này!')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 2. TẠO USER MỚI
  const handleCreateUser = async () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.role ||
      !formData.name
    ) {
      toast.warning('Vui lòng nhập đầy đủ thông tin!')
      return
    }

    setIsSubmitting(true)
    try {
      await axiosClient.post('/users', formData)
      setIsDialogOpen(false)
      // Reset form
      setFormData({ name: '', email: '', password: '', role: '' })
      fetchData() // Reload list
      toast.success('Tạo nhân viên thành công!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. XÓA USER
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return
    try {
      await axiosClient.delete(`/users/${id}`)
      toast.success('Đã xóa nhân viên')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa!')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-none bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <Shield className="w-6 h-6 text-indigo-600" /> Quản Lý Nhân Viên
            </CardTitle>
            <CardDescription>
              Cấp tài khoản và phân quyền truy cập hệ thống.
            </CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Thêm Nhân Viên
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tạo tài khoản mới</DialogTitle>
                <DialogDescription>
                  Thông tin đăng nhập sẽ được dùng để truy cập Admin Portal.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Họ và Tên</Label>
                  <Input
                    placeholder="VD: Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email đăng nhập</Label>
                  <Input
                    type="email"
                    placeholder="staff@supermall.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Mật khẩu</Label>
                  <Input
                    type="text"
                    placeholder="Nhập mật khẩu..."
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>

                {/* ✨ ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT: SELECT ROLE ĐỘNG */}
                <div className="grid gap-2">
                  <Label>Phân quyền (Role)</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(val) =>
                      setFormData({ ...formData, role: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Loop qua danh sách roles lấy từ API */}
                      {roles.map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Tạo tài khoản'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Thông tin nhân viên</TableHead>
                  <TableHead>Vai trò (Role)</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-center w-[100px]">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {user.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* Hiển thị đúng tên Role từ Object */}
                        <Badge
                          variant="outline"
                          className={`
                            ${
                              user.role?.slug === 'admin'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-gray-100 text-gray-700'
                            }
                        `}
                        >
                          {user.role?.name || 'Chưa cấp quyền'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={user.role?.slug === 'admin'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
