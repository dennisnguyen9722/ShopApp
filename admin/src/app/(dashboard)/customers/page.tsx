/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Users,
  Search,
  Loader2,
  Lock,
  Unlock,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
  isBlocked: boolean
  createdAt: string
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
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('') // Debounce

  // Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  )
  const [customerOrders, setCustomerOrders] = useState<OrderHistory[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // 1. FETCH CUSTOMERS (Server-side Pagination)
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get('/customers', {
        params: {
          page: page,
          limit: 10,
          search: searchTerm
        }
      })

      if (data.customers) {
        setCustomers(data.customers)
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalDocs(data.pagination?.total || 0)
      } else {
        setCustomers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error(error)
      toast.error('Lỗi tải danh sách khách hàng')
    } finally {
      setLoading(false)
    }
  }

  // Effect: Load data
  useEffect(() => {
    fetchCustomers()
  }, [page, searchTerm])

  // Effect: Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSearchTerm(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // 2. FETCH DETAIL & ORDERS
  const handleViewDetail = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setLoadingDetails(true)
    try {
      const { data } = await axiosClient.get(`/customers/${customer._id}`)
      setCustomerOrders(data.orders || [])
    } catch (error) {
      toast.error('Lỗi tải thông tin chi tiết')
    } finally {
      setLoadingDetails(false)
    }
  }

  // 3. TOGGLE BLOCK
  const handleToggleBlock = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? 'Bỏ chặn' : 'Chặn'
    if (!confirm(`Bạn có chắc muốn ${action} khách hàng này?`)) return

    try {
      await axiosClient.put(`/customers/${id}/block`)
      toast.success(`Đã ${action} thành công`)

      // Update Local State
      setCustomers((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, isBlocked: !currentStatus } : c
        )
      )
      // Nếu đang xem chi tiết ông này thì update luôn modal
      if (selectedCustomer?._id === id) {
        setSelectedCustomer((prev) =>
          prev ? { ...prev, isBlocked: !currentStatus } : null
        )
      }
    } catch (error) {
      toast.error('Thao tác thất bại')
    }
  }

  // Helper
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)

  const totalSpending = (orders: OrderHistory[]) =>
    orders.reduce(
      (acc, cur) => acc + (cur.status === 'completed' ? cur.totalAmount : 0),
      0
    )

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
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
                      {totalDocs} khách hàng · Quản lý người dùng App
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm tên, email, sđt..."
                  className="pl-10 h-12 rounded-xl border-2 border-slate-200 focus:border-blue-400 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <Card className="shadow-xl border-blue-100/20 overflow-hidden p-0 rounded-2xl border-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-slate-700 w-[80px]">
                      Avatar
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Thông tin cá nhân
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Liên hệ
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Địa chỉ
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700">
                      Trạng thái
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700 w-[180px]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                          <p className="text-slate-500 font-medium">
                            Đang tải dữ liệu...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="h-64 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 mb-1">
                              {searchTerm
                                ? 'Không tìm thấy khách hàng'
                                : 'Chưa có khách hàng nào'}
                            </p>
                          </div>
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
                          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border border-blue-100">
                            {customer.avatar ? (
                              <img
                                src={customer.avatar}
                                alt={customer.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-bold text-blue-600">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">
                              {customer.name}
                            </span>
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(
                                  customer.createdAt
                                ).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
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
                        <td className="p-4">
                          <div className="flex items-start gap-2 text-sm text-slate-600 max-w-[250px]">
                            <MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                            <span
                              className="line-clamp-2 leading-tight"
                              title={customer.address}
                            >
                              {customer.address || 'Chưa cập nhật'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {customer.isBlocked ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 px-2.5 py-0.5 shadow-none hover:bg-red-200">
                              <Lock className="w-3 h-3" /> Đã chặn
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 px-2.5 py-0.5 shadow-none hover:bg-emerald-200">
                              <Unlock className="w-3 h-3" /> Hoạt động
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleViewDetail(customer)}
                              size="sm"
                              className="h-8 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Chi tiết
                            </Button>
                            <Button
                              onClick={() =>
                                handleToggleBlock(
                                  customer._id,
                                  customer.isBlocked
                                )
                              }
                              size="sm"
                              variant="ghost"
                              className={`h-8 w-8 p-0 rounded-full ${
                                customer.isBlocked
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'
                              }`}
                              title={
                                customer.isBlocked
                                  ? 'Mở khóa'
                                  : 'Chặn tài khoản'
                              }
                            >
                              {customer.isBlocked ? (
                                <Unlock className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="border-t border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm font-medium text-slate-600">
                Tổng cộng: <span className="font-bold">{totalDocs}</span> khách
                hàng
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="bg-white hover:bg-white border-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-4 py-2 bg-white rounded-md border border-slate-200 shadow-sm min-w-[100px] text-center">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="bg-white hover:bg-white border-slate-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- MODAL DETAIL (Giữ nguyên style đẹp) --- */}
      <Dialog
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <DialogContent className="max-w-3xl rounded-2xl p-0 overflow-hidden gap-0 border-none shadow-2xl">
          <DialogHeader className="p-6 pb-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {selectedCustomer?.avatar ? (
                  <img
                    src={selectedCustomer.avatar}
                    alt={selectedCustomer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-blue-600">
                    {selectedCustomer?.name.charAt(0).toUpperCase()}
                  </span>
                )}
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
                  {selectedCustomer?.isBlocked ? (
                    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                      <Lock className="w-3 h-3 mr-1" /> Bị khóa
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                      <Unlock className="w-3 h-3 mr-1" /> Hoạt động
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 bg-white min-h-[400px]">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger
                  value="info"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
                >
                  <Users className="w-4 h-4 mr-2" /> Thông tin chung
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" /> Lịch sử mua hàng (
                  {customerOrders.length})
                </TabsTrigger>
              </TabsList>

              {/* TAB INFO */}
              <TabsContent
                value="info"
                className="space-y-4 mt-0 animate-in fade-in-50"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Số điện thoại
                      </Label>
                    </div>
                    <p className="font-bold text-slate-900 text-lg">
                      {selectedCustomer?.phone || '...'}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Ngày tham gia
                      </Label>
                    </div>
                    <p className="font-bold text-slate-900 text-lg">
                      {selectedCustomer &&
                        new Date(selectedCustomer.createdAt).toLocaleDateString(
                          'vi-VN'
                        )}
                    </p>
                  </div>

                  <div className="col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Địa chỉ
                      </Label>
                    </div>
                    <p className="font-medium text-slate-900">
                      {selectedCustomer?.address || 'Chưa cập nhật'}
                    </p>
                  </div>

                  <div className="col-span-2 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <Label className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                          Tổng chi tiêu
                        </Label>
                      </div>
                      <p className="text-xs text-blue-500">
                        Đơn hàng hoàn thành
                      </p>
                    </div>
                    <p className="font-bold text-blue-600 text-3xl tracking-tight">
                      {formatCurrency(totalSpending(customerOrders))}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* TAB ORDERS */}
              <TabsContent
                value="orders"
                className="mt-0 animate-in fade-in-50"
              >
                <ScrollArea className="h-[350px] w-full pr-4">
                  {loadingDetails ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <p className="text-slate-500 font-medium text-sm">
                        Đang tải lịch sử...
                      </p>
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          Chưa có đơn hàng
                        </p>
                        <p className="text-sm text-slate-500">
                          Khách hàng chưa mua sắm gì cả
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.map((order) => (
                        <div
                          key={order._id}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all group bg-white"
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
                              className={`text-[10px] uppercase tracking-wider ${
                                order.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : order.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
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
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
