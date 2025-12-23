/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  Settings,
  CheckCircle2,
  ListTodo,
  LayoutGrid,
  Save,
  Undo2,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
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
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'

// --- TYPES ---
interface Role {
  _id: string
  name: string
  slug: string
  description: string
  permissions: string[]
}

interface PermissionList {
  [module: string]: {
    [action: string]: string
  }
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissionList, setPermissionList] = useState<PermissionList>({})
  const [loading, setLoading] = useState(false)

  // --- PAGINATION & SEARCH STATE ---
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5) // Mặc định 5 dòng cho đẹp
  const [searchTerm, setSearchTerm] = useState('')

  // State Form
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  })

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setLoading(true)
    try {
      const [resRoles, resPerms] = await Promise.all([
        axiosClient.get('/roles'),
        axiosClient.get('/roles/permissions-list')
      ])
      setRoles(resRoles.data)
      setPermissionList(resPerms.data)
    } catch (error) {
      toast.error('Lỗi tải dữ liệu')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- LOGIC PHÂN TRANG & TÌM KIẾM (CLIENT-SIDE) ---
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage)
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // --- 2. LOGIC FORM ---
  const resetForm = () => {
    setEditingId(null)
    setFormData({ name: '', description: '', permissions: [] })
  }

  const handleAddNew = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (role: Role) => {
    setEditingId(role._id)
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || []
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (role: Role) => {
    if (role.slug === 'admin') return toast.error('Không thể xóa Super Admin!')
    if (!confirm(`Bạn chắc chắn muốn xóa nhóm "${role.name}"?`)) return

    try {
      await axiosClient.delete(`/roles/${role._id}`)
      toast.success('Đã xóa nhóm quyền')
      fetchData()
    } catch (error: any) {
      toast.error('Lỗi', { description: error.response?.data?.message })
    }
  }

  // --- 3. LOGIC PERMISSION ---
  const togglePermission = (permCode: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permCode)
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permCode)
          : [...prev.permissions, permCode]
      }
    })
  }

  const toggleAllInModule = (moduleKey: string, isChecked: boolean) => {
    const moduleActions = permissionList[moduleKey]
    const allCodes = Object.values(moduleActions)

    setFormData((prev) => {
      let newPerms = [...prev.permissions]
      if (isChecked) {
        allCodes.forEach((code) => {
          if (!newPerms.includes(code)) newPerms.push(code)
        })
      } else {
        newPerms = newPerms.filter((p) => !allCodes.includes(p))
      }
      return { ...prev, permissions: newPerms }
    })
  }

  const handleSubmit = async () => {
    if (!formData.name) return toast.warning('Vui lòng nhập tên nhóm quyền')
    setIsSubmitting(true)
    try {
      if (editingId) {
        await axiosClient.put(`/roles/${editingId}`, formData)
        toast.success('Cập nhật thành công!')
      } else {
        await axiosClient.post('/roles', formData)
        toast.success('Tạo nhóm quyền thành công!')
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error('Thất bại', { description: error.response?.data?.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- HELPERS ---
  const formatModuleName = (key: string) => {
    const map: Record<string, string> = {
      PRODUCTS: 'Sản phẩm',
      CATEGORIES: 'Danh mục',
      ORDERS: 'Đơn hàng',
      USERS: 'Nhân viên',
      ROLES: 'Phân quyền',
      BANNERS: 'Banner',
      VOUCHERS: 'Voucher',
      CUSTOMERS: 'Khách hàng',
      REVIEWS: 'Đánh giá'
    }
    return map[key] || key
  }

  const getActionConfig = (actionName: string) => {
    const key = actionName.toUpperCase()
    switch (key) {
      case 'VIEW':
        return {
          label: 'Xem danh sách',
          icon: <Eye className="w-4 h-4 text-blue-500" />
        }
      case 'CREATE':
        return {
          label: 'Thêm mới',
          icon: <Plus className="w-4 h-4 text-green-500" />
        }
      case 'EDIT':
        return {
          label: 'Chỉnh sửa',
          icon: <Pencil className="w-4 h-4 text-orange-500" />
        }
      case 'DELETE':
        return {
          label: 'Xóa dữ liệu',
          icon: <Trash2 className="w-4 h-4 text-red-500" />
        }
      case 'MANAGE':
        return {
          label: 'Quản lý chung',
          icon: <Settings className="w-4 h-4 text-purple-500" />
        }
      case 'UPDATE_STATUS':
        return {
          label: 'Cập nhật trạng thái',
          icon: <ListTodo className="w-4 h-4 text-indigo-500" />
        }
      default:
        return {
          label: actionName,
          icon: <CheckCircle2 className="w-4 h-4 text-gray-500" />
        }
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* === HEADER SECTION === */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 p-6 sm:p-8 border border-indigo-100/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Vai Trò & Phân Quyền
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      {roles.length} nhóm quyền · Quản lý quyền hạn truy cập
                    </p>
                  </div>
                </div>
              </div>

              {/* SEARCH & ADD */}
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Tìm tên vai trò..."
                    className="w-full pl-12 pr-4 h-12 rounded-xl border-2 border-slate-200 focus:border-indigo-400 bg-white"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
                <Button
                  onClick={handleAddNew}
                  className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:scale-105"
                >
                  <Plus className="mr-2 h-5 w-5" /> Tạo Vai Trò
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* === TABLE SECTION === */}
        <Card className="shadow-xl border-indigo-100/20 overflow-hidden rounded-2xl border-none p-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <TableRow>
                    <TableHead className="w-[250px] p-4 font-bold text-slate-700">
                      Tên Vai Trò
                    </TableHead>
                    <TableHead className="p-4 font-bold text-slate-700">
                      Mô tả
                    </TableHead>
                    <TableHead className="text-center w-[150px] p-4 font-bold text-slate-700">
                      Quyền hạn
                    </TableHead>
                    <TableHead className="text-right w-[150px] p-4 font-bold text-slate-700">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600" />
                      </TableCell>
                    </TableRow>
                  ) : filteredRoles.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-40 text-center text-slate-500"
                      >
                        Không tìm thấy vai trò nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRoles.map((role) => (
                      <TableRow
                        key={role._id}
                        className="hover:bg-indigo-50/30 transition-colors border-t border-slate-100"
                      >
                        <TableCell className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-base">
                              {role.name}
                            </span>
                            <span className="text-xs text-indigo-500 font-mono bg-indigo-50 px-2 py-0.5 rounded w-fit mt-1">
                              #{role.slug}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 p-4 font-medium">
                          {role.description}
                        </TableCell>
                        <TableCell className="text-center p-4">
                          {role.slug === 'admin' ? (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 px-3 py-1">
                              Toàn quyền
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 text-slate-700 border-slate-200 px-3 py-1"
                            >
                              {role.permissions.length} quyền
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right p-4">
                          {role.slug !== 'admin' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(role)}
                                className="h-9 w-9 text-indigo-600 hover:bg-indigo-100 rounded-lg"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(role)}
                                className="h-9 w-9 text-red-600 hover:bg-red-100 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* === PAGINATION FOOTER (ĐÚNG STYLE BẠN CẦN) === */}
            <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 font-medium">
                    Hiển thị
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-indigo-400 outline-none font-medium bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <span className="text-sm text-slate-600">
                    trên tổng {filteredRoles.length} vai trò
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Đầu
                  </Button>
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Trước
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) pageNum = i + 1
                      else if (currentPage <= 3) pageNum = i + 1
                      else if (currentPage >= totalPages - 2)
                        pageNum = totalPages - 4 + i
                      else pageNum = currentPage - 2 + i

                      return (
                        <Button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          variant={
                            currentPage === pageNum ? 'default' : 'outline'
                          }
                          size="sm"
                          className={
                            currentPage === pageNum
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Sau
                  </Button>
                  <Button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
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

      {/* --- MODAL ADD/EDIT ROLE (Giữ nguyên) --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl">
          <DialogHeader className="px-6 py-5 border-b shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50">
            <DialogTitle className="text-xl font-bold text-indigo-800 flex items-center gap-2">
              {editingId ? (
                <Pencil className="w-5 h-5 text-indigo-600" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              )}
              {editingId ? 'Cập nhật Vai trò' : 'Tạo Vai trò mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50/50">
            <div className="grid gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700">
                    Tên nhóm quyền <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="VD: Nhân viên kho..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="rounded-lg border-slate-300 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Mô tả ngắn</Label>
                  <Input
                    placeholder="VD: Chỉ được xem đơn hàng..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="rounded-lg border-slate-300 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-4 text-indigo-900 uppercase flex items-center gap-2 tracking-wide">
                  <LayoutGrid className="w-4 h-4 text-indigo-600" /> Phân quyền
                  chi tiết
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-4">
                  {Object.entries(permissionList).map(
                    ([moduleKey, actions]) => {
                      const allCodes = Object.values(actions)
                      const isFullChecked = allCodes.every((code) =>
                        formData.permissions.includes(code)
                      )

                      return (
                        <div
                          key={moduleKey}
                          className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${
                                  isFullChecked
                                    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                                    : 'bg-slate-300'
                                }`}
                              ></div>
                              <Label className="font-bold text-slate-800 text-base cursor-pointer">
                                {formatModuleName(moduleKey)}
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`sw-${moduleKey}`}
                                className="text-xs text-slate-500 font-medium cursor-pointer"
                              >
                                Chọn tất cả
                              </Label>
                              <Switch
                                id={`sw-${moduleKey}`}
                                checked={isFullChecked}
                                onCheckedChange={(checked) =>
                                  toggleAllInModule(moduleKey, checked)
                                }
                                className="data-[state=checked]:bg-green-500 scale-90"
                              />
                            </div>
                          </div>
                          <div className="p-4 grid grid-cols-1 gap-2">
                            {Object.entries(actions).map(
                              ([actionName, permissionCode]) => {
                                const { label, icon } =
                                  getActionConfig(actionName)
                                const isChecked = formData.permissions.includes(
                                  permissionCode as string
                                )
                                return (
                                  <div
                                    key={permissionCode}
                                    onClick={() =>
                                      togglePermission(permissionCode as string)
                                    }
                                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-all select-none ${
                                      isChecked
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                                  >
                                    <Checkbox
                                      id={permissionCode}
                                      checked={isChecked}
                                      className={`data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded ${
                                        isChecked
                                          ? 'border-indigo-600'
                                          : 'border-slate-300'
                                      }`}
                                    />
                                    <div className="flex items-center gap-2.5">
                                      {icon}
                                      <span className="text-sm font-medium">
                                        {label}
                                      </span>
                                    </div>
                                  </div>
                                )
                              }
                            )}
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-white gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="h-11 px-6 gap-2 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Undo2 className="w-4 h-4" /> Hủy bỏ
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 gap-2 shadow-lg shadow-indigo-200 rounded-xl text-white font-medium hover:scale-105 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />{' '}
                  {editingId ? 'Lưu thay đổi' : 'Tạo nhóm mới'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
