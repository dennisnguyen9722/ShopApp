/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Loader2,
  Image as ImageIcon,
  Smartphone
} from 'lucide-react'

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
import { toast } from 'sonner'

// Import Component Form vừa tách
import { ProductForm, ProductFormData } from '@/components/ProductForm'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // State điều khiển Modal Form
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)

  // 1. FETCH DATA
  const fetchData = async () => {
    setLoading(true)
    try {
      const [resProducts, resCategories, resBrands] = await Promise.all([
        axiosClient.get('/products'),
        axiosClient.get('/categories'),
        axiosClient.get('/brands')
      ])
      setProducts(resProducts.data.products || [])
      setCategories(resCategories.data || [])
      setBrands(resBrands.data || [])
    } catch (error) {
      toast.error('Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 2. LOGIC MỞ MODAL
  const handleAddNew = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  // 3. LOGIC SUBMIT (TỪ FORM GỬI LÊN)
  const handleFormSubmit = async (formData: ProductFormData) => {
    try {
      if (editingProduct) {
        // UPDATE
        await axiosClient.put(`/products/${editingProduct._id}`, formData)
        toast.success('Cập nhật thành công!')
      } else {
        // CREATE
        await axiosClient.post('/products', formData)
        toast.success('Thêm mới thành công!')
      }
      setIsDialogOpen(false)
      fetchData() // Load lại bảng
    } catch (error: any) {
      toast.error('Thất bại', {
        description: error.response?.data?.message || 'Có lỗi xảy ra'
      })
    }
  }

  // 4. LOGIC DELETE
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return
    try {
      await axiosClient.delete(`/products/${id}`)
      toast.success('Đã xóa sản phẩm')
      fetchData()
    } catch (error: any) {
      toast.error('Không thể xóa', {
        description: error.response?.data?.message
      })
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-none bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-indigo-600" /> Quản Lý Sản
              Phẩm
            </CardTitle>
            <CardDescription>
              Quản lý điện thoại, máy tính bảng, laptop...
            </CardDescription>
          </div>

          <Button
            onClick={handleAddNew}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm Sản Phẩm
          </Button>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Ảnh</TableHead>
                  <TableHead>Tên Thiết Bị</TableHead>
                  <TableHead>Giá (Từ)</TableHead>
                  <TableHead className="text-center">Danh mục</TableHead>
                  <TableHead className="text-center">Phiên bản</TableHead>
                  <TableHead className="text-center w-[100px]">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-10 w-10 text-gray-300" />
                        <p>Chưa có sản phẩm nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-md border bg-gray-50 flex items-center justify-center overflow-hidden">
                          {p.image ? (
                            <img
                              src={p.image}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {p.title}
                      </TableCell>
                      <TableCell className="text-indigo-600 font-semibold">
                        {formatCurrency(p.price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="capitalize">
                          {p.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {p.variants?.length || 0} bản
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEdit(p)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(p._id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Gọi Component Form ở đây */}
      <ProductForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingProduct}
        categories={categories}
        brands={brands}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
