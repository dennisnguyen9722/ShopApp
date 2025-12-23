/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Plus,
  Trash2,
  Tag,
  Loader2,
  Pencil,
  ImageIcon,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

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

  // --- STATE PHÂN TRANG & TÌM KIẾM ---
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('') // Debounce value

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

  // 1. LẤY DANH SÁCH BRAND
  const fetchBrands = async () => {
    setLoading(true)
    try {
      const response = await axiosClient.get('/brands', {
        params: {
          page: page,
          limit: itemsPerPage,
          search: searchTerm
        }
      })

      const { data } = response

      // TRƯỜNG HỢP 1: Backend MỚI (Đã hỗ trợ phân trang server-side)
      if (data.brands && data.pagination) {
        setBrands(data.brands)
        setTotalPages(data.pagination.totalPages)
        setTotalDocs(data.pagination.total)
      }
      // TRƯỜNG HỢP 2: Backend CŨ (Trả về mảng 1 cục, ta tự phân trang ở Client)
      else {
        const list = Array.isArray(data) ? data : []

        // 1. Lưu tổng số lượng
        setTotalDocs(list.length)

        // 2. Tính tổng số trang (Ví dụ: 12 / 10 = 1.2 => Lên 2 trang)
        const calculatedTotalPages = Math.ceil(list.length / itemsPerPage)
        setTotalPages(calculatedTotalPages || 1)

        // 3. Cắt mảng để chỉ hiện đúng số lượng itemsPerPage (Client-side Pagination)
        if (list.length > itemsPerPage) {
          const startIndex = (page - 1) * itemsPerPage
          const endIndex = startIndex + itemsPerPage
          setBrands(list.slice(startIndex, endIndex))
        } else {
          setBrands(list)
        }
      }
    } catch (error) {
      console.error('Lỗi lấy thương hiệu:', error)
      toast.error('Không thể tải danh sách thương hiệu')
    } finally {
      setLoading(false)
    }
  }

  // Effect: Gọi API khi page, itemsPerPage hoặc từ khóa tìm kiếm thay đổi
  useEffect(() => {
    fetchBrands()
  }, [page, searchTerm, itemsPerPage])

  // Effect: Debounce Search (Chờ 0.5s sau khi gõ mới tìm)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1) // Reset về trang 1 khi tìm mới
      setSearchTerm(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

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
        toast.error('Lỗi upload ảnh')
      }
    } catch (error) {
      console.error('Lỗi upload:', error)
      toast.error('Upload ảnh thất bại!')
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({ name: '', image: '', description: '' })
  }

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

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.warning('Vui lòng nhập tên thương hiệu!')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await axiosClient.put(`/brands/${editingId}`, formData)
        toast.success('Cập nhật thương hiệu thành công!')
      } else {
        await axiosClient.post('/brands', formData)
        toast.success('Thêm thương hiệu thành công!')
      }
      setIsDialogOpen(false)
      fetchBrands()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBrand = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa thương hiệu này?')) return
    try {
      await axiosClient.delete(`/brands/${id}`)
      toast.success('Xóa thương hiệu thành công!')
      fetchBrands()
    } catch (error) {
      toast.error('Không thể xóa thương hiệu này!')
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-orange-100/50 p-6 sm:p-8 border border-orange-100/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      Quản Lý Thương Hiệu
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      {totalDocs} thương hiệu · Nhãn hàng đối tác
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION & SEARCH */}
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Tìm thương hiệu..."
                    className="w-full pl-12 pr-4 h-12 rounded-xl border-2 border-slate-200 focus:border-orange-400 bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={handleAddNew}
                      className="h-12 px-6 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all hover:scale-105"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Thêm Mới
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[550px] rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        {editingId
                          ? 'Cập nhật thương hiệu'
                          : 'Thêm thương hiệu mới'}
                      </DialogTitle>
                      <DialogDescription className="text-slate-600">
                        {editingId
                          ? 'Chỉnh sửa thông tin thương hiệu hiện tại.'
                          : 'Thêm nhãn hàng, đối tác mới vào hệ thống.'}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                      <div className="grid gap-2">
                        <Label
                          htmlFor="name"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Tên thương hiệu{' '}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="Ví dụ: Samsung, Apple..."
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="h-12 rounded-xl border-2 border-slate-200 focus:border-orange-400"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="image"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Logo thương hiệu
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
                            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                          )}
                        </div>
                      </div>

                      {formData.image ? (
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
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center">
                          <div className="text-center text-slate-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <span className="text-sm font-medium">
                              Chưa có logo
                            </span>
                          </div>
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
                          placeholder="Giới thiệu về thương hiệu..."
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value
                            })
                          }
                          className="min-h-[100px] rounded-xl border-2 border-slate-200 focus:border-orange-400"
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
                        onClick={handleSubmit}
                        disabled={isSubmitting || isUploading}
                        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-xl shadow-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang lưu...
                          </>
                        ) : editingId ? (
                          'Lưu thay đổi'
                        ) : (
                          'Tạo thương hiệu'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Brands Table */}
        <Card className="shadow-xl border-orange-100/20 overflow-hidden rounded-2xl border-none p-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-slate-700 w-[100px]">
                      Logo
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Tên Thương Hiệu
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
                          <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
                          <p className="text-slate-500 font-medium">
                            Đang tải dữ liệu...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : brands.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-64 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                            <Tag className="w-8 h-8 text-orange-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 mb-1">
                              {searchTerm
                                ? 'Không tìm thấy thương hiệu'
                                : 'Chưa có thương hiệu nào'}
                            </p>
                            <p className="text-sm">
                              {searchTerm
                                ? 'Thử tìm kiếm với từ khóa khác'
                                : 'Hãy thêm thương hiệu đầu tiên để bắt đầu'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    brands.map((brand) => (
                      <tr
                        key={brand._id}
                        className="border-t border-slate-100 hover:bg-orange-50/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center p-2">
                            {brand.image ? (
                              <img
                                src={brand.image}
                                alt={brand.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Tag className="w-8 h-8 text-orange-300" />
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {brand.name}
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-lg font-mono">
                            {brand.slug}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 max-w-[400px]">
                          <div className="line-clamp-2">
                            {brand.description || 'Chưa có mô tả'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(brand)}
                              className="h-9 w-9 hover:bg-blue-100 text-blue-600 rounded-lg"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBrand(brand._id)}
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

            {/* PAGINATION FOOTER */}
            <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-orange-50 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 font-medium">
                    Hiển thị
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setPage(1)
                    }}
                    className="px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-orange-400 outline-none font-medium bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-slate-600">
                    trên tổng {totalDocs} thương hiệu
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
                              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white'
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
