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
  X,
  Smartphone,
  MoreHorizontal,
  UploadCloud
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { toast } from 'sonner'

// --- TYPE DEFINITIONS ---

interface TechVariant {
  ram: string
  storage: string
  color: string
  price: number
  stock: number
  image?: string
}

interface TechSpec {
  k: string
  v: string
}

interface Product {
  _id: string
  title: string
  originalPrice: number
  price: number
  category: string
  image: string
  description: string
  content: string
  specs: TechSpec[]
  variants: TechVariant[]
}

interface Category {
  _id: string
  name: string
  slug: string
}

export default function ProductsPage() {
  // State Data
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // State Form & UI
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingVariant, setIsUploadingVariant] = useState(false)

  // State Edit
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form Data Main
  const [formData, setFormData] = useState({
    title: '',
    originalPrice: '' as any,
    price: '' as any,
    category: '',
    image: '',
    description: '',
    content: '',
    specs: [] as TechSpec[],
    variants: [] as TechVariant[]
  })

  // State tạm
  const [tempVariant, setTempVariant] = useState<TechVariant>({
    ram: '',
    storage: '',
    color: '',
    price: 0,
    stock: 0,
    image: ''
  })
  const [tempSpec, setTempSpec] = useState<TechSpec>({ k: '', v: '' })

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setLoading(true)
    try {
      const [resProducts, resCategories] = await Promise.all([
        axiosClient.get('/products'),
        axiosClient.get('/categories')
      ])
      setProducts(resProducts.data.products || [])
      setCategories(resCategories.data || [])
    } catch (error) {
      toast.error('Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- 2. UPLOAD IMAGE HELPERS ---
  const uploadToCloudinary = async (
    file: File,
    onSuccess: (url: string) => void,
    onFinally: () => void
  ) => {
    const data = new FormData()
    data.append('file', file)
    data.append(
      'upload_preset',
      process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'supermall_preset'
    )
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: data }
      )
      const uploadImage = await res.json()
      if (uploadImage.secure_url) onSuccess(uploadImage.secure_url)
      else toast.error('Lỗi từ Cloudinary')
    } catch {
      toast.error('Upload ảnh thất bại!')
    } finally {
      onFinally()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // Fix input file
    setIsUploading(true)
    await uploadToCloudinary(
      file,
      (url) => setFormData({ ...formData, image: url }),
      () => setIsUploading(false)
    )
  }

  const handleVariantFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // Fix input file
    setIsUploadingVariant(true)
    await uploadToCloudinary(
      file,
      (url) => setTempVariant({ ...tempVariant, image: url }),
      () => setIsUploadingVariant(false)
    )
  }

  // --- 3. LOGIC SPECS & VARIANTS ---
  const addSpec = () => {
    if (!tempSpec.k || !tempSpec.v)
      return toast.warning('Nhập tên và giá trị thông số!')
    setFormData({ ...formData, specs: [...formData.specs, tempSpec] })
    setTempSpec({ k: '', v: '' })
  }
  const removeSpec = (index: number) => {
    setFormData({
      ...formData,
      specs: formData.specs.filter((_, i) => i !== index)
    })
  }

  const addVariant = () => {
    if (!tempVariant.storage || !tempVariant.color || !tempVariant.price)
      return toast.warning('Nhập đủ thông tin!')
    setFormData({ ...formData, variants: [...formData.variants, tempVariant] })
    setTempVariant({
      ram: '',
      storage: '',
      color: '',
      price: 0,
      stock: 0,
      image: ''
    })
  }
  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index)
    })
  }

  // --- 4. HÀM RESET FORM (MỚI) ---
  const resetForm = () => {
    setEditingId(null)
    setFormData({
      title: '',
      originalPrice: '' as any,
      price: '' as any,
      category: '',
      image: '',
      description: '',
      content: '',
      specs: [],
      variants: []
    })
    setTempVariant({
      ram: '',
      storage: '',
      color: '',
      price: 0,
      stock: 0,
      image: ''
    })
    setTempSpec({ k: '', v: '' })
  }

  // --- 5. LOGIC MỞ FORM ---
  const handleAddNewClick = () => {
    resetForm() // Reset trước
    setIsDialogOpen(true) // Rồi mới mở
  }

  const handleEditClick = (product: Product) => {
    setEditingId(product._id)
    setFormData({
      title: product.title,
      originalPrice: product.originalPrice,
      price: product.price,
      category: product.category,
      image: product.image,
      description: product.description || '',
      content: product.content || '',
      specs: product.specs || [],
      variants: product.variants || []
    })
    setIsDialogOpen(true)
  }

  // --- 6. SUBMIT (SAVE) ---
  const handleSaveProduct = async () => {
    if (!formData.title || !formData.price || !formData.category) {
      return toast.warning('Vui lòng nhập các thông tin bắt buộc (*)!')
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        // 🔥 UPDATE
        await axiosClient.put(`/products/${editingId}`, {
          ...formData,
          originalPrice: Number(formData.originalPrice),
          price: Number(formData.price)
        })
        toast.success('Cập nhật sản phẩm thành công!')
      } else {
        // 🔥 CREATE
        await axiosClient.post('/products', {
          ...formData,
          originalPrice: Number(formData.originalPrice),
          price: Number(formData.price)
        })
        toast.success('Thêm sản phẩm thành công!')
      }

      setIsDialogOpen(false) // Đóng modal
      resetForm() // Reset dữ liệu (Không mở lại modal)
      fetchData() // Load lại bảng
    } catch (error: any) {
      toast.error('Thất bại', {
        description: error.response?.data?.message || 'Có lỗi xảy ra'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- 7. DELETE ---
  const handleDeleteProduct = async (id: string) => {
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

  const discountPercent =
    formData.originalPrice && formData.price
      ? Math.round(
          ((Number(formData.originalPrice) - Number(formData.price)) /
            Number(formData.originalPrice)) *
            100
        )
      : 0

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-none bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-indigo-600" /> Quản Lý Sản
              Phẩm (Tech)
            </CardTitle>
            <CardDescription>
              Quản lý điện thoại, máy tính bảng, laptop...
            </CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleAddNewClick}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Thêm Sản Phẩm
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[950px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle>
                  {editingId ? 'Cập nhật thiết bị' : 'Thêm thiết bị mới'}
                </DialogTitle>
                <DialogDescription>
                  Nhập thông tin chi tiết, thông số và các phiên bản.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 px-6 py-4">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="general">Cơ bản</TabsTrigger>
                    <TabsTrigger value="specs">Thông số KT</TabsTrigger>
                    <TabsTrigger value="variants">Phiên bản & Giá</TabsTrigger>
                    <TabsTrigger value="details">Bài viết</TabsTrigger>
                  </TabsList>

                  {/* TAB 1: CƠ BẢN */}
                  <TabsContent value="general" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 space-y-3">
                        <Label>Ảnh đại diện (Mặc định)</Label>
                        <div
                          className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden"
                          onClick={() =>
                            document.getElementById('file-upload')?.click()
                          }
                        >
                          {formData.image ? (
                            <img
                              src={formData.image}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-center">
                              {isUploading ? (
                                <Loader2 className="animate-spin text-indigo-600 w-8 h-8 mx-auto" />
                              ) : (
                                <ImageIcon className="text-gray-400 w-8 h-8 mx-auto" />
                              )}
                              <span className="text-xs text-gray-500 mt-2 block">
                                {isUploading ? 'Đang tải...' : 'Upload ảnh'}
                              </span>
                            </div>
                          )}
                          <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 space-y-4">
                        <div className="grid gap-2">
                          <Label className="text-red-500">Tên thiết bị *</Label>
                          <Input
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                title: e.target.value
                              })
                            }
                            placeholder="VD: iPhone 15 Pro Max..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Danh mục *</Label>
                            <Select
                              value={formData.category}
                              onValueChange={(val) =>
                                setFormData({ ...formData, category: val })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn danh mục" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((c) => (
                                  <SelectItem key={c._id} value={c.slug}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2 relative">
                            <Label className="text-red-500">
                              Giá hiển thị (Từ) *
                            </Label>
                            <Input
                              type="number"
                              value={formData.price}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  price: e.target.value
                                })
                              }
                              className="font-bold text-indigo-600"
                            />
                            {discountPercent > 0 && (
                              <Badge
                                variant="destructive"
                                className="absolute right-0 top-0 px-1 py-0 text-[10px]"
                              >
                                -{discountPercent}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Giá gốc (Niêm yết)</Label>
                          <Input
                            type="number"
                            value={formData.originalPrice}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                originalPrice: e.target.value
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Mô tả ngắn</Label>
                          <Textarea
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value
                              })
                            }
                            placeholder="Mô tả nhanh..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 2: SPECS */}
                  <TabsContent value="specs" className="space-y-4">
                    <div className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border">
                      <div className="grid gap-2 w-1/3">
                        <Label>Tên thông số</Label>
                        <Input
                          placeholder="VD: Chip..."
                          value={tempSpec.k}
                          onChange={(e) =>
                            setTempSpec({ ...tempSpec, k: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2 w-2/3">
                        <Label>Chi tiết</Label>
                        <Textarea
                          placeholder="VD: A17 Pro..."
                          value={tempSpec.v}
                          onChange={(e) =>
                            setTempSpec({ ...tempSpec, v: e.target.value })
                          }
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button
                        onClick={addSpec}
                        variant="secondary"
                        className="mt-8"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">
                              Thông số
                            </TableHead>
                            <TableHead>Chi tiết</TableHead>
                            <TableHead className="text-right w-[80px]">
                              Xóa
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.specs.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center text-gray-400 h-24"
                              >
                                Chưa có thông số nào
                              </TableCell>
                            </TableRow>
                          ) : (
                            formData.specs.map((s, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium bg-gray-50 align-top">
                                  {s.k}
                                </TableCell>
                                <TableCell>
                                  {s.v.length > 60 ? (
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="truncate max-w-[300px] text-gray-600 block"
                                        title={s.v}
                                      >
                                        {s.v}
                                      </span>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full hover:bg-gray-200"
                                          >
                                            <MoreHorizontal className="w-4 h-4 text-indigo-600" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-4 text-sm bg-white shadow-lg border">
                                          <p className="font-semibold mb-1">
                                            {s.k}:
                                          </p>
                                          <p className="text-gray-700 whitespace-pre-wrap">
                                            {s.v}
                                          </p>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  ) : (
                                    <span>{s.v}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right align-top">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSpec(idx)}
                                    className="text-red-500 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* TAB 3: VARIANTS */}
                  <TabsContent value="variants" className="space-y-4">
                    <div className="grid grid-cols-12 gap-2 items-end bg-slate-50 p-3 rounded-lg border relative">
                      <div className="col-span-1">
                        <Label className="text-xs mb-1 block">Ảnh màu</Label>
                        <div
                          className="w-full aspect-square border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-100 bg-white overflow-hidden relative"
                          onClick={() =>
                            document
                              .getElementById('variant-file-upload')
                              ?.click()
                          }
                        >
                          {tempVariant.image ? (
                            <img
                              src={tempVariant.image}
                              className="w-full h-full object-cover"
                            />
                          ) : isUploadingVariant ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          ) : (
                            <UploadCloud className="w-4 h-4 text-gray-400" />
                          )}
                          <Input
                            id="variant-file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleVariantFileUpload}
                            accept="image/*"
                            disabled={isUploadingVariant}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2 col-span-2">
                        <Label>RAM</Label>
                        <Input
                          placeholder="8GB"
                          value={tempVariant.ram}
                          onChange={(e) =>
                            setTempVariant({
                              ...tempVariant,
                              ram: e.target.value
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2 col-span-2">
                        <Label>Bộ nhớ</Label>
                        <Input
                          placeholder="256GB"
                          value={tempVariant.storage}
                          onChange={(e) =>
                            setTempVariant({
                              ...tempVariant,
                              storage: e.target.value
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2 col-span-3">
                        <Label>Màu sắc</Label>
                        <Input
                          placeholder="Titan Xanh"
                          value={tempVariant.color}
                          onChange={(e) =>
                            setTempVariant({
                              ...tempVariant,
                              color: e.target.value
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2 col-span-2">
                        <Label>Giá bán</Label>
                        <Input
                          type="number"
                          value={tempVariant.price || ''}
                          onChange={(e) =>
                            setTempVariant({
                              ...tempVariant,
                              price: Number(e.target.value)
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2 col-span-2 flex items-end gap-2">
                        <div>
                          <Label>Kho</Label>
                          <Input
                            type="number"
                            value={tempVariant.stock || ''}
                            onChange={(e) =>
                              setTempVariant({
                                ...tempVariant,
                                stock: Number(e.target.value)
                              })
                            }
                          />
                        </div>
                        <Button
                          onClick={addVariant}
                          variant="secondary"
                          disabled={isUploadingVariant}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">Ảnh</TableHead>
                            <TableHead>RAM/ROM</TableHead>
                            <TableHead>Màu</TableHead>
                            <TableHead>Giá bán</TableHead>
                            <TableHead>Kho</TableHead>
                            <TableHead className="text-right">Xóa</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.variants.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center text-gray-400 h-24"
                              >
                                Chưa có phiên bản nào
                              </TableCell>
                            </TableRow>
                          ) : (
                            formData.variants.map((v, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <div className="w-8 h-8 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                                    {v.image ? (
                                      <img
                                        src={v.image}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <ImageIcon className="w-4 h-4 text-gray-300" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {v.ram} / {v.storage}
                                </TableCell>
                                <TableCell>{v.color}</TableCell>
                                <TableCell className="text-indigo-600 font-bold">
                                  {formatCurrency(v.price)}
                                </TableCell>
                                <TableCell>{v.stock}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeVariant(idx)}
                                    className="text-red-500 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* TAB 4: DETAILS */}
                  <TabsContent value="details" className="space-y-4">
                    <Textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Bài viết đánh giá chi tiết..."
                      className="min-h-[300px]"
                    />
                  </TabsContent>
                </Tabs>
              </ScrollArea>

              <DialogFooter className="px-6 py-4 border-t bg-gray-50">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveProduct}
                  disabled={isSubmitting || isUploading}
                  className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    'Lưu thay đổi'
                  ) : (
                    'Đăng bán'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                              alt={p.title}
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
                            onClick={() => handleEditClick(p)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteProduct(p._id)}
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
    </div>
  )
}
