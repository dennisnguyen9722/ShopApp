/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Eye,
  Loader2,
  Package,
  Printer, // Icon máy in
  Search,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
// 👇 Import PDF Library
import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF, InvoiceOrder } from '@/components/InvoicePDF'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogDescription
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null) // Order chi tiết để xem
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isClient, setIsClient] = useState(false) // Check client-side rendering

  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Hook lấy params từ URL (để mở modal từ Notification)
  const searchParams = useSearchParams()
  const notifyOrderId = searchParams.get('id')

  useEffect(() => {
    setIsClient(true) // Đánh dấu đã render ở client
    fetchOrders()
  }, [])

  // Tự động mở Modal khi có ID trên URL (từ thông báo)
  useEffect(() => {
    if (notifyOrderId && orders.length > 0) {
      const target = orders.find((o) => o._id === notifyOrderId)
      if (target) {
        handleViewOrder(target)
      }
    }
  }, [notifyOrderId, orders])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data } = await axiosClient.get('/orders')
      setOrders(data)
    } catch (error) {
      toast.error('Lỗi tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await axiosClient.put(`/orders/${orderId}/status`, { status: newStatus })
      toast.success('Cập nhật trạng thái thành công')

      // Update UI cục bộ
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      )

      // Nếu đang mở modal chi tiết thì update luôn selectedOrder
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }))
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật trạng thái')
    }
  }

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
            Chờ xử lý
          </Badge>
        )
      case 'confirmed':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            Đã duyệt
          </Badge>
        )
      case 'shipping':
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
            Đang giao
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
            Hoàn thành
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
            Đã hủy
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Filter Logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.phone.includes(searchTerm)

    const matchesStatus =
      filterStatus === 'all' || order.status === filterStatus

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Quản Lý Đơn Hàng
          </h2>
          <p className="text-gray-500 mt-1">
            Xem và xử lý các đơn đặt hàng từ khách.
          </p>
        </div>
      </div>

      {/* TOOLBAR */}
      <Card className="shadow-sm border-none">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Tìm mã đơn, tên khách, SĐT..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-56 flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="confirmed">Đã duyệt</SelectItem>
                <SelectItem value="shipping">Đang giao</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="shadow-sm border-none">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[100px]">Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="text-center">Tổng tiền</TableHead>
                  <TableHead className="text-center">Ngày đặt</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-gray-500"
                    >
                      Không tìm thấy đơn hàng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-indigo-600">
                        #{order._id.slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-xs text-gray-500">
                          {order.customer.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center text-gray-500 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewOrder(order)}
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
                          </Button>

                          {/* 👇 NÚT IN HÓA ĐƠN PDF */}
                          {isClient && (
                            <PDFDownloadLink
                              document={
                                <InvoicePDF order={order as InvoiceOrder} />
                              }
                              fileName={`Invoice-${order._id.slice(-6)}.pdf`}
                            >
                              {({ loading: pdfLoading }) => (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={pdfLoading}
                                  title="In hóa đơn"
                                  className="text-gray-500 hover:text-indigo-600"
                                >
                                  {pdfLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Printer className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </PDFDownloadLink>
                          )}
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

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              Chi tiết đơn hàng #{selectedOrder?._id.slice(-6).toUpperCase()}
              {selectedOrder && getStatusBadge(selectedOrder.status)}
            </DialogTitle>
            <DialogDescription>
              Đặt ngày{' '}
              {selectedOrder &&
                new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid gap-6 py-4">
              {/* Thông tin khách & Giao hàng */}
              <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Thông tin khách hàng
                  </h4>
                  <p className="text-sm">
                    <span className="text-gray-500">Họ tên:</span>{' '}
                    {selectedOrder.customer.name}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">SĐT:</span>{' '}
                    {selectedOrder.customer.phone}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Email:</span>{' '}
                    {selectedOrder.customer.email || 'Không có'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Địa chỉ giao hàng</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedOrder.customer.address}
                  </p>
                  <p className="text-sm mt-2">
                    <span className="text-gray-500">Ghi chú:</span>{' '}
                    {selectedOrder.note || 'Không có'}
                  </p>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <h4 className="font-semibold mb-3">Sản phẩm đã đặt</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-center">SL</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded border overflow-hidden">
                                {item.productImage && (
                                  <img
                                    src={item.productImage}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {item.productName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.variant?.color} {item.variant?.storage}{' '}
                                  {item.variant?.ram}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end mt-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Tổng tiền hàng:{' '}
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Phí vận chuyển:{' '}
                      <span className="text-gray-900 font-medium">0 ₫</span>
                    </p>
                    <p className="text-xl font-bold text-indigo-600 mt-1">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hành động cập nhật trạng thái */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">
                  Cập nhật trạng thái đơn hàng
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={
                      selectedOrder.status === 'pending' ? 'default' : 'outline'
                    }
                    size="sm"
                    className={
                      selectedOrder.status === 'pending'
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : ''
                    }
                    onClick={() =>
                      handleUpdateStatus(selectedOrder._id, 'pending')
                    }
                  >
                    Chờ xử lý
                  </Button>
                  <Button
                    variant={
                      selectedOrder.status === 'confirmed'
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    className={
                      selectedOrder.status === 'confirmed'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : ''
                    }
                    onClick={() =>
                      handleUpdateStatus(selectedOrder._id, 'confirmed')
                    }
                  >
                    Xác nhận
                  </Button>
                  <Button
                    variant={
                      selectedOrder.status === 'shipping'
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    className={
                      selectedOrder.status === 'shipping'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : ''
                    }
                    onClick={() =>
                      handleUpdateStatus(selectedOrder._id, 'shipping')
                    }
                  >
                    Đang giao
                  </Button>
                  <Button
                    variant={
                      selectedOrder.status === 'completed'
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    className={
                      selectedOrder.status === 'completed'
                        ? 'bg-green-600 hover:bg-green-700'
                        : ''
                    }
                    onClick={() =>
                      handleUpdateStatus(selectedOrder._id, 'completed')
                    }
                  >
                    Hoàn thành
                  </Button>
                  <Button
                    variant={
                      selectedOrder.status === 'cancelled'
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    className={
                      selectedOrder.status === 'cancelled'
                        ? 'bg-red-600 hover:bg-red-700'
                        : ''
                    }
                    onClick={() => {
                      if (
                        confirm(
                          'Bạn có chắc chắn muốn hủy đơn này? Kho sẽ được hoàn lại.'
                        )
                      ) {
                        handleUpdateStatus(selectedOrder._id, 'cancelled')
                      }
                    }}
                  >
                    Hủy đơn
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
