/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import { Plus, Trash2, Tag, Loader2, Pencil, ImageIcon } from 'lucide-react'

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
interface Brand {
  _id: string
  name: string
  slug: string
  image: string
  description: string
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)

  // State cho Form
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // State quản lý việc sửa
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    description: ''
  })

  // 1. LẤY DANH SÁCH BRAND
  const fetchBrands = async () => {
    setLoading(true)
    try {
      const response = await axiosClient.get('/brands')
      setBrands(response.data || [])
    } catch (error) {
      console.error('Lỗi lấy thương hiệu:', error)
      toast.error('Không thể tải danh sách thương hiệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  // 2. UPLOAD ẢNH (CLOUDINARY)
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
      if (uploadImage.secure_url) {
        setFormData({ ...formData, image: uploadImage.secure_url })
      } else {
        toast.error('Lỗi upload ảnh (Cloudinary)')
      }
    } catch (error) {
      console.error('Lỗi upload ảnh:', error)
      toast.error('Upload ảnh thất bại!')
    } finally {
      setIsUploading(false)
    }
  }

  // Helper: Reset form về trắng
  const resetForm = () => {
    setEditingId(null)
    setFormData({ name: '', image: '', description: '' })
  }

  // 3. XỬ LÝ MỞ FORM (THÊM HOẶC SỬA)
  const handleAddNew = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEditClick = (brand: Brand) => {
    setEditingId(brand._id)
    setFormData({
      name: brand.name,
      image: brand.image || '',
      description: brand.description || ''
    })
    setIsDialogOpen(true)
  }

  // 4. SUBMIT (TẠO MỚI HOẶC CẬP NHẬT)
  const handleSubmit = async () => {
    if (!formData.name) {
      toast.warning('Vui lòng nhập tên thương hiệu!')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        // 🔥 LOGIC SỬA (PUT)
        await axiosClient.put(`/brands/${editingId}`, formData)
        toast.success('Cập nhật thương hiệu thành công!')
      } else {
        // 🔥 LOGIC THÊM (POST)
        await axiosClient.post('/brands', formData)
        toast.success('Thêm thương hiệu thành công!')
      }

      setIsDialogOpen(false)
      fetchBrands() // Load lại bảng
    } catch (error: any) {
      console.error('Lỗi submit:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 5. XÓA BRAND
  const handleDeleteBrand = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa thương hiệu này?')) return
    try {
      await axiosClient.delete(`/brands/${id}`)
      fetchBrands()
      toast.success('Xóa thương hiệu thành công!')
    } catch (error) {
      console.error('Lỗi xóa thương hiệu:', error)
      toast.error('Không thể xóa thương hiệu này!')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-none bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <Tag className="w-6 h-6 text-indigo-600" /> Quản Lý Thương Hiệu
            </CardTitle>
            <CardDescription>
              Các nhãn hàng, thương hiệu đối tác
            </CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleAddNew}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" /> Thêm Thương Hiệu
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu mới'}
                </DialogTitle>
                <DialogDescription>
                  Nhập thông tin chi tiết cho nhãn hàng này.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Tên thương hiệu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ví dụ: Samsung..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="image">Logo thương hiệu</Label>
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

                {/* Khu vực Preview Ảnh */}
                <div className="w-full h-32 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center border border-dashed relative group">
                  {formData.image ? (
                    <>
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="h-full object-contain p-2"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute top-2 right-2 bg-white text-red-500 p-1.5 rounded-full shadow-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-xs">Chưa có logo</span>
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="desc">Mô tả</Label>
                  <Textarea
                    id="desc"
                    placeholder="Giới thiệu về thương hiệu..."
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
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUploading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    'Lưu thay đổi'
                  ) : (
                    'Tạo mới'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[80px] text-center">Logo</TableHead>
                  <TableHead>Tên Thương Hiệu</TableHead>
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
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
                    </TableCell>
                  </TableRow>
                ) : brands.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-gray-500"
                    >
                      Chưa có thương hiệu nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((brand) => (
                    <TableRow key={brand._id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="w-12 h-12 mx-auto rounded-md border bg-white flex items-center justify-center overflow-hidden p-1">
                          {brand.image ? (
                            <img
                              src={brand.image}
                              alt={brand.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Tag className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-800">
                        {brand.name}
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs font-mono bg-gray-100 px-2 py-1 rounded w-fit">
                        {brand.slug}
                      </TableCell>
                      <TableCell className="text-gray-500 truncate max-w-[200px]">
                        {brand.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {/* NÚT SỬA */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleEditClick(brand)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* NÚT XÓA */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteBrand(brand._id)}
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
