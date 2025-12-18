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
  Undo2
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  DialogFooter
} from '@/components/ui/dialog'
// ❌ BỎ IMPORT ScrollArea ĐỂ TRÁNH LỖI

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
      ROLES: 'Phân quyền'
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
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
              <ShieldCheck className="w-7 h-7 text-indigo-600" /> Vai Trò & Phân
              Quyền
            </CardTitle>
            <CardDescription>
              Quản lý danh sách các nhóm quyền hạn trong hệ thống.
            </CardDescription>
          </div>
          <Button
            onClick={handleAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" /> Tạo Vai Trò
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[250px]">Tên Vai Trò</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-center w-[150px]">
                    Quyền hạn
                  </TableHead>
                  <TableHead className="text-right w-[120px]">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role._id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {role.name}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            #{role.slug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {role.description}
                      </TableCell>
                      <TableCell className="text-center">
                        {role.slug === 'admin' ? (
                          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">
                            Toàn quyền
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-700"
                          >
                            {role.permissions.length} quyền
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {role.slug !== 'admin' && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(role)}
                              className="h-8 w-8 text-gray-500 hover:text-indigo-600 rounded-full"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(role)}
                              className="h-8 w-8 text-gray-500 hover:text-red-600 rounded-full"
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
        </CardContent>
      </Card>

      {/* --- MODAL ADD/EDIT ROLE --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* ✨ FIX: h-[90vh] để cố định chiều cao, nội dung bên trong sẽ cuộn */}
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
          <DialogHeader className="px-6 py-5 border-b shrink-0">
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {editingId ? (
                <Pencil className="w-5 h-5 text-indigo-600" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              )}
              {editingId ? 'Cập nhật Vai trò' : 'Tạo Vai trò mới'}
            </DialogTitle>
          </DialogHeader>

          {/* ✨ FIX: Thay ScrollArea bằng div thường + overflow-y-auto */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50/30">
            <div className="grid gap-6">
              {/* 1. INFO CARD */}
              <div className="bg-white p-5 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>
                    Tên nhóm <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="VD: Nhân viên kho..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả ngắn</Label>
                  <Input
                    placeholder="VD: Chỉ được xem đơn hàng..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* 2. PERMISSIONS GRID */}
              <div>
                <h3 className="text-sm font-bold mb-4 text-gray-500 uppercase flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" /> Phân quyền chi tiết
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
                          className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {/* Header Module */}
                          <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between rounded-t-xl">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  isFullChecked ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              ></div>
                              <Label className="font-bold text-gray-700 text-base cursor-pointer">
                                {formatModuleName(moduleKey)}
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`sw-${moduleKey}`}
                                className="text-xs text-gray-400 font-normal"
                              >
                                Tất cả
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

                          {/* Body: 1 Cột */}
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
                                    className={`
                                             flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-all select-none
                                             ${
                                               isChecked
                                                 ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                 : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                             }
                                          `}
                                  >
                                    <Checkbox
                                      id={permissionCode}
                                      checked={isChecked}
                                      className={`data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 ${
                                        isChecked
                                          ? 'border-indigo-600'
                                          : 'border-gray-300'
                                      }`}
                                    />
                                    <div className="flex items-center gap-2">
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

          <DialogFooter className="px-6 py-4 border-t bg-white gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="h-11 px-6 gap-2"
            >
              <Undo2 className="w-4 h-4" /> Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 gap-2 shadow-lg shadow-indigo-200"
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
