/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Users,
  Search,
  Loader2,
  Eye,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
interface Customer {
  _id: string
  name: string
  email: string
  phone: string
  address: string
  avatar: string
  totalSpent: number
  orderCount: number
  lastOrderDate: string
}

interface OrderHistory {
  _id: string
  totalAmount: number
  status: string
  createdAt: string
  items: any[]
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  // Pagination & Search State
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10) // ✅ Đã thêm biến limit để fix lỗi
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  )
  const [customerOrders, setCustomerOrders] = useState<OrderHistory[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // 1. FETCH API
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get('/customers', {
        params: {
          page,
          limit, // ✅ Giờ biến này đã tồn tại
          search: searchTerm
        }
      })

      if (data.customers) {
        setCustomers(data.customers)
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalDocs(data.pagination?.total || 0)
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error(error)
      toast.error('Lỗi tải danh sách')
    } finally {
      setLoading(false)
    }
  }

  // Effect: Gọi lại khi page, limit hoặc search thay đổi
  useEffect(() => {
    fetchCustomers()
  }, [page, limit, searchTerm])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSearchTerm(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // 2. VIEW DETAIL
  const handleViewDetail = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setLoadingDetails(true)
    try {
      const { data } = await axiosClient.get(`/customers/${customer.email}`)
      setCustomerOrders(data.orders || [])
    } catch (error) {
      toast.error('Lỗi tải chi tiết')
    } finally {
      setLoadingDetails(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/50 p-6 sm:p-8 border border-blue-100/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Quản Lý Khách Hàng
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      {totalDocs} khách hàng · Tổng hợp từ lịch sử đơn hàng
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Tìm tên, email, sđt..."
                  className="pl-10 h-12 rounded-xl border-2 border-slate-200 focus:border-blue-400 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="shadow-xl border-blue-100/20 overflow-hidden p-0 rounded-2xl border-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Khách hàng
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Liên hệ
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700">
                      Số đơn
                    </th>
                    <th className="text-right p-4 font-bold text-slate-700">
                      Tổng chi tiêu
                    </th>
                    <th className="text-right p-4 font-bold text-slate-700">
                      Đơn cuối
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="h-64 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="h-64 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Users className="w-12 h-12 text-blue-200" />
                          <p>Chưa có dữ liệu khách hàng</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr
                        key={customer._id}
                        className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border border-blue-200">
                              <span className="font-bold text-blue-600 text-sm">
                                {customer.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-bold text-slate-900">
                              {customer.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-blue-500" />
                              <span
                                className="truncate max-w-[180px]"
                                title={customer.email}
                              >
                                {customer.email}
                              </span>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-green-500" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 font-medium px-3 py-1"
                          >
                            {customer.orderCount} đơn
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-bold text-blue-600">
                            {formatCurrency(customer.totalSpent)}
                          </span>
                        </td>
                        <td className="p-4 text-right text-sm text-slate-500">
                          {new Date(customer.lastOrderDate).toLocaleDateString(
                            'vi-VN'
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            onClick={() => handleViewDetail(customer)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (Đồng bộ với Products/Reviews) */}
            <div className="border-t border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
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
                    className="px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-blue-400 outline-none font-medium bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-slate-600">
                    trên tổng {totalDocs} khách hàng
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
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
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

      {/* Modal Detail */}
      <Dialog
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <DialogContent className="max-w-3xl rounded-2xl p-0 overflow-hidden gap-0 border-none shadow-2xl">
          <DialogHeader className="p-6 pb-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                <span className="text-3xl font-bold text-blue-600">
                  {selectedCustomer?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <DialogTitle className="text-2xl font-bold text-slate-800">
                  {selectedCustomer?.name}
                </DialogTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-white/60 px-2 py-0.5 rounded-md">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    {selectedCustomer?.email}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 bg-white min-h-[400px]">
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger
                  value="orders"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" /> Lịch sử mua hàng (
                  {customerOrders.length})
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
                >
                  <User className="w-4 h-4 mr-2" /> Địa chỉ giao hàng
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="orders"
                className="mt-0 animate-in fade-in-50"
              >
                <ScrollArea className="h-[350px] w-full pr-4">
                  {loadingDetails ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.map((order) => (
                        <div
                          key={order._id}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all bg-white"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-mono text-xs text-slate-400 font-bold mb-0.5">
                                #{order._id.slice(-8).toUpperCase()}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 text-sm">
                                  {new Date(order.createdAt).toLocaleDateString(
                                    'vi-VN'
                                  )}
                                </p>
                                <span className="text-xs text-slate-400">
                                  •
                                </span>
                                <p className="text-xs text-slate-500">
                                  {order.items.length} món
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600 text-base mb-1">
                              {formatCurrency(order.totalAmount)}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase"
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="info" className="mt-0">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="font-bold text-slate-700">Địa chỉ:</span>
                  </div>
                  <p className="text-slate-900">
                    {selectedCustomer?.address || 'Chưa cập nhật'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-slate-700">
                      Điện thoại:
                    </span>
                  </div>
                  <p className="text-slate-900 font-mono text-lg">
                    {selectedCustomer?.phone || '...'}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
