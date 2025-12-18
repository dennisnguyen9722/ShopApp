/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  ShoppingBag,
  Eye,
  Loader2,
  Calendar,
  MapPin,
  User,
  Phone,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  PackageCheck
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

// Types
interface OrderItem {
  product: any
  productName: string
  productImage: string
  variant: { color: string; storage: string; ram: string }
  quantity: number
  price: number
}

interface Order {
  _id: string
  customer: {
    name: string
    email: string
    phone: string
    address: string
  }
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled'
  paymentMethod: string
  createdAt: string
  note?: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // State Detail Dialog
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // 1. FETCH DATA
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get('/orders')
      setOrders(data)
    } catch (error: any) {
      // Nếu lỗi 403 (không có quyền)
      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền xem đơn hàng')
      } else {
        toast.error('Lỗi tải danh sách đơn hàng')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // 2. UPDATE STATUS
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true)
    try {
      await axiosClient.put(`/orders/${orderId}/status`, { status: newStatus })
      toast.success('Cập nhật trạng thái thành công!')

      // Update state cục bộ để UI phản hồi nhanh
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: newStatus as any } : o
        )
      )

      // Đóng modal nếu đang mở đúng đơn đó
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: newStatus as any } : null
        )
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Không thể cập nhật trạng thái'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  // Helper: Format tiền
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)

  // Helper: Status Config (Màu sắc + Label)
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Chờ xử lý',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: Loader2
        }
      case 'confirmed':
        return {
          label: 'Đã xác nhận',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: PackageCheck
        }
      case 'shipping':
        return {
          label: 'Đang giao',
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          icon: Truck
        }
      case 'completed':
        return {
          label: 'Hoàn thành',
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle
        }
      case 'cancelled':
        return {
          label: 'Đã hủy',
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: XCircle
        }
      default:
        return { label: status, color: 'bg-gray-100', icon: Loader2 }
    }
  }

  // Filter orders
  const filteredOrders =
    filterStatus === 'all'
      ? orders
      : orders.filter((o) => o.status === filterStatus)

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <ShoppingBag className="w-6 h-6 text-indigo-600" /> Quản Lý Đơn
              Hàng
            </CardTitle>
            <CardDescription>
              Theo dõi và xử lý đơn đặt hàng từ khách hàng
            </CardDescription>
          </div>

          {/* Bộ lọc trạng thái */}
          <div className="w-[200px]">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đơn hàng</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="shipping">Đang giao hàng</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[100px]">Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-gray-500"
                    >
                      Không tìm thấy đơn hàng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const statusConfig = getStatusConfig(order.status)
                    const StatusIcon = statusConfig.icon

                    return (
                      <TableRow
                        key={order._id}
                        className="hover:bg-gray-50/50 cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <TableCell className="font-mono font-medium text-gray-500">
                          #{order._id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {order.customer.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {order.customer.phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-indigo-600">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`gap-1 pr-3 pl-2 py-1 ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />{' '}
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(order.createdAt).toLocaleDateString(
                            'vi-VN'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrder(order)
                            }}
                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                          >
                            <Eye className="w-4 h-4 mr-1" /> Chi tiết
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

      {/* --- MODAL CHI TIẾT ĐƠN HÀNG --- */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
          <DialogHeader className="px-6 py-5 border-b bg-gray-50/50">
            <div className="flex items-center justify-between mr-8">
              <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                📦 Đơn hàng #{selectedOrder?._id.slice(-6).toUpperCase()}
              </DialogTitle>
              {selectedOrder &&
                (() => {
                  const cfg = getStatusConfig(selectedOrder.status)
                  const Icon = cfg.icon
                  return (
                    <Badge className={`${cfg.color} gap-1 text-sm px-3 py-1`}>
                      <Icon className="w-4 h-4" /> {cfg.label}
                    </Badge>
                  )
                })()}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
            {selectedOrder && (
              <div className="space-y-6">
                {/* 1. THÔNG TIN KHÁCH & ĐƠN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-indigo-600" /> Thông tin
                      khách hàng
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between">
                        <span className="text-gray-500">Họ tên:</span>{' '}
                        <span className="font-medium">
                          {selectedOrder.customer.name}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-500">SĐT:</span>{' '}
                        <span className="font-medium">
                          {selectedOrder.customer.phone}
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-gray-700">
                          {selectedOrder.customer.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" /> Thông
                      tin thanh toán
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between">
                        <span className="text-gray-500">Hình thức:</span>{' '}
                        <span className="font-medium uppercase">
                          {selectedOrder.paymentMethod}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-500">Ngày đặt:</span>{' '}
                        <span className="font-medium">
                          {new Date(selectedOrder.createdAt).toLocaleString(
                            'vi-VN'
                          )}
                        </span>
                      </p>
                      <p className="flex justify-between items-center mt-2 pt-2 border-t">
                        <span className="text-gray-900 font-bold">
                          Tổng tiền:
                        </span>
                        <span className="text-indigo-600 text-lg font-bold">
                          {formatCurrency(selectedOrder.totalAmount)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. DANH SÁCH SẢN PHẨM */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Sản phẩm đã mua (
                    {selectedOrder.items.length})
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead className="text-center">
                            Phân loại
                          </TableHead>
                          <TableHead className="text-center">SL</TableHead>
                          <TableHead className="text-right">Đơn giá</TableHead>
                          <TableHead className="text-right">
                            Thành tiền
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded border bg-gray-50 overflow-hidden shrink-0">
                                  <img
                                    src={
                                      item.productImage || item.product?.image
                                    }
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="font-medium text-sm line-clamp-2 max-w-[200px]">
                                  {item.productName || item.product?.title}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs text-gray-500">
                              {item.variant ? (
                                <div className="flex flex-col gap-0.5">
                                  <span>{item.variant.color}</span>
                                  <span>{item.variant.storage}</span>
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right text-gray-600">
                              {formatCurrency(item.price)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTION FOOTER - NÚT XỬ LÝ ĐƠN */}
          {selectedOrder && (
            <DialogFooter className="px-6 py-4 border-t bg-gray-50 gap-2">
              {/* LOGIC HIỂN THỊ NÚT THEO TRẠNG THÁI */}

              {selectedOrder.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleUpdateStatus(selectedOrder._id, 'cancelled')
                    }
                    disabled={isUpdating}
                  >
                    Hủy đơn hàng
                  </Button>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() =>
                      handleUpdateStatus(selectedOrder._id, 'confirmed')
                    }
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Xác nhận đơn hàng'
                    )}
                  </Button>
                </>
              )}

              {selectedOrder.status === 'confirmed' && (
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() =>
                    handleUpdateStatus(selectedOrder._id, 'shipping')
                  }
                  disabled={isUpdating}
                >
                  <Truck className="w-4 h-4 mr-2" /> Giao cho vận chuyển
                </Button>
              )}

              {selectedOrder.status === 'shipping' && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() =>
                    handleUpdateStatus(selectedOrder._id, 'completed')
                  }
                  disabled={isUpdating}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Hoàn thành đơn hàng
                </Button>
              )}

              {/* Đơn đã xong hoặc hủy thì chỉ hiện nút đóng */}
              {['completed', 'cancelled'].includes(selectedOrder.status) && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  Đóng
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
