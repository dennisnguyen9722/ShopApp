/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Warehouse,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  History,
  ChevronLeft,
  ChevronRight,
  Package,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const LIMIT = 10

  // Nhập hàng
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [importQuantity, setImportQuantity] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchProducts = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get(
        `/products?page=${page}&limit=${LIMIT}`
      )
      setProducts(data.products || [])
      setTotalPages(data.totalPages || 1)
      setTotalProducts(data.totalProducts || 0)
      setCurrentPage(data.currentPage || page)
    } catch (error) {
      toast.error('Lỗi tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(currentPage)
  }, [currentPage])

  const calculateRealStock = (product: any) => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce(
        (sum: number, v: any) => sum + (v.stock || 0),
        0
      )
    }
    return product.stock || 0
  }

  const handleRestock = async () => {
    const qty = parseInt(importQuantity)
    if (!selectedProduct || isNaN(qty) || qty <= 0) {
      toast.warning('Vui lòng nhập số lượng hợp lệ')
      return
    }

    setIsSubmitting(true)
    try {
      if (selectedProduct.variants && selectedProduct.variants.length > 0) {
        if (!selectedVariant) {
          toast.warning('Vui lòng chọn biến thể cần nhập kho')
          setIsSubmitting(false)
          return
        }

        const newVariantStock = (selectedVariant.stock || 0) + qty

        await axiosClient.put(
          `/products/${selectedProduct._id}/variant/${selectedVariant._id}`,
          { stock: newVariantStock }
        )

        setProducts((prev) =>
          prev.map((p) =>
            p._id === selectedProduct._id
              ? {
                  ...p,
                  variants: p.variants.map((v: any) =>
                    v._id === selectedVariant._id
                      ? { ...v, stock: newVariantStock }
                      : v
                  )
                }
              : p
          )
        )

        toast.success(
          `Đã nhập thêm ${qty} sản phẩm cho biến thể "${
            selectedVariant.name || selectedVariant.variantName || 'Biến thể'
          }"`
        )
      } else {
        const newStock = (selectedProduct.stock || 0) + qty

        await axiosClient.put(`/products/${selectedProduct._id}`, {
          stock: newStock
        })

        setProducts((prev) =>
          prev.map((p) =>
            p._id === selectedProduct._id ? { ...p, stock: newStock } : p
          )
        )

        toast.success(
          `Đã nhập thêm ${qty} sản phẩm cho "${selectedProduct.title}"`
        )
      }

      setSelectedProduct(null)
      setSelectedVariant(null)
      setImportQuantity('')
    } catch (error) {
      toast.error('Lỗi nhập kho')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return {
        label: 'Hết hàng',
        color: 'bg-red-100 text-red-700',
        icon: XCircle
      }
    if (stock <= 5)
      return {
        label: 'Sắp hết',
        color: 'bg-yellow-100 text-yellow-700',
        icon: AlertTriangle
      }
    return {
      label: 'Còn hàng',
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle
    }
  }

  const filteredProducts = products.filter((product) => {
    const realStock = calculateRealStock(product)
    const matchesSearch = product.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    let matchesFilter = true
    if (filterStatus === 'out_of_stock') matchesFilter = realStock === 0
    if (filterStatus === 'low_stock')
      matchesFilter = realStock > 0 && realStock <= 5
    if (filterStatus === 'in_stock') matchesFilter = realStock > 5

    return matchesSearch && matchesFilter
  })

  const stats = {
    totalItems: products.reduce((acc, p) => acc + calculateRealStock(p), 0),
    lowStockCount: products.filter((p) => {
      const s = calculateRealStock(p)
      return s > 0 && s <= 5
    }).length,
    outOfStockCount: products.filter((p) => calculateRealStock(p) === 0).length
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-emerald-100/50 p-6 sm:p-8 border border-emerald-100/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Warehouse className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Quản Lý Kho Hàng
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      Trang {currentPage}/{totalPages} · {totalProducts} sản
                      phẩm
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-64 h-12 rounded-xl border-2 border-slate-200 focus:border-emerald-400">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="out_of_stock">🔴 Hết hàng</SelectItem>
                  <SelectItem value="low_stock">🟡 Sắp hết hàng</SelectItem>
                  <SelectItem value="in_stock">🟢 Còn hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all hover:scale-105 bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">
                    Hết hàng
                  </p>
                  <p className="text-3xl font-bold text-red-700">
                    {stats.outOfStockCount}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    sản phẩm (trang này)
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-200/50 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all hover:scale-105 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 mb-1">
                    Sắp hết
                  </p>
                  <p className="text-3xl font-bold text-amber-700">
                    {stats.lowStockCount}
                  </p>
                  <p className="text-xs text-amber-500 mt-1">
                    sản phẩm (trang này)
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-200/50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all hover:scale-105 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-l-4 border-emerald-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 mb-1">
                    Tổng tồn kho
                  </p>
                  <p className="text-3xl font-bold text-emerald-700">
                    {stats.totalItems}
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">
                    đơn vị (trang này)
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-200/50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">
                    Tổng sản phẩm
                  </p>
                  <p className="text-3xl font-bold text-blue-700">
                    {totalProducts}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">toàn hệ thống</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-200/50 flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card className="shadow-xl border-emerald-100/20 overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Ảnh
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Sản phẩm
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700">
                      Danh mục
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700">
                      Tồn kho
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700">
                      Trạng thái
                    </th>
                    <th className="text-right p-4 font-bold text-slate-700">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                          <p className="text-slate-500 font-medium">
                            Đang tải dữ liệu...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="h-64 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="font-medium">
                            Không tìm thấy sản phẩm nào
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const realStock = calculateRealStock(product)
                      const status = getStockStatus(realStock)
                      const StatusIcon = status.icon
                      const hasVariants =
                        product.variants && product.variants.length > 0

                      return (
                        <tr
                          key={product._id}
                          className="border-t border-slate-100 hover:bg-emerald-50/30 transition-colors"
                        >
                          <td className="p-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-slate-100 to-slate-200">
                              {product.image ? (
                                <img
                                  src={product.image}
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
                          <td className="p-4">
                            <div className="font-bold text-slate-900 line-clamp-2 max-w-md">
                              {product.title}
                            </div>
                            {hasVariants && (
                              <Badge
                                variant="outline"
                                className="text-xs mt-2 font-normal bg-emerald-50 text-emerald-700 border-emerald-200"
                              >
                                {product.variants.length} Phiên bản
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <Badge
                              variant="secondary"
                              className="bg-purple-100 text-purple-700"
                            >
                              {typeof product.category === 'object'
                                ? product.category?.name
                                : '---'}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            <div
                              className={`inline-block px-4 py-2 rounded-xl text-xl font-bold ${
                                realStock === 0
                                  ? 'bg-red-50 text-red-600'
                                  : realStock <= 5
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              {realStock}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <Badge
                              variant="secondary"
                              className={`${status.color} gap-1.5 px-3 py-1.5 font-semibold`}
                            >
                              <StatusIcon className="w-4 h-4" /> {status.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <Plus className="w-4 h-4 mr-1" /> Nhập hàng
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  Hiển thị trang{' '}
                  <span className="font-bold text-slate-900">
                    {currentPage}
                  </span>{' '}
                  / {totalPages}
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
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Trước
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                              : ''
                          }
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    variant="outline"
                    size="sm"
                  >
                    Sau <ChevronRight className="w-4 h-4 ml-1" />
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

        {/* Import Stock Modal */}
        <Dialog
          open={!!selectedProduct}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProduct(null)
              setSelectedVariant(null)
              setImportQuantity('')
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Nhập kho sản phẩm
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Thêm số lượng mới vào kho hàng hiện tại.
              </DialogDescription>
            </DialogHeader>

            {selectedProduct && (
              <div className="grid gap-6 py-4">
                <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border-2 border-emerald-100">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={selectedProduct.image}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 line-clamp-2">
                      {selectedProduct.title}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Tồn hiện tại:{' '}
                      <span className="font-bold text-emerald-600 text-lg">
                        {calculateRealStock(selectedProduct)}
                      </span>
                    </p>
                  </div>
                </div>

                {selectedProduct.variants &&
                  selectedProduct.variants.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Chọn biến thể
                      </label>
                      <Select
                        value={selectedVariant?._id || ''}
                        onValueChange={(val) => {
                          const v = selectedProduct.variants.find(
                            (v: any) => v._id === val
                          )
                          setSelectedVariant(v)
                        }}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-2 border-slate-200">
                          <SelectValue placeholder="Chọn biến thể cần nhập kho" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProduct.variants.map((v: any) => {
                            const labelParts = [
                              v.color ? `Màu: ${v.color}` : null,
                              v.ram ? `RAM: ${v.ram}` : null,
                              v.storage ? `Bộ nhớ: ${v.storage}` : null
                            ].filter(Boolean)

                            const label =
                              labelParts.length > 0
                                ? labelParts.join(' / ')
                                : 'Biến thể chưa đặt tên'

                            return (
                              <SelectItem key={v._id} value={v._id}>
                                {label} – tồn: {v.stock ?? 0}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Số lượng nhập
                  </label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl border-2 border-slate-200 focus:border-emerald-400 text-lg font-semibold"
                    placeholder="Nhập số lượng..."
                    autoFocus
                    value={importQuantity}
                    onChange={(e) => setImportQuantity(e.target.value)}
                  />
                </div>

                {importQuantity &&
                  !isNaN(parseInt(importQuantity)) &&
                  (!selectedProduct.variants ||
                    selectedProduct.variants.length === 0 ||
                    selectedVariant) && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-100">
                      <p className="text-center text-sm text-slate-600 mb-2">
                        Tồn kho sau khi nhập:
                      </p>
                      <div className="flex items-center justify-center gap-3 text-lg font-bold">
                        <span className="text-slate-700">
                          {selectedVariant
                            ? selectedVariant.stock
                            : calculateRealStock(selectedProduct)}
                        </span>
                        <span className="text-slate-400">+</span>
                        <span className="text-emerald-600">
                          {importQuantity}
                        </span>
                        <span className="text-slate-400">=</span>
                        <span className="text-2xl text-indigo-600">
                          {selectedVariant
                            ? selectedVariant.stock + parseInt(importQuantity)
                            : calculateRealStock(selectedProduct) +
                              parseInt(importQuantity)}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProduct(null)
                  setSelectedVariant(null)
                  setImportQuantity('')
                }}
                className="rounded-xl"
              >
                Hủy
              </Button>
              <Button
                onClick={handleRestock}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-lg"
              >
                {isSubmitting ? 'Đang lưu...' : 'Xác nhận nhập'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
