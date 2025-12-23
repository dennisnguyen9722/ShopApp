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
  FileText,
  ShoppingCart
} from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF, InvoiceOrder } from '@/components/InvoicePDF'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
    const currentStatus = selectedOrder?.status
    const statusFlow: { [key: string]: string[] } = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['shipping', 'cancelled'],
      shipping: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    }

    if (currentStatus === 'completed') {
      toast.error('Không thể thay đổi trạng thái đơn hàng đã hoàn thành')
      return
    }

    if (currentStatus === 'cancelled') {
      toast.error('Không thể thay đổi trạng thái đơn hàng đã hủy')
      return
    }

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
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 font-semibold">
            Chờ xử lý
          </Badge>
        )
      case 'confirmed':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold">
            Đã duyệt
          </Badge>
        )
      case 'shipping':
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold">
            Đang giao
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold">
            Hoàn thành
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 font-semibold">
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

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  return (
    <div className="min-h-screen -mt-6">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-emerald-100/50 p-6 sm:p-8 border border-emerald-100/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Quản Lý Đơn Hàng
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  {orders.length} đơn hàng · Xem và xử lý đơn đặt hàng
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar - Search & Filter */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Tìm mã đơn, tên khách hàng, số điện thoại..."
                  className="pl-10 h-11 rounded-lg border-2 border-slate-200 focus:border-emerald-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 md:w-64">
                <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-11 rounded-lg border-2 border-slate-200">
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
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <Card className="shadow-xl border-emerald-100/20 overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Mã đơn
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Khách hàng
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700">
                      Tổng tiền
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700">
                      Ngày đặt
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700">
                      Trạng thái
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700 w-[160px]">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
                          <p className="text-slate-500 font-medium">
                            Đang tải dữ liệu...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : currentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="h-64 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 mb-1">
                              {searchTerm || filterStatus !== 'all'
                                ? 'Không tìm thấy đơn hàng'
                                : 'Chưa có đơn hàng nào'}
                            </p>
                            <p className="text-sm">
                              {searchTerm || filterStatus !== 'all'
                                ? 'Thử thay đổi điều kiện lọc'
                                : 'Đơn hàng sẽ xuất hiện khi khách đặt hàng'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-t border-slate-100 hover:bg-emerald-50/30 transition-colors"
                      >
                        <td className="p-4">
                          <span className="font-mono font-bold text-emerald-600 text-sm">
                            #{order._id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">
                              {order.customer.name}
                            </span>
                            <span className="text-xs text-slate-500 mt-0.5">
                              {order.customer.phone}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            <span className="font-bold text-emerald-600 text-base">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center text-slate-600 text-sm">
                            {new Date(order.createdAt).toLocaleDateString(
                              'vi-VN'
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            {getStatusBadge(order.status)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleViewOrder(order)}
                              className="h-9 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg shadow-md"
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              Xem
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
                                    variant="outline"
                                    className="h-9 px-4 rounded-lg border-2 border-slate-200 hover:bg-slate-50"
                                    disabled={pdfLoading}
                                  >
                                    {pdfLoading ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Printer className="w-4 h-4 mr-1.5" />
                                        In
                                      </>
                                    )}
                                  </Button>
                                )}
                              </PDFDownloadLink>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filteredOrders.length > 0 && (
              <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50 p-6">
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
                      className="px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-emerald-400 outline-none font-medium"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-slate-600">
                      trên tổng {filteredOrders.length} đơn hàng
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="font-medium"
                    >
                      Đầu
                    </Button>
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
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
                                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
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
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="font-medium"
                    >
                      Sau
                    </Button>
                    <Button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="font-medium"
                    >
                      Cuối
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0 rounded-2xl">
          {/* HEADER */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="font-mono">
                    #{selectedOrder?._id.slice(-6).toUpperCase()}
                  </span>
                  {selectedOrder && getStatusBadge(selectedOrder.status)}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-emerald-600" />
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
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 overflow-hidden">
                  <div className="p-4 bg-white/50 border-b border-blue-200">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                      <User className="w-5 h-5 text-blue-600" />
                      Thông tin khách hàng
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 mt-0.5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Họ tên</p>
                        <p className="font-bold text-slate-900">
                          {selectedOrder.customer.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 mt-0.5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500 mb-1">
                          Số điện thoại
                        </p>
                        <p className="font-bold text-slate-900">
                          {selectedOrder.customer.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 mt-0.5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Email</p>
                        <p className="font-medium text-slate-900">
                          {selectedOrder.customer.email || 'Không có'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Địa chỉ giao hàng */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 overflow-hidden">
                  <div className="p-4 bg-white/50 border-b border-green-200">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Địa chỉ giao hàng
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-0.5 text-slate-400 flex-shrink-0" />
                      <p className="text-base text-slate-900 leading-relaxed">
                        {selectedOrder.customer.address}
                      </p>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 mt-0.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Ghi chú</p>
                        <p className="text-base text-slate-700 italic">
                          {selectedOrder.note || 'Không có ghi chú'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DANH SÁCH SẢN PHẨM */}
              <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                    <Package className="w-5 h-5 text-purple-600" />
                    Sản phẩm đã đặt ({selectedOrder.items.length} món)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-4 font-bold text-slate-700 w-[45%]">
                          Sản phẩm
                        </th>
                        <th className="text-center p-4 font-bold text-slate-700 w-[15%]">
                          Số lượng
                        </th>
                        <th className="text-right p-4 font-bold text-slate-700 w-[20%]">
                          Đơn giá
                        </th>
                        <th className="text-right p-4 font-bold text-slate-700 w-[20%]">
                          Thành tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <tr
                          key={idx}
                          className="border-t border-slate-100 hover:bg-slate-50/50"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 bg-slate-100 rounded-xl border-2 border-slate-200 overflow-hidden flex-shrink-0">
                                {item.productImage && (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 mb-1.5">
                                  {item.productName}
                                </p>
                                {(item.variant?.color ||
                                  item.variant?.storage ||
                                  item.variant?.ram) && (
                                  <p className="text-sm text-slate-500">
                                    {[
                                      item.variant?.color,
                                      item.variant?.storage,
                                      item.variant?.ram
                                    ]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              <span className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 text-emerald-700 font-bold rounded-lg">
                                {item.quantity}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right font-bold text-slate-700">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="p-4 text-right font-bold text-emerald-600 text-lg">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TỔNG TIỀN */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-t-2 border-slate-200">
                  <div className="max-w-md ml-auto space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base text-slate-600">
                        Tổng tiền hàng
                      </span>
                      <span className="font-bold text-base text-slate-900">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base text-slate-600">
                        Phí vận chuyển
                      </span>
                      <span className="font-bold text-base text-green-600">
                        Miễn phí
                      </span>
                    </div>
                    <Separator className="bg-slate-300" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xl font-bold text-slate-900">
                        Tổng cộng
                      </span>
                      <span className="text-3xl font-bold text-emerald-600">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CẬP NHẬT TRẠNG THÁI */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 overflow-hidden">
                <div className="p-4 bg-white/50 border-b border-slate-200">
                  <h3 className="font-bold text-lg text-slate-800">
                    Cập nhật trạng thái đơn hàng
                  </h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                      className={`rounded-xl font-semibold ${
                        selectedOrder.status === 'pending'
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg'
                          : 'hover:bg-yellow-50 hover:border-yellow-300 border-2'
                      }`}
                      onClick={() =>
                        handleUpdateStatus(selectedOrder._id, 'pending')
                      }
                    >
                      Chờ xử lý
                    </Button>

                    {/* XÁC NHẬN */}
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
                      className={`rounded-xl font-semibold ${
                        selectedOrder.status === 'confirmed'
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                          : 'hover:bg-blue-50 hover:border-blue-300 border-2'
                      }`}
                      onClick={() =>
                        handleUpdateStatus(selectedOrder._id, 'confirmed')
                      }
                    >
                      Xác nhận
                    </Button>

                    {/* ĐANG GIAO */}
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
                      className={`rounded-xl font-semibold ${
                        selectedOrder.status === 'shipping'
                          ? 'bg-purple-600 hover:bg-purple-700 shadow-lg'
                          : 'hover:bg-purple-50 hover:border-purple-300 border-2'
                      }`}
                      onClick={() =>
                        handleUpdateStatus(selectedOrder._id, 'shipping')
                      }
                    >
                      Đang giao
                    </Button>

                    {/* HOÀN THÀNH */}
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
                      className={`rounded-xl font-semibold ${
                        selectedOrder.status === 'completed'
                          ? 'bg-green-600 hover:bg-green-700 shadow-lg'
                          : 'hover:bg-green-50 hover:border-green-300 border-2'
                      }`}
                      onClick={() =>
                        handleUpdateStatus(selectedOrder._id, 'completed')
                      }
                    >
                      Hoàn thành
                    </Button>

                    {/* HỦY ĐƠN */}
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
                      className={`rounded-xl font-semibold ${
                        selectedOrder.status === 'cancelled'
                          ? 'bg-red-600 hover:bg-red-700 shadow-lg'
                          : 'hover:bg-red-50 hover:border-red-300 border-2'
                      }`}
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
                  <div className="mt-5 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <p className="text-sm text-blue-800 font-bold mb-2">
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
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
