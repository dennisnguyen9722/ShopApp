/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Loader2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ProductForm, ProductFormData } from '@/components/ProductForm'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  // Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)

  // 1. FETCH METADATA
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [resCategories, resBrands] = await Promise.all([
          axiosClient.get('/categories'),
          axiosClient.get('/brands')
        ])
        setCategories(resCategories.data || [])
        setBrands(resBrands.data || [])
      } catch (error) {
        console.error('Lỗi tải metadata', error)
      }
    }
    fetchMetadata()
  }, [])

  // 2. FETCH PRODUCTS
  const fetchProducts = async (page: number) => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get(`/products?page=${page}&limit=10`)
      setProducts(data.products || [])
      setTotalPages(data.totalPages || 1)
      setTotalProducts(data.total || 0)
      setCurrentPage(data.currentPage || 1)
    } catch (error) {
      toast.error('Lỗi tải danh sách')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(currentPage)
  }, [currentPage])

  // 👇 HÀM TÍNH TỔNG TỒN KHO (Helper)
  const calculateTotalStock = (p: any) => {
    if (p.variants && p.variants.length > 0) {
      return p.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
    }
    return p.stock || 0
  }

  // Handlers
  const handleAddNew = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleFormSubmit = async (formData: ProductFormData) => {
    try {
      if (editingProduct) {
        await axiosClient.put(`/products/${editingProduct._id}`, formData)
        toast.success('Cập nhật thành công!')
      } else {
        await axiosClient.post('/products', formData)
        toast.success('Thêm mới thành công!')
        setCurrentPage(1)
      }
      setIsDialogOpen(false)
      fetchProducts(currentPage)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa?')) return
    try {
      await axiosClient.delete(`/products/${id}`)
      toast.success('Đã xóa sản phẩm')
      fetchProducts(currentPage)
    } catch (error: any) {
      toast.error('Không thể xóa')
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            Quản Lý Sản Phẩm
            <Badge
              variant="secondary"
              className="text-sm font-normal px-2 py-0.5 bg-indigo-50 text-indigo-700"
            >
              {totalProducts}
            </Badge>
          </h1>
          <p className="text-slate-500 mt-1">
            Quản lý kho hàng, giá cả và biến thể sản phẩm.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm Sản Phẩm
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow>
                  <TableHead className="w-[80px] py-4 pl-6">Ảnh</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-700">
                    Tên Thiết Bị
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-slate-700">
                    Giá (Từ)
                  </TableHead>
                  <TableHead className="text-center py-4 font-semibold text-slate-700">
                    Danh mục
                  </TableHead>
                  {/* 👇 ĐÃ THÊM CỘT TỒN KHO */}
                  <TableHead className="text-center py-4 font-semibold text-slate-700">
                    Tồn kho
                  </TableHead>
                  <TableHead className="text-center py-4 font-semibold text-slate-700">
                    Thương hiệu
                  </TableHead>
                  <TableHead className="text-right py-4 pr-6 font-semibold text-slate-700">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="h-20 text-center">
                        <Loader2 className="mx-auto animate-spin text-slate-300" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-64 text-center text-slate-500"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="font-medium">Chưa có sản phẩm nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => {
                    // Tính tồn kho
                    const totalStock = calculateTotalStock(p)

                    return (
                      <TableRow
                        key={p._id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        <TableCell className="pl-6 py-3">
                          <div className="w-14 h-14 rounded-lg border bg-white flex items-center justify-center overflow-hidden shadow-sm">
                            {p.image ? (
                              <img
                                src={p.image}
                                className="w-full h-full object-contain p-1"
                                alt=""
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 py-3">
                          <div
                            className="line-clamp-2 max-w-[300px]"
                            title={p.title}
                          >
                            {p.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-indigo-600 font-bold py-3">
                          {formatCurrency(p.price)}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <Badge
                            variant="secondary"
                            className="capitalize bg-slate-100 text-slate-600 hover:bg-slate-200"
                          >
                            {p.category}
                          </Badge>
                        </TableCell>

                        {/* 👇 HIỂN THỊ TỒN KHO */}
                        <TableCell className="text-center py-3">
                          <span
                            className={`font-bold ${
                              totalStock === 0
                                ? 'text-red-500'
                                : totalStock <= 5
                                ? 'text-yellow-600'
                                : 'text-slate-700'
                            }`}
                          >
                            {totalStock}
                          </span>
                          {p.variants?.length > 0 && (
                            <span className="block text-[10px] text-slate-400">
                              ({p.variants.length} phiên bản)
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-center py-3">
                          <span className="text-sm font-medium text-slate-600 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm inline-block min-w-[60px]">
                            {typeof p.brand === 'object'
                              ? p.brand?.name
                              : 'N/A'}
                          </span>
                        </TableCell>

                        <TableCell className="text-right pr-6 py-3">
                          <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(p)}
                              className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(p._id)}
                              className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer Pagination */}
          <div className="border-t bg-slate-50/50 p-4 flex items-center justify-end gap-6">
            <span className="text-sm text-slate-500 font-medium">
              Trang{' '}
              <span className="text-slate-900 font-bold">{currentPage}</span>{' '}
              trên {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || loading}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProductForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingProduct}
        categories={categories}
        brands={brands}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
