/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import { Plus, Pencil, Trash2, Layers, Loader2 } from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// Kiểu dữ liệu
interface Category {
  _id: string
  name: string
  slug: string
  image: string
  description: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // State cho Form
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    description: ''
  })

  // --- 1. LẤY DANH SÁCH DANH MỤC ---
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await axiosClient.get('/categories')
      setCategories(response.data || [])
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // --- 2. UPLOAD ẢNH (CLOUDINARY) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const data = new FormData()
    data.append('file', file)
    data.append(
      'upload_preset',
      process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'supermall_preset'
    )
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: data }
      )
      const uploadImage = await res.json()
      setFormData({ ...formData, image: uploadImage.secure_url })
    } catch (error) {
      console.error('Lỗi upload ảnh:', error)
      toast.error('Upload ảnh thất bại!')
    } finally {
      setIsUploading(false)
    }
  }

  // --- 3. HÀM MỞ FORM SỬA ---
  const handleEditClick = (category: Category) => {
    setEditingId(category._id)
    setFormData({
      name: category.name,
      image: category.image || '',
      description: category.description || ''
    })
    setIsDialogOpen(true)
  }

  // --- 4. HÀM MỞ FORM THÊM MỚI (RESET) ---
  const handleAddNewClick = () => {
    setEditingId(null)
    setFormData({ name: '', image: '', description: '' })
    setIsDialogOpen(true)
  }

  // --- 5. XỬ LÝ LƯU (CREATE HOẶC UPDATE) ---
  const handleSaveCategory = async () => {
    if (!formData.name) {
      toast.warning('Vui lòng nhập tên danh mục!')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await axiosClient.put(`/categories/${editingId}`, formData)
        toast.success('Cập nhật danh mục thành công!')
      } else {
        await axiosClient.post('/categories', formData)
        toast.success('Thêm danh mục thành công!')
      }

      setIsDialogOpen(false)
      setEditingId(null)
      setFormData({ name: '', image: '', description: '' })
      fetchCategories()
    } catch (error: any) {
      console.error('Lỗi lưu danh mục:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- 6. XÓA DANH MỤC ---
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return

    try {
      await axiosClient.delete(`/categories/${id}`)
      fetchCategories()
      toast.success('Xóa danh mục thành công!')
    } catch (error) {
      console.error('Lỗi xóa danh mục:', error)
      toast.error('Không thể xóa danh mục này!')
    }
  }

  return (
    <div className="min-h-screen -mt-6">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-violet-100/50 p-6 sm:p-8 border border-violet-100/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      Quản Lý Danh Mục
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      {categories.length} danh mục · Phân loại sản phẩm
                    </p>
                  </div>
                </div>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={handleAddNewClick}
                    className="px-6 py-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all hover:scale-105"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Thêm Danh Mục
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[550px] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      {editingId ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                      {editingId
                        ? 'Chỉnh sửa thông tin danh mục hiện tại.'
                        : 'Tạo các nhóm sản phẩm để dễ dàng quản lý.'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="name"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Tên danh mục
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ví dụ: Thời trang nam..."
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="h-12 rounded-xl border-2 border-slate-200 focus:border-violet-400"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label
                        htmlFor="image"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Hình ảnh (Banner/Icon)
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="cursor-pointer h-12 rounded-xl border-2 border-slate-200"
                        />
                        {isUploading && (
                          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                        )}
                      </div>
                    </div>

                    {formData.image && (
                      <div className="relative w-full h-40 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden border-2 border-slate-200">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full h-full object-contain p-2"
                        />
                        <button
                          onClick={() =>
                            setFormData({ ...formData, image: '' })
                          }
                          className="absolute top-3 right-3 bg-white text-red-500 p-2 rounded-full shadow-lg hover:bg-red-50 transition-all hover:scale-110"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label
                        htmlFor="desc"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Mô tả
                      </Label>
                      <Textarea
                        id="desc"
                        placeholder="Mô tả danh mục..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value
                          })
                        }
                        className="min-h-[100px] rounded-xl border-2 border-slate-200 focus:border-violet-400"
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="rounded-xl"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleSaveCategory}
                      disabled={isSubmitting || isUploading}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : editingId ? (
                        'Lưu thay đổi'
                      ) : (
                        'Tạo danh mục'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Categories Table */}
        <Card className="shadow-xl border-violet-100/20 overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-violet-50 to-purple-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-slate-700 w-[80px]">
                      Ảnh
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Tên Danh Mục
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Slug
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Mô tả
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700 w-[140px]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-12 h-12 animate-spin text-violet-600" />
                          <p className="text-slate-500 font-medium">
                            Đang tải dữ liệu...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-64 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                            <Layers className="w-8 h-8 text-violet-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 mb-1">
                              Chưa có danh mục nào
                            </p>
                            <p className="text-sm">
                              Hãy thêm danh mục đầu tiên để bắt đầu
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr
                        key={cat._id}
                        className="border-t border-slate-100 hover:bg-violet-50/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-violet-100 to-purple-100">
                            {cat.image ? (
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Layers className="w-8 h-8 text-violet-300" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {cat.name}
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-lg">
                            {cat.slug}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 max-w-[400px]">
                          <div className="line-clamp-2">
                            {cat.description || 'Chưa có mô tả'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(cat)}
                              className="h-9 w-9 hover:bg-blue-100 text-blue-600 rounded-lg"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(cat._id)}
                              className="h-9 w-9 hover:bg-red-100 text-red-600 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
