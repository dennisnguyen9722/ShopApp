/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Eye,
  Loader2,
  Package,
  Printer,
  Search,
  Filter,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
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
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const searchParams = useSearchParams()
  const notifyOrderId = searchParams.get('id')

  useEffect(() => {
    setIsClient(true)
    fetchOrders()
  }, [])

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
    // Kiểm tra logic chuyển trạng thái hợp lệ
    const currentStatus = selectedOrder?.status
    const statusFlow: { [key: string]: string[] } = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['shipping', 'cancelled'],
      shipping: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    }

    // Không cho phép chuyển từ completed hoặc cancelled
    if (currentStatus === 'completed') {
      toast.error('Không thể thay đổi trạng thái đơn hàng đã hoàn thành')
      return
    }

    if (currentStatus === 'cancelled') {
      toast.error('Không thể thay đổi trạng thái đơn hàng đã hủy')
      return
    }

    // Kiểm tra xem có được phép chuyển sang trạng thái mới không
    if (currentStatus && !statusFlow[currentStatus]?.includes(newStatus)) {
      toast.error(
        `Không thể chuyển từ "${getStatusText(
          currentStatus
        )}" sang "${getStatusText(newStatus)}"`
      )
      return
    }

    try {
      await axiosClient.put(`/orders/${orderId}/status`, { status: newStatus })
      toast.success('Cập nhật trạng thái thành công')

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      )

      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }))
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật trạng thái')
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    }
    return statusMap[status] || status
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

      {/* MODAL CHI TIẾT ĐƠN HÀNG - IMPROVED */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          {/* HEADER */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  Đơn hàng #{selectedOrder?._id.slice(-6).toUpperCase()}
                  {selectedOrder && getStatusBadge(selectedOrder.status)}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {selectedOrder &&
                      new Date(selectedOrder.createdAt).toLocaleString(
                        'vi-VN',
                        {
                          dateStyle: 'full',
                          timeStyle: 'short'
                        }
                      )}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* THÔNG TIN KHÁCH HÀNG & ĐỊA CHỈ */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Khách hàng */}
                <Card className="border-2 border-gray-100 shadow-sm">
                  <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                      <User className="w-5 h-5 text-indigo-600" />
                      Thông tin khách hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Họ tên</p>
                        <p className="font-semibold text-base text-gray-900">
                          {selectedOrder.customer.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Số điện thoại
                        </p>
                        <p className="font-medium text-base text-gray-900">
                          {selectedOrder.customer.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="font-medium text-base text-gray-900">
                          {selectedOrder.customer.email || 'Không có'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Địa chỉ giao hàng */}
                <Card className="border-2 border-gray-100 shadow-sm">
                  <CardHeader className="pb-3 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Địa chỉ giao hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" />
                      <p className="text-base text-gray-900 leading-relaxed">
                        {selectedOrder.customer.address}
                      </p>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Ghi chú</p>
                        <p className="text-base text-gray-700 italic">
                          {selectedOrder.note || 'Không có ghi chú'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* DANH SÁCH SẢN PHẨM */}
              <Card className="border-2 border-gray-100 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                    <Package className="w-5 h-5 text-purple-600" />
                    Sản phẩm đã đặt ({selectedOrder.items.length} món)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-[45%] text-base">
                            Sản phẩm
                          </TableHead>
                          <TableHead className="text-center w-[15%] text-base">
                            Số lượng
                          </TableHead>
                          <TableHead className="text-right w-[20%] text-base">
                            Đơn giá
                          </TableHead>
                          <TableHead className="text-right w-[20%] text-base">
                            Thành tiền
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item: any, idx: number) => (
                          <TableRow key={idx} className="hover:bg-gray-50/50">
                            <TableCell className="py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0">
                                  {item.productImage && (
                                    <img
                                      src={item.productImage}
                                      alt={item.productName}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-base text-gray-900 mb-1.5">
                                    {item.productName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {[
                                      item.variant?.color,
                                      item.variant?.storage,
                                      item.variant?.ram
                                    ]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-base">
                                {item.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium text-base text-gray-700">
                              {formatCurrency(item.price)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-base text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* TỔNG TIỀN */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-t-2 border-gray-200">
                    <div className="max-w-md ml-auto space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-base text-gray-600">
                          Tổng tiền hàng
                        </span>
                        <span className="font-semibold text-base text-gray-900">
                          {formatCurrency(selectedOrder.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base text-gray-600">
                          Phí vận chuyển
                        </span>
                        <span className="font-semibold text-base text-green-600">
                          Miễn phí
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">
                          Tổng cộng
                        </span>
                        <span className="text-3xl font-bold text-indigo-600">
                          {formatCurrency(selectedOrder.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CẬP NHẬT TRẠNG THÁI - FIXED */}
              <Card className="border-2 border-indigo-100 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                  <CardTitle className="text-lg text-gray-800">
                    Cập nhật trạng thái đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* CHƯA XỬ LÝ */}
                    <Button
                      variant={
                        selectedOrder.status === 'pending'
                          ? 'default'
                          : 'outline'
                      }
                      size="lg"
                      disabled={
                        selectedOrder.status === 'completed' ||
                        selectedOrder.status === 'cancelled'
                      }
                      className={
                        selectedOrder.status === 'pending'
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'hover:bg-yellow-50 hover:border-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      }
                      onClick={() =>
                        handleUpdateStatus(selectedOrder._id, 'pending')
                      }
                    >
                      Chờ xử lý
                    </Button>

                    {/* XÁC NHẬN - Chỉ cho phép từ pending */}
                    <Button
                      variant={
                        selectedOrder.status === 'confirmed'
                          ? 'default'
                          : 'outline'
                      }
                      size="lg"
                      disabled={
                        selectedOrder.status === 'completed' ||
                        selectedOrder.status === 'cancelled' ||
                        selectedOrder.status === 'shipping' ||
                        selectedOrder.status === 'confirmed'
                      }
                      className={
                        selectedOrder.status === 'confirmed'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      }
                      onClick={() =>
                        handleUpdateStatus(selectedOrder._id, 'confirmed')
                      }
                    >
                      Xác nhận
                    </Button>

                    {/* ĐANG GIAO - Chỉ cho phép từ confirmed */}
                    <Button
                      variant={
                        selectedOrder.status === 'shipping'
                          ? 'default'
                          : 'outline'
                      }
                      size="lg"
                      disabled={
                        selectedOrder.status === 'completed' ||
                        selectedOrder.status === 'cancelled' ||
                        selectedOrder.status === 'pending' ||
                        selectedOrder.status === 'shipping'
                      }
                      className={
                        selectedOrder.status === 'shipping'
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      }
                      onClick={() =>
                        handleUpdateStatus(selectedOrder._id, 'shipping')
                      }
                    >
                      Đang giao
                    </Button>

                    {/* HOÀN THÀNH - Chỉ cho phép từ shipping */}
                    <Button
                      variant={
                        selectedOrder.status === 'completed'
                          ? 'default'
                          : 'outline'
                      }
                      size="lg"
                      disabled={
                        selectedOrder.status === 'completed' ||
                        selectedOrder.status === 'cancelled' ||
                        selectedOrder.status === 'pending' ||
                        selectedOrder.status === 'confirmed'
                      }
                      className={
                        selectedOrder.status === 'completed'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'hover:bg-green-50 hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      }
                      onClick={() =>
                        handleUpdateStatus(selectedOrder._id, 'completed')
                      }
                    >
                      Hoàn thành
                    </Button>

                    {/* HỦY ĐƠN - Cho phép từ bất kỳ trạng thái nào trừ completed/cancelled */}
                    <Button
                      variant={
                        selectedOrder.status === 'cancelled'
                          ? 'default'
                          : 'outline'
                      }
                      size="lg"
                      disabled={
                        selectedOrder.status === 'completed' ||
                        selectedOrder.status === 'cancelled'
                      }
                      className={
                        selectedOrder.status === 'cancelled'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed'
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

                  {/* Hướng dẫn trạng thái */}
                  <div className="mt-5 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      📌 Quy trình xử lý đơn hàng:
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-700 flex-wrap">
                      <span className="font-semibold">Chờ xử lý</span>
                      <span>→</span>
                      <span className="font-semibold">Xác nhận</span>
                      <span>→</span>
                      <span className="font-semibold">Đang giao</span>
                      <span>→</span>
                      <span className="font-semibold">Hoàn thành</span>
                      <span className="mx-2">|</span>
                      <span className="text-red-600 font-semibold">
                        Có thể hủy bất kỳ lúc nào trước khi hoàn thành
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
