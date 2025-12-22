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
  History
} from 'lucide-react'
import { toast } from 'sonner'

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

  // State nhập hàng
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [importQuantity, setImportQuantity] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. FETCH DATA
  const fetchProducts = async () => {
    try {
      // Gọi API lấy tất cả sản phẩm (Backend nên hỗ trợ pagination nếu nhiều)
      const { data } = await axiosClient.get('/products')
      setProducts(data.products || data) // Tuỳ cấu trúc trả về của API
    } catch (error) {
      toast.error('Lỗi tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // 2. XỬ LÝ NHẬP KHO
  const handleRestock = async () => {
    const qty = parseInt(importQuantity)
    if (!selectedProduct || isNaN(qty) || qty <= 0) {
      toast.warning('Vui lòng nhập số lượng hợp lệ')
      return
    }

    setIsSubmitting(true)
    try {
      // Tính tồn kho mới = Tồn cũ + Nhập thêm
      const newStock = (selectedProduct.stock || 0) + qty

      // Gọi API update (Dùng PUT /products/:id)
      // Lưu ý: Backend nên có API riêng cho nhập kho để lưu lịch sử, nhưng dùng tạm update cũng được
      await axiosClient.put(`/products/${selectedProduct._id}`, {
        stock: newStock
      })

      toast.success(
        `Đã nhập thêm ${qty} sản phẩm cho "${selectedProduct.title}"`
      )

      // Update UI ngay lập tức
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

  // Helper: Xác định trạng thái kho
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

  // Filter Logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    let matchesFilter = true
    if (filterStatus === 'out_of_stock') matchesFilter = product.stock === 0
    if (filterStatus === 'low_stock')
      matchesFilter = product.stock > 0 && product.stock <= 5
    if (filterStatus === 'in_stock') matchesFilter = product.stock > 5

    return matchesSearch && matchesFilter
  })

  // Thống kê nhanh
  const stats = {
    totalItems: products.reduce((acc, p) => acc + (p.stock || 0), 0),
    lowStockCount: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
    outOfStockCount: products.filter((p) => p.stock === 0).length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Warehouse className="w-8 h-8 text-indigo-600" /> Quản Lý Kho Hàng
          </h2>
          <p className="text-gray-500 mt-1">
            Theo dõi tồn kho và nhập hàng nhanh chóng
          </p>
        </div>

        {/* Nút hành động phụ (Ví dụ: Xem lịch sử nhập xuất - làm sau) */}
        <Button variant="outline" className="gap-2">
          <History className="w-4 h-4" /> Lịch sử nhập xuất
        </Button>
      </div>

      {/* 1. THỐNG KÊ NHANH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Hết hàng (Cần nhập ngay)
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
              Sắp hết (Báo động)
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
              Tổng tồn kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalItems} đơn vị
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
              placeholder="Tìm kiếm theo tên sản phẩm..."
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
                  <TableHead className="text-center">Giá bán</TableHead>
                  <TableHead className="text-center">Tồn kho</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-gray-500"
                    >
                      Không tìm thấy sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const status = getStockStatus(product.stock)
                    const StatusIcon = status.icon

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
                        <TableCell className="font-medium">
                          {product.title}
                        </TableCell>
                        <TableCell className="text-center text-gray-500 text-sm">
                          {typeof product.category === 'object'
                            ? product.category?.name
                            : '---'}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {new Intl.NumberFormat('vi-VN').format(product.price)}
                          ₫
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-bold text-lg ${
                              product.stock === 0
                                ? 'text-red-600'
                                : product.stock <= 5
                                ? 'text-yellow-600'
                                : 'text-gray-700'
                            }`}
                          >
                            {product.stock}
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
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Nhập hàng
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- MODAL NHẬP HÀNG --- */}
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
                      {selectedProduct.stock}
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
                  placeholder="Nhập số lượng muốn thêm..."
                  autoFocus
                  value={importQuantity}
                  onChange={(e) => setImportQuantity(e.target.value)}
                />
              </div>

              {/* Tính toán trước */}
              {importQuantity && !isNaN(parseInt(importQuantity)) && (
                <div className="text-center text-sm text-gray-500 mt-2">
                  Sau khi nhập:{' '}
                  <span className="font-bold text-gray-900">
                    {selectedProduct.stock}
                  </span>{' '}
                  +{' '}
                  <span className="font-bold text-green-600">
                    {importQuantity}
                  </span>{' '}
                  ={' '}
                  <span className="font-bold text-indigo-600 text-lg">
                    {(selectedProduct.stock || 0) + parseInt(importQuantity)}
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
