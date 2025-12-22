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
  Edit,
  ChevronLeft, // 👇 Import icon mũi tên
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// UI Components
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  // 👇 1. STATE PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const LIMIT = 10 // Số lượng mỗi trang

  // State nhập hàng
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [importQuantity, setImportQuantity] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()

  // 👇 2. SỬA HÀM FETCH ĐỂ NHẬN TRANG
  const fetchProducts = async (page = 1) => {
    setLoading(true)
    try {
      // Gọi API kèm tham số phân trang
      const { data } = await axiosClient.get(
        `/products?page=${page}&limit=${LIMIT}`
      )

      // Backend trả về: { products: [], totalPages: 5, totalProducts: 50, currentPage: 1 }
      // (Lưu ý: Nếu backend chưa trả về cấu trúc này, bạn cần update backend như hướng dẫn trước đó)
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

  // Gọi fetch khi component mount hoặc currentPage đổi
  useEffect(() => {
    fetchProducts(currentPage)
  }, [currentPage])

  // Hàm tính tồn kho thực tế
  const calculateRealStock = (product: any) => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce(
        (sum: number, v: any) => sum + (v.stock || 0),
        0
      )
    }
    return product.stock || 0
  }

  // Xử lý nhập kho
  const handleRestock = async () => {
    const qty = parseInt(importQuantity)
    if (!selectedProduct || isNaN(qty) || qty <= 0) {
      toast.warning('Vui lòng nhập số lượng hợp lệ')
      return
    }

    setIsSubmitting(true)
    try {
      const currentStock = calculateRealStock(selectedProduct)
      const newStock = currentStock + qty

      await axiosClient.put(`/products/${selectedProduct._id}`, {
        stock: newStock
      })

      toast.success(
        `Đã nhập thêm ${qty} sản phẩm cho "${selectedProduct.title}"`
      )

      // Update UI cục bộ
      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id ? { ...p, stock: newStock } : p
        )
      )

      setSelectedProduct(null)
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

  // Filter Logic (Lưu ý: Chỉ filter trên trang hiện tại)
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

  // Stats (Tính trên trang hiện tại - Để chính xác cần API stats riêng từ backend)
  const stats = {
    totalItems: products.reduce((acc, p) => acc + calculateRealStock(p), 0),
    lowStockCount: products.filter((p) => {
      const s = calculateRealStock(p)
      return s > 0 && s <= 5
    }).length,
    outOfStockCount: products.filter((p) => calculateRealStock(p) === 0).length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Warehouse className="w-8 h-8 text-indigo-600" /> Quản Lý Kho Hàng
          </h2>
          <p className="text-gray-500 mt-1">
            Theo dõi tồn kho (Trang {currentPage}/{totalPages})
          </p>
        </div>

        <Button variant="outline" className="gap-2">
          <History className="w-4 h-4" /> Lịch sử nhập xuất
        </Button>
      </div>

      {/* 1. THỐNG KÊ (Current Page) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Hết hàng (Trang này)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.outOfStockCount} sản phẩm
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Sắp hết (Trang này)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.lowStockCount} sản phẩm
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Tổng sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalProducts} (Toàn hệ thống)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. THANH CÔNG CỤ */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Tìm kiếm..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full md:w-56">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
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
        </CardContent>
      </Card>

      {/* 3. BẢNG DỮ LIỆU */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[80px]">Ảnh</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead className="text-center">Danh mục</TableHead>
                  <TableHead className="text-center">Tồn kho</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        Đang tải...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-gray-500"
                    >
                      Không tìm thấy sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const realStock = calculateRealStock(product)
                    const status = getStockStatus(realStock)
                    const StatusIcon = status.icon
                    const hasVariants =
                      product.variants && product.variants.length > 0

                    return (
                      <TableRow
                        key={product._id}
                        className="hover:bg-gray-50/50"
                      >
                        <TableCell>
                          <div className="w-10 h-10 rounded border bg-gray-100 overflow-hidden">
                            <img
                              src={product.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product.title}</div>
                          {hasVariants && (
                            <Badge
                              variant="outline"
                              className="text-[10px] mt-1 font-normal bg-slate-50"
                            >
                              {product.variants.length} Phiên bản
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-gray-500 text-sm">
                          {typeof product.category === 'object'
                            ? product.category?.name
                            : '---'}
                        </TableCell>

                        <TableCell className="text-center">
                          <span
                            className={`font-bold text-lg ${
                              realStock === 0
                                ? 'text-red-600'
                                : realStock <= 5
                                ? 'text-yellow-600'
                                : 'text-gray-700'
                            }`}
                          >
                            {realStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`${status.color} gap-1`}
                          >
                            <StatusIcon className="w-3 h-3" /> {status.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          {hasVariants ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push('/products')}
                            >
                              <Edit className="w-4 h-4 mr-1" /> Chi tiết
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <Plus className="w-4 h-4 mr-1" /> Nhập hàng
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* 👇 3. FOOTER PHÂN TRANG */}
          <div className="flex items-center justify-between px-4 py-4 border-t bg-gray-50/50">
            <div className="text-sm text-gray-500">
              Hiển thị trang{' '}
              <span className="font-bold text-gray-900">{currentPage}</span> /{' '}
              {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages || loading}
              >
                Sau <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- MODAL NHẬP HÀNG (Giữ nguyên) --- */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nhập kho sản phẩm</DialogTitle>
            <DialogDescription>
              Thêm số lượng mới vào kho hàng hiện tại.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border">
                <img
                  src={selectedProduct.image}
                  className="w-12 h-12 rounded object-cover"
                  alt=""
                />
                <div>
                  <p className="font-semibold text-sm line-clamp-1">
                    {selectedProduct.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Tồn hiện tại:{' '}
                    <span className="font-bold text-indigo-600">
                      {calculateRealStock(selectedProduct)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="qty"
                  className="text-right text-sm font-medium col-span-1"
                >
                  Số lượng
                </label>
                <Input
                  id="qty"
                  type="number"
                  className="col-span-3"
                  placeholder="Nhập số lượng..."
                  autoFocus
                  value={importQuantity}
                  onChange={(e) => setImportQuantity(e.target.value)}
                />
              </div>

              {importQuantity && !isNaN(parseInt(importQuantity)) && (
                <div className="text-center text-sm text-gray-500 mt-2">
                  Sau khi nhập:{' '}
                  <span className="font-bold text-gray-900">
                    {calculateRealStock(selectedProduct)}
                  </span>{' '}
                  +{' '}
                  <span className="font-bold text-green-600">
                    {importQuantity}
                  </span>{' '}
                  ={' '}
                  <span className="font-bold text-indigo-600 text-lg">
                    {calculateRealStock(selectedProduct) +
                      parseInt(importQuantity)}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleRestock}
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? 'Đang lưu...' : 'Xác nhận nhập'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
