'use client' // Vì dùng useEffect và useState nên phải là Client Component

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'

// Import các component của Shadcn UI
import { Button } from '@/components/ui/button'
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

// Định nghĩa kiểu dữ liệu
interface Product {
  _id: string
  title: string
  price: number
  category: string
  image: string
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await axiosClient.get('/products')

      console.log('📦 Data từ API:', response.data)

      // ✅ Lấy data từ response
      setProducts(response.data.products || [])
      setTotalPages(response.data.totalPages || 0)
      setCurrentPage(response.data.currentPage || 1)
    } catch (error) {
      console.error('Lỗi lấy sản phẩm:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Hàm format tiền Việt
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount * 25000) // Nhân tạm tỷ giá
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-6xl mx-auto shadow-md">
        {/* Header của bảng */}
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-6 h-6" /> Quản Lý Sản Phẩm
            </CardTitle>
            <CardDescription>
              Danh sách tất cả sản phẩm đang có trong Database
            </CardDescription>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Thêm Mới
          </Button>
        </CardHeader>

        {/* Nội dung bảng */}
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Ảnh</TableHead>
                  <TableHead>Tên Sản Phẩm</TableHead>
                  <TableHead>Danh Mục</TableHead>
                  <TableHead className="text-right">Giá Tiền</TableHead>
                  <TableHead className="text-center w-[150px]">
                    Hành Động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-gray-500"
                    >
                      Chưa có sản phẩm nào. Hãy thêm mới!
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-10 h-10 object-contain rounded-md border p-1 bg-white"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">
                        {product.title}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-indigo-600">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
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
    </div>
  )
}
