/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Users,
  Search,
  Loader2,
  MoreHorizontal,
  Lock,
  Unlock,
  Eye,
  // ShoppingBag, (Nếu không dùng thì bỏ)
  // MapPin,
  // Phone,
  Mail,
  Phone
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label' // 👈 THÊM DÒNG NÀY
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
  DialogTitle
} from '@/components/ui/dialog'
// 👇 Import Dropdown Menu
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
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
  const [searchTerm, setSearchTerm] = useState('')

  // Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  )
  const [customerOrders, setCustomerOrders] = useState<OrderHistory[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // 1. FETCH CUSTOMERS
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get('/customers')
      setCustomers(data)
    } catch (error) {
      console.error(error)
      toast.error('Lỗi tải danh sách khách hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

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
      if (selectedCustomer?._id === id) {
        setSelectedCustomer((prev) =>
          prev ? { ...prev, isBlocked: !currentStatus } : null
        )
      }
    } catch (error) {
      toast.error('Thao tác thất bại')
    }
  }

  // Filter
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <Users className="w-6 h-6 text-indigo-600" /> Khách Hàng
            </CardTitle>
            <CardDescription>Quản lý người dùng App mua sắm</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm tên, email, sđt..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Thông tin cá nhân</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-gray-500"
                    >
                      Không tìm thấy khách hàng
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer._id}
                      className="hover:bg-gray-50/50"
                    >
                      <TableCell>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border">
                          {customer.avatar ? (
                            <img
                              src={customer.avatar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-gray-500">
                              {customer.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {customer.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            Tham gia:{' '}
                            {new Date(customer.createdAt).toLocaleDateString(
                              'vi-VN'
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {customer.isBlocked ? (
                          <Badge variant="destructive" className="gap-1">
                            <Lock className="w-3 h-3" /> Đã chặn
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 gap-1"
                          >
                            <Unlock className="w-3 h-3" /> Hoạt động
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewDetail(customer)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleBlock(
                                  customer._id,
                                  customer.isBlocked
                                )
                              }
                              className={
                                customer.isBlocked
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              {customer.isBlocked ? (
                                <>
                                  <Unlock className="mr-2 h-4 w-4" /> Bỏ chặn
                                </>
                              ) : (
                                <>
                                  <Lock className="mr-2 h-4 w-4" /> Chặn tài
                                  khoản
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- MODAL DETAIL --- */}
      <Dialog
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-2 border-b bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center overflow-hidden shadow-sm">
                {selectedCustomer?.avatar ? (
                  <img
                    src={selectedCustomer.avatar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-indigo-500">
                    {selectedCustomer?.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {selectedCustomer?.name}
                </DialogTitle>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {selectedCustomer?.email}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6">
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="info">Thông tin chung</TabsTrigger>
                <TabsTrigger value="orders">
                  Lịch sử đơn hàng ({customerOrders.length})
                </TabsTrigger>
              </TabsList>

              {/* TAB INFO */}
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <Label className="text-xs text-gray-500">
                      Số điện thoại
                    </Label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedCustomer?.phone || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <Label className="text-xs text-gray-500">Địa chỉ</Label>
                    <p
                      className="font-medium text-gray-900 mt-1 truncate"
                      title={selectedCustomer?.address}
                    >
                      {selectedCustomer?.address || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <Label className="text-xs text-gray-500">Trạng thái</Label>
                    <div className="mt-1">
                      {selectedCustomer?.isBlocked ? (
                        <Badge variant="destructive">Đang bị khóa</Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          Đang hoạt động
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <Label className="text-xs text-gray-500">
                      Tổng chi tiêu
                    </Label>
                    <p className="font-bold text-indigo-600 mt-1 text-lg">
                      {formatCurrency(
                        customerOrders.reduce(
                          (acc, cur) =>
                            acc +
                            (cur.status === 'completed' ? cur.totalAmount : 0),
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* TAB ORDERS */}
              <TabsContent value="orders">
                <ScrollArea className="h-[300px] w-full pr-4">
                  {loadingDetails ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin text-indigo-600" />
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      Khách hàng chưa có đơn hàng nào
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.map((order) => (
                        <div
                          key={order._id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div>
                            <p className="font-mono text-xs text-gray-500">
                              #{order._id.slice(-6).toUpperCase()}
                            </p>
                            <p className="font-medium text-sm mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString(
                                'vi-VN'
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.items.length} sản phẩm
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-indigo-600 text-sm">
                              {formatCurrency(order.totalAmount)}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 mt-1"
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
