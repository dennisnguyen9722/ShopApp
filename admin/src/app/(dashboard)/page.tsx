/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import { useRouter } from 'next/navigation' // 👈 Import Router
import {
  DollarSign,
  Users,
  Package,
  TrendingUp,
  ShoppingBag
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 👇 Khai báo Router
  const router = useRouter()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axiosClient.get('/stats')
        setStats(data)
      } catch (error) {
        console.error(error)
        toast.error('Lỗi tải thống kê')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Helper: Format tiền tệ
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)

  // Helper: Xử lý dữ liệu biểu đồ
  const processChartData = () => {
    if (!stats?.chart) return []
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      last7Days.push(d.toISOString().split('T')[0])
    }
    return last7Days.map((date) => {
      const found = stats.chart.find((item: any) => item._id === date)
      return {
        name: date.slice(5).split('-').reverse().join('/'),
        total: found ? found.total : 0
      }
    })
  }

  // 👇 HÀM CHUYỂN TRANG KHI BẤM VÀO ĐƠN HÀNG
  const handleViewOrder = (orderId: string) => {
    router.push(`/orders?id=${orderId}`)
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center h-full">
        Đang tải dữ liệu thống kê...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h2>
          <p className="text-gray-500 mt-1">
            Xin chào, {user?.name || 'Admin'} 👋
          </p>
        </div>
      </div>

      {/* 1. CARDS THỐNG KÊ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Doanh thu */}
        <Card className="shadow-sm border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Tổng doanh thu
            </CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats?.cards.totalRevenue || 0)}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> +
              {formatCurrency(stats?.cards.monthRevenue || 0)} tháng này
            </p>
          </CardContent>
        </Card>

        {/* Đơn hàng mới */}
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Đơn hàng mới
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.cards.pendingOrders}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Trên tổng số {stats?.cards.totalOrders} đơn hàng
            </p>
          </CardContent>
        </Card>

        {/* Khách hàng */}
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Khách hàng
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.cards.totalCustomers}
            </div>
            <p className="text-xs text-gray-500 mt-1">Người dùng đã đăng ký</p>
          </CardContent>
        </Card>

        {/* Sản phẩm */}
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Sản phẩm
            </CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.cards.totalProducts}
            </div>
            <p className="text-xs text-gray-500 mt-1">Đang kinh doanh</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 2. BIỂU ĐỒ DOANH THU */}
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Biểu đồ doanh thu</CardTitle>
            <p className="text-sm text-gray-500">Thống kê 7 ngày gần nhất</p>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processChartData()}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eee"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    cursor={{ fill: '#f4f4f5' }}
                  />
                  <Bar
                    dataKey="total"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. DANH SÁCH ĐƠN HÀNG VỪA ĐẶT */}
        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Đơn hàng vừa đặt</CardTitle>
            <p className="text-sm text-gray-500">Cần xử lý ngay</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentOrders.length === 0 ? (
                <p className="text-center text-gray-400 py-4">
                  Chưa có đơn hàng nào
                </p>
              ) : (
                stats?.recentOrders.map((order: any) => (
                  <div
                    key={order._id}
                    // 👇 SỰ KIỆN CLICK ĐỂ XEM CHI TIẾT
                    onClick={() => handleViewOrder(order._id)}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <ShoppingBag className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {order.customer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.customer.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-indigo-600">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <div className="mt-1">
                        {order.status === 'pending' && (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-700 text-[10px] h-5 hover:bg-yellow-100"
                          >
                            Mới
                          </Badge>
                        )}
                        {order.status === 'completed' && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 text-[10px] h-5 hover:bg-green-100"
                          >
                            Xong
                          </Badge>
                        )}
                        {order.status === 'confirmed' && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 text-[10px] h-5 hover:bg-blue-100"
                          >
                            Đã duyệt
                          </Badge>
                        )}
                        {order.status === 'cancelled' && (
                          <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-700 text-[10px] h-5 hover:bg-red-100"
                          >
                            Hủy
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
