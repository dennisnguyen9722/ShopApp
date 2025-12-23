/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Plus,
  Trash2,
  Shield,
  Loader2,
  Search,
  Mail,
  Calendar,
  Lock,
  UserCog
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  role: Role
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)

  // Pagination & Search State
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('') // Debounce

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  })

  // 1. FETCH DATA
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const [resUsers, resRoles] = await Promise.all([
        axiosClient.get('/users', {
          params: { page, limit, search: searchTerm }
        }),
        axiosClient.get('/roles')
      ])

      // Xử lý Users
      const data = resUsers.data
      if (data.users) {
        // Trường hợp Backend MỚI (có phân trang)
        setUsers(data.users)
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalDocs(data.pagination?.total || 0)
      } else {
        // Trường hợp Backend CŨ (trả về mảng)
        const list = Array.isArray(data) ? data : []
        setUsers(list)
        setTotalDocs(list.length) // 👈 THÊM DÒNG NÀY ĐỂ CẬP NHẬT SỐ LƯỢNG
      }

      setRoles(resRoles.data || [])
    } catch (error: any) {
      console.error('Lỗi:', error)
      if (error.response?.status === 403) {
        toast.warning('Bạn không có quyền truy cập module này!')
      }
    } finally {
      setLoading(false)
    }
  }

  // Effect: Load data
  useEffect(() => {
    fetchUsers()
  }, [page, limit, searchTerm])

  // Effect: Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSearchTerm(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // 2. CREATE USER
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
      setFormData({ name: '', email: '', password: '', role: '' }) // Reset form
      toast.success('Tạo nhân viên thành công!')
      fetchUsers() // Reload
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. DELETE USER
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Hành động này không thể hoàn tác. Bạn chắc chứ?')) return
    try {
      await axiosClient.delete(`/users/${id}`)
      toast.success('Đã xóa nhân viên')
      fetchUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa!')
    }
  }

  // Helper chuyển trang mượt mà
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // window.scrollTo({ top: 0, behavior: 'smooth' }) // Bật nếu muốn tự cuộn lên đầu
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* HEADER SECTION */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 p-6 sm:p-8 border border-indigo-100/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Quản Lý Nhân Viên
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      {totalDocs} tài khoản · Phân quyền truy cập hệ thống
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION & SEARCH */}
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Tìm tên, email nhân viên..."
                    className="w-full pl-12 pr-4 h-12 rounded-xl border-2 border-slate-200 focus:border-indigo-400 bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:scale-105">
                      <Plus className="mr-2 h-5 w-5" /> Thêm Mới
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[500px] rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-indigo-700">
                        Cấp tài khoản nhân viên
                      </DialogTitle>
                      <DialogDescription>
                        Tài khoản này sẽ có quyền truy cập vào các module được
                        chỉ định.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                      <div className="grid gap-2">
                        <Label>Họ và Tên</Label>
                        <Input
                          placeholder="VD: Trần Văn B"
                          className="rounded-lg border-slate-300 h-10"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Email đăng nhập</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            type="email"
                            className="pl-9 rounded-lg border-slate-300 h-10"
                            placeholder="staff@supermall.com"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Mật khẩu khởi tạo</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            type="text"
                            className="pl-9 rounded-lg border-slate-300 h-10"
                            placeholder="Mật khẩu ít nhất 6 ký tự"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Phân quyền (Role)</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(val) =>
                            setFormData({ ...formData, role: val })
                          }
                        >
                          <SelectTrigger className="rounded-lg border-slate-300 h-10">
                            <SelectValue placeholder="-- Chọn vai trò --" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.length === 0 ? (
                              <div className="p-2 text-sm text-slate-500 text-center">
                                Chưa có Role nào
                              </div>
                            ) : (
                              roles.map((role) => (
                                <SelectItem key={role._id} value={role._id}>
                                  <span className="font-medium">
                                    {role.name}
                                  </span>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="rounded-lg"
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleCreateUser}
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
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
              </div>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <Card className="shadow-xl border-indigo-100/20 overflow-hidden rounded-2xl border-none p-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <TableRow>
                    <TableHead className="w-[80px] p-4 font-bold text-slate-700">
                      Avatar
                    </TableHead>
                    <TableHead className="p-4 font-bold text-slate-700">
                      Thông tin nhân viên
                    </TableHead>
                    <TableHead className="p-4 font-bold text-slate-700">
                      Vai trò
                    </TableHead>
                    <TableHead className="p-4 font-bold text-slate-700">
                      Ngày tạo
                    </TableHead>
                    <TableHead className="text-right p-4 font-bold text-slate-700">
                      Hành động
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-40 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <UserCog className="w-8 h-8 text-slate-300" />
                          <p>Không tìm thấy nhân viên nào</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow
                        key={user._id}
                        className="hover:bg-indigo-50/30 transition-colors border-t border-slate-100"
                      >
                        <TableCell className="p-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">
                              {user.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          <Badge
                            variant="secondary"
                            className={`
                              px-3 py-1 font-medium border
                              ${
                                user.role?.slug === 'admin'
                                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                                  : user.role?.slug === 'manager'
                                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }
                          `}
                          >
                            {user.role?.name || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(user.createdAt).toLocaleDateString(
                              'vi-VN'
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right p-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={user.role?.slug === 'admin'}
                            title="Xóa tài khoản"
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

            {/* 🔥 PAGINATION SECTION (XỊN XÒ) */}
            <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 font-medium">
                    Hiển thị
                  </span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value))
                      setPage(1)
                    }}
                    className="px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-indigo-400 outline-none font-medium bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-slate-600">
                    trên tổng {totalDocs} nhân viên
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1 || loading}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Đầu
                  </Button>
                  <Button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || loading}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Trước
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }

                      return (
                        <Button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className={
                            page === pageNum
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                              : 'bg-white'
                          }
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages || loading}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Sau
                  </Button>
                  <Button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={page === totalPages || loading}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Cuối
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
