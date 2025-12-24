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
  Search,
  Filter,
  ChevronDown,
  Grid3x3,
  List
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { ProductForm, ProductFormData } from '@/components/ProductForm'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  // Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // 1. FETCH METADATA (FIX LỖI BRANDS.MAP)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [resCategories, resBrands] = await Promise.all([
          axiosClient.get('/categories'),
          // Lấy tất cả brands (không phân trang hoặc lấy số lượng lớn) để fill vào dropdown
          axiosClient.get('/brands?limit=100')
        ])

        setCategories(resCategories.data || [])

        // FIX LỖI TẠI ĐÂY: Kiểm tra cấu trúc trả về của API Brands
        const brandData = resBrands.data
        if (Array.isArray(brandData)) {
          setBrands(brandData) // API cũ (trả về mảng)
        } else if (brandData.brands && Array.isArray(brandData.brands)) {
          setBrands(brandData.brands) // API mới (trả về object có key brands)
        } else {
          setBrands([]) // Fallback an toàn
        }
      } catch (error) {
        console.error('Lỗi tải metadata', error)
        setBrands([]) // Tránh lỗi crash nếu API fail
      }
    }
    fetchMetadata()
  }, [])

  // 2. FETCH PRODUCTS
  const fetchProducts = async (page: number) => {
    setLoading(true)
    try {
      let url = `/products?page=${page}&limit=${itemsPerPage}`
      if (selectedCategory) url += `&category=${selectedCategory}`
      if (searchTerm) url += `&search=${searchTerm}`

      const { data } = await axiosClient.get(url)

      // Support cả 2 cấu trúc response (để an toàn)
      if (data.products) {
        setProducts(data.products)
        setTotalPages(data.totalPages || 1)
        setTotalProducts(data.total || 0)
        setCurrentPage(data.currentPage || 1)
      } else {
        setProducts([])
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(currentPage)
  }, [currentPage, itemsPerPage, selectedCategory, searchTerm])

  // Helper
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-500 bg-red-50'
    if (stock <= 5) return 'text-amber-600 bg-amber-50'
    return 'text-emerald-600 bg-emerald-50'
  }

  const getStockLabel = (stock: number) => {
    if (stock === 0) return 'Hết hàng'
    if (stock <= 5) return 'Sắp hết'
    return 'Còn hàng'
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 p-6 sm:p-8 border border-indigo-100/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Quản Lý Sản Phẩm
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      {totalProducts} sản phẩm
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAddNew}
                className="px-6 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:scale-105"
              >
                <Plus className="mr-2 h-5 w-5" />
                Thêm Sản Phẩm
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center gap-2 font-medium"
                >
                  <Filter className="w-5 h-5" />
                  Lọc
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showFilters ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div className="flex rounded-xl border-2 border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-3 transition-all ${
                      viewMode === 'list'
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-3 transition-all ${
                      viewMode === 'grid'
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedCategory === ''
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white border border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((cat: any) => (
                    <button
                      key={cat._id}
                      onClick={() => setSelectedCategory(cat.slug || cat.name)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedCategory === (cat.slug || cat.name)
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-white border border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products Display */}
        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow-xl">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => {
              const totalStock = calculateTotalStock(p)
              return (
                <Card
                  key={p._id}
                  className="overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:scale-105 border-indigo-100"
                >
                  <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-16 h-16 text-slate-300" />
                      </div>
                    )}
                    <div
                      className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${getStockColor(
                        totalStock
                      )}`}
                    >
                      {getStockLabel(totalStock)}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <Badge
                      variant="secondary"
                      className="mb-2 bg-indigo-50 text-indigo-700"
                    >
                      {typeof p.brand === 'object' ? p.brand?.name : 'N/A'}
                    </Badge>
                    <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 min-h-[3rem]">
                      {p.title}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(p.price)}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-sm text-slate-400 line-through">
                          {formatCurrency(p.originalPrice)}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(p)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Sửa
                      </Button>
                      <Button
                        onClick={() => handleDelete(p._id)}
                        variant="destructive"
                        size="icon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="shadow-xl border-indigo-100/20 overflow-hidden p-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <tr>
                      <th className="text-left p-4 font-bold text-slate-700">
                        Ảnh
                      </th>
                      <th className="text-left p-4 font-bold text-slate-700">
                        Sản phẩm
                      </th>
                      <th className="text-left p-4 font-bold text-slate-700">
                        Giá
                      </th>
                      <th className="text-center p-4 font-bold text-slate-700">
                        Danh mục
                      </th>
                      <th className="text-center p-4 font-bold text-slate-700">
                        Tồn kho
                      </th>
                      <th className="text-center p-4 font-bold text-slate-700">
                        Thương hiệu
                      </th>
                      <th className="text-right p-4 font-bold text-slate-700">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="h-64 text-center text-slate-500"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <Package className="w-16 h-16 text-slate-300" />
                            <p className="font-medium">Chưa có sản phẩm nào</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => {
                        const totalStock = calculateTotalStock(p)
                        return (
                          <tr
                            key={p._id}
                            className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors"
                          >
                            <td className="p-4">
                              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-slate-100 to-slate-200">
                                {p.image ? (
                                  <img
                                    src={p.image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <Package className="w-8 h-8 text-slate-300" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-bold text-slate-900 line-clamp-2 max-w-md">
                              {p.title}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-indigo-600 text-lg">
                                {formatCurrency(p.price)}
                              </div>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <div className="text-xs text-slate-400 line-through">
                                  {formatCurrency(p.originalPrice)}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <Badge
                                variant="secondary"
                                className="bg-purple-100 text-purple-700"
                              >
                                {p.category}
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              <div
                                className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getStockColor(
                                  totalStock
                                )}`}
                              >
                                {totalStock}
                              </div>
                              {p.variants?.length > 0 && (
                                <div className="text-xs text-slate-400 mt-1">
                                  {p.variants.length} phiên bản
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <Badge variant="outline">
                                {typeof p.brand === 'object'
                                  ? p.brand?.name
                                  : 'N/A'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(p)}
                                  className="hover:bg-indigo-100 text-indigo-600"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(p._id)}
                                  className="hover:bg-red-100 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Advanced Pagination */}
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
                      className="px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-indigo-400 outline-none font-medium"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-slate-600">
                      trên tổng {totalProducts} sản phẩm
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1 || loading}
                      variant="outline"
                      size="sm"
                      className="font-medium"
                    >
                      Đầu
                    </Button>
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      variant="outline"
                      size="sm"
                      className="font-medium"
                    >
                      Trước
                    </Button>

                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(totalPages, 5) },
                        (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

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
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                                  : ''
                              }
                            >
                              {pageNum}
                            </Button>
                          )
                        }
                      )}
                    </div>

                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      variant="outline"
                      size="sm"
                      className="font-medium"
                    >
                      Sau
                    </Button>
                    <Button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages || loading}
                      variant="outline"
                      size="sm"
                      className="font-medium"
                    >
                      Cuối
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ProductForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingProduct}
        categories={categories}
        brands={brands} // Bây giờ brands đã chắc chắn là mảng
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
