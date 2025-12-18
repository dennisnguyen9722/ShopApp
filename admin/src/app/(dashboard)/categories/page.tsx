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

  // ✨ State mới: Lưu ID của danh mục đang sửa (nếu có)
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

  // --- ✨ 3. HÀM MỞ FORM SỬA ---
  const handleEditClick = (category: Category) => {
    setEditingId(category._id) // Đánh dấu là đang sửa ID này
    setFormData({
      name: category.name,
      image: category.image || '',
      description: category.description || ''
    })
    setIsDialogOpen(true) // Mở popup
  }

  // --- ✨ 4. HÀM MỞ FORM THÊM MỚI (RESET) ---
  const handleAddNewClick = () => {
    setEditingId(null) // Xóa ID đang sửa -> Chế độ thêm mới
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
        // ✨ LOGIC CẬP NHẬT (PUT)
        await axiosClient.put(`/categories/${editingId}`, formData) // Bạn cần đảm bảo Backend có route PUT /categories/:id nha
        toast.success('Cập nhật danh mục thành công!')
      } else {
        // LOGIC TẠO MỚI (POST)
        await axiosClient.post('/categories', formData)
        toast.success('Thêm danh mục thành công!')
      }

      // Reset form & reload bảng
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
    // Dùng toast promise hoặc confirm của browser đều được
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
    <div className="space-y-6">
      <Card className="shadow-sm border-none bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" /> Quản Lý Danh Mục
            </CardTitle>
            <CardDescription>Phân loại sản phẩm của hệ thống</CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              {/* ✨ Bấm nút này thì gọi hàm handleAddNewClick */}
              <Button
                onClick={handleAddNewClick}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Thêm Danh Mục
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                {/* ✨ Đổi tiêu đề dựa theo đang sửa hay thêm */}
                <DialogTitle>
                  {editingId ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? 'Chỉnh sửa thông tin danh mục hiện tại.'
                    : 'Tạo các nhóm sản phẩm để dễ dàng quản lý.'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Tên danh mục</Label>
                  <Input
                    id="name"
                    placeholder="Ví dụ: Thời trang nam..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                {/* Upload Ảnh Danh Mục */}
                <div className="grid gap-2">
                  <Label htmlFor="image">Hình ảnh (Banner/Icon)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                    {isUploading && (
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    )}
                  </div>
                </div>

                {/* Preview ảnh */}
                {formData.image && (
                  <div className="w-full h-32 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center border relative">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="h-full object-contain"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute top-2 right-2 bg-white text-red-500 p-1 rounded-full shadow-md hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="desc">Mô tả</Label>
                  <Textarea
                    id="desc"
                    placeholder="Mô tả danh mục..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
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
                  onClick={handleSaveCategory}
                  disabled={isSubmitting || isUploading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    'Lưu thay đổi'
                  ) : (
                    'Tạo danh mục'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Ảnh</TableHead>
                  <TableHead>Tên Danh Mục</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-center w-[120px]">
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
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-gray-500"
                    >
                      Chưa có danh mục nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => (
                    <TableRow key={cat._id}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-md border bg-gray-50 flex items-center justify-center overflow-hidden">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Layers className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {cat.name}
                      </TableCell>
                      <TableCell className="text-gray-500 italic">
                        {cat.slug}
                      </TableCell>
                      <TableCell className="text-gray-500 truncate max-w-[200px]">
                        {cat.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* ✨ NÚT SỬA (EDIT) */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEditClick(cat)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* NÚT XÓA */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteCategory(cat._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
