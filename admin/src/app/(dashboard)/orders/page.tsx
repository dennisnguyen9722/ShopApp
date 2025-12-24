/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Suspense, useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  ShoppingCart,
  Search,
  Loader2,
  Eye,
  Filter,
  ChevronDown,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

// Types
interface Order {
  _id: string
  customer: {
    name: string
    email: string
    phone: string
  }
  totalAmount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: string
  paymentStatus: string
  items: any[]
  createdAt: string
}

// --- 1. COMPONENT CHÍNH (LOGIC) ---
function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  // Pagination & Search
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [search, setSearch] = useState('')

  // Filter Status
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Modal Detail
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // FETCH API
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit, search: searchTerm }
      if (statusFilter) params.status = statusFilter

      const { data } = await axiosClient.get('/orders', { params })

      if (data.orders) {
        setOrders(data.orders)
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalDocs(data.pagination?.total || 0)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error(error)
      toast.error('Lỗi tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, limit, searchTerm, statusFilter])

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSearchTerm(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Chờ xử lý
          </Badge>
        )
      case 'processing':
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Đang chuẩn bị
          </Badge>
        )
      case 'shipped':
        return (
          <Badge
            variant="outline"
            className="bg-indigo-50 text-indigo-700 border-indigo-200"
          >
            Đang giao
          </Badge>
        )
      case 'delivered':
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            Hoàn thành
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Đã hủy
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Quản Lý Đơn Hàng
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      {totalDocs} đơn hàng · Theo dõi vận đơn
                    </p>
                  </div>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Mã đơn, tên khách..."
                    className="pl-10 h-12 rounded-xl border-2 border-slate-200 focus:border-emerald-400 bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-12 border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-5 h-5 mr-2" /> Lọc
                  <ChevronDown
                    className={`ml-2 w-4 h-4 transition-transform ${
                      showFilters ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </div>
            </div>

            {/* Filter Status Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={`cursor-pointer px-4 py-2 text-sm ${
                      !statusFilter
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                    onClick={() => setStatusFilter('')}
                  >
                    Tất cả
                  </Badge>
                  {[
                    'pending',
                    'processing',
                    'shipped',
                    'delivered',
                    'cancelled'
                  ].map((st) => (
                    <Badge
                      key={st}
                      variant={statusFilter === st ? 'default' : 'outline'}
                      className={`cursor-pointer px-4 py-2 text-sm uppercase ${
                        statusFilter === st
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      onClick={() => setStatusFilter(st)}
                    >
                      {st}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <Card className="shadow-xl border-emerald-100/20 overflow-hidden rounded-2xl border-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <TableRow>
                    <TableHead className="p-4 font-bold text-slate-700">
                      Mã đơn
                    </TableHead>
                    <TableHead className="p-4 font-bold text-slate-700">
                      Khách hàng
                    </TableHead>
                    <TableHead className="p-4 font-bold text-slate-700 text-center">
                      Trạng thái
                    </TableHead>
                    <TableHead className="p-4 font-bold text-slate-700 text-right">
                      Tổng tiền
                    </TableHead>
                    <TableHead className="p-4 font-bold text-slate-700 text-right">
                      Ngày đặt
                    </TableHead>
                    <TableHead className="p-4 font-bold text-slate-700 text-center">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-40 text-center text-slate-500"
                      >
                        Không tìm thấy đơn hàng nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow
                        key={order._id}
                        className="hover:bg-emerald-50/30 transition-colors border-t border-slate-100"
                      >
                        <TableCell className="p-4">
                          <span className="font-mono font-bold text-slate-500">
                            #{order._id.slice(-6).toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">
                              {order.customer?.name || 'Khách vãng lai'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {order.customer?.phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-center">
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="p-4 text-right">
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </TableCell>
                        <TableCell className="p-4 text-right text-sm text-slate-600">
                          <div className="flex items-center justify-end gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(order.createdAt).toLocaleDateString(
                              'vi-VN'
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-emerald-600 hover:bg-emerald-100 rounded-full"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="border-t border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 font-medium">
                    Hiển thị
                  </span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value))
                      setPage(1)
                    }}
                    className="px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-emerald-400 outline-none font-medium bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-slate-600">
                    trên tổng {totalDocs} đơn hàng
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Đầu
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Trước
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) pageNum = i + 1
                      else if (page <= 3) pageNum = i + 1
                      else if (page >= totalPages - 2)
                        pageNum = totalPages - 4 + i
                      else pageNum = page - 2 + i

                      return (
                        <Button
                          key={i}
                          onClick={() => setPage(pageNum)}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className={
                            page === pageNum
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                              : 'bg-white'
                          }
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Sau
                  </Button>
                  <Button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
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

      {/* Modal Detail (Giản lược) */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Chi tiết đơn hàng #{selectedOrder?._id.slice(-6).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>
              Khách hàng: <b>{selectedOrder?.customer?.name}</b>
            </p>
            <p>Số điện thoại: {selectedOrder?.customer?.phone}</p>
            <p className="mt-2">Sản phẩm:</p>
            <ul className="list-disc pl-5">
              {selectedOrder?.items.map((item: any, idx: number) => (
                <li key={idx}>
                  {item.product?.title || 'Sản phẩm đã xóa'} x {item.quantity} -{' '}
                  {formatCurrency(item.price)}
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-bold text-lg">Tổng cộng:</span>
              <span className="font-bold text-xl text-emerald-600">
                {selectedOrder && formatCurrency(selectedOrder.totalAmount)}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- 2. WRAPPER ĐỂ FIX LỖI BUILD VERCEL ---
export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  )
}
