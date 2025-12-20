/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  Loader2,
  Image as ImageIcon,
  X,
  MoreHorizontal,
  UploadCloud
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { toast } from 'sonner'

// --- TYPES (Export để file cha dùng) ---
export interface TechVariant {
  ram: string
  storage: string
  color: string
  price: number
  stock: number
  image?: string
}

export interface TechSpec {
  k: string
  v: string
}

export interface ProductFormData {
  _id?: string
  title: string
  originalPrice: number
  price: number
  category: string
  brand: string // Luôn lưu ID brand dưới dạng string
  image: string
  description: string
  content: string
  specs: TechSpec[]
  variants: TechVariant[]
}

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: any | null // Dữ liệu sản phẩm cần sửa (nếu có)
  categories: any[]
  brands: any[]
  onSubmit: (data: ProductFormData) => Promise<void>
}

export function ProductForm({
  open,
  onOpenChange,
  initialData,
  categories,
  brands,
  onSubmit
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingVariant, setIsUploadingVariant] = useState(false)

  // Form State
  const defaultForm: ProductFormData = {
    title: '',
    originalPrice: 0,
    price: 0,
    category: '',
    brand: '',
    image: '',
    description: '',
    content: '',
    specs: [],
    variants: []
  }

  const [formData, setFormData] = useState<ProductFormData>(defaultForm)

  // Temp State
  const [tempVariant, setTempVariant] = useState<TechVariant>({
    ram: '',
    storage: '',
    color: '',
    price: 0,
    stock: 0,
    image: ''
  })
  const [tempSpec, setTempSpec] = useState<TechSpec>({ k: '', v: '' })

  // --- EFFECT: LOAD DATA KHI MỞ FORM SỬA ---
  useEffect(() => {
    if (open) {
      if (initialData) {
        // 🔥 FIX LỖI MẤT THƯƠNG HIỆU:
        // Kiểm tra xem brand là object (đã populate) hay string ID
        const brandId =
          initialData.brand && typeof initialData.brand === 'object'
            ? initialData.brand._id
            : initialData.brand || ''

        setFormData({
          ...defaultForm,
          ...initialData,
          brand: brandId, // Luôn ép về string ID để Select nhận diện
          specs: initialData.specs || [],
          variants: initialData.variants || []
        })
      } else {
        setFormData(defaultForm) // Reset form khi thêm mới
      }
    }
  }, [open, initialData])

  // --- UPLOAD ---
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
    e.target.value = ''
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
    e.target.value = ''
    setIsUploadingVariant(true)
    await uploadToCloudinary(
      file,
      (url) => setTempVariant({ ...tempVariant, image: url }),
      () => setIsUploadingVariant(false)
    )
  }

  // --- LOGIC ---
  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.category) {
      return toast.warning('Vui lòng nhập các thông tin bắt buộc (*)!')
    }
    setIsSubmitting(true)
    await onSubmit(formData)
    setIsSubmitting(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[950px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
        <DialogHeader className="px-6 py-4 border-b flex-none">
          <DialogTitle>
            {initialData ? 'Cập nhật thiết bị' : 'Thêm thiết bị mới'}
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin chi tiết, thông số và các phiên bản.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 sticky top-0 z-20 bg-white/95 backdrop-blur shadow-sm">
              <TabsTrigger value="general">Cơ bản</TabsTrigger>
              <TabsTrigger value="specs">Thông số KT</TabsTrigger>
              <TabsTrigger value="variants">Phiên bản & Giá</TabsTrigger>
              <TabsTrigger value="details">Bài viết</TabsTrigger>
            </TabsList>

            {/* TAB 1: CƠ BẢN */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Ảnh */}
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

                {/* Thông tin */}
                <div className="col-span-2 space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-red-500">Tên thiết bị *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
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

                    {/* SELECT BRAND - Đã Fix */}
                    <div className="grid gap-2">
                      <Label>Thương hiệu</Label>
                      <Select
                        value={formData.brand}
                        onValueChange={(val) =>
                          setFormData({ ...formData, brand: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn thương hiệu" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((b) => (
                            <SelectItem key={b._id} value={b._id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                            price: Number(e.target.value)
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
                    <div className="grid gap-2">
                      <Label>Giá gốc (Niêm yết)</Label>
                      <Input
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            originalPrice: Number(e.target.value)
                          })
                        }
                      />
                    </div>
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

            {/* TAB 2: SPECS (Đã tối ưu UI) */}
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
                  onClick={() => {
                    if (!tempSpec.k || !tempSpec.v)
                      return toast.warning('Nhập đủ thông tin')
                    setFormData({
                      ...formData,
                      specs: [...formData.specs, tempSpec]
                    })
                    setTempSpec({ k: '', v: '' })
                  }}
                  variant="secondary"
                  className="mt-8"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="border rounded-md h-[350px] overflow-y-auto relative scroll-smooth">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b">
                      <th className="h-12 px-4 font-medium text-muted-foreground w-[150px]">
                        Thông số
                      </th>
                      <th className="h-12 px-4 font-medium text-muted-foreground">
                        Chi tiết
                      </th>
                      <th className="h-12 px-4 font-medium text-muted-foreground text-right w-[80px]">
                        Xóa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.specs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="p-4 text-center text-gray-400 h-24"
                        >
                          Chưa có thông số nào
                        </td>
                      </tr>
                    ) : (
                      formData.specs.map((s, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium bg-gray-50 align-top">
                            {s.k}
                          </td>
                          <td className="p-4 align-top">
                            {s.v.length > 80 ? (
                              <div className="flex items-start gap-2">
                                <span className="flex-1 line-clamp-2">
                                  {s.v}
                                </span>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-4 text-sm bg-white border">
                                    <p className="font-bold mb-1">{s.k}</p>
                                    <p>{s.v}</p>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            ) : (
                              <span>{s.v}</span>
                            )}
                          </td>
                          <td className="p-4 text-right align-top">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  specs: formData.specs.filter(
                                    (_, i) => i !== idx
                                  )
                                })
                              }
                              className="text-red-500 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* TAB 3: VARIANTS */}
            <TabsContent value="variants" className="space-y-4">
              {/* Form nhập variant (Rút gọn cho code ngắn) */}
              <div className="grid grid-cols-12 gap-2 items-end bg-slate-50 p-3 rounded-lg border">
                {/* ...Input Image, RAM, ROM, Color, Price... (Giống logic cũ) */}
                <div
                  className="col-span-1"
                  onClick={() =>
                    document.getElementById('variant-file-upload')?.click()
                  }
                >
                  <div className="w-full aspect-square border-2 border-dashed rounded bg-white flex items-center justify-center cursor-pointer">
                    {tempVariant.image ? (
                      <img
                        src={tempVariant.image}
                        className="w-full h-full object-cover"
                      />
                    ) : isUploadingVariant ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <Input
                    id="variant-file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleVariantFileUpload}
                  />
                </div>
                <div className="col-span-2">
                  <Label>RAM</Label>
                  <Input
                    value={tempVariant.ram}
                    onChange={(e) =>
                      setTempVariant({ ...tempVariant, ram: e.target.value })
                    }
                    placeholder="8GB"
                  />
                </div>
                <div className="col-span-2">
                  <Label>ROM</Label>
                  <Input
                    value={tempVariant.storage}
                    onChange={(e) =>
                      setTempVariant({
                        ...tempVariant,
                        storage: e.target.value
                      })
                    }
                    placeholder="256GB"
                  />
                </div>
                <div className="col-span-3">
                  <Label>Màu</Label>
                  <Input
                    value={tempVariant.color}
                    onChange={(e) =>
                      setTempVariant({ ...tempVariant, color: e.target.value })
                    }
                    placeholder="Titan"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Giá</Label>
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
                <div className="col-span-2 flex items-end gap-2">
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
                    onClick={() => {
                      if (!tempVariant.price) return toast.warning('Nhập giá')
                      setFormData({
                        ...formData,
                        variants: [...formData.variants, tempVariant]
                      })
                      setTempVariant({
                        ram: '',
                        storage: '',
                        color: '',
                        price: 0,
                        stock: 0,
                        image: ''
                      })
                    }}
                    variant="secondary"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="border rounded-md h-[350px] overflow-y-auto relative scroll-smooth">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b">
                      <th className="h-12 px-4 font-medium text-muted-foreground w-[60px]">
                        Ảnh
                      </th>
                      <th className="h-12 px-4 font-medium text-muted-foreground">
                        RAM/ROM
                      </th>
                      <th className="h-12 px-4 font-medium text-muted-foreground">
                        Màu
                      </th>
                      <th className="h-12 px-4 font-medium text-muted-foreground">
                        Giá
                      </th>
                      <th className="h-12 px-4 font-medium text-muted-foreground">
                        Kho
                      </th>
                      <th className="h-12 px-4 font-medium text-muted-foreground text-right">
                        Xóa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.variants.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-4 text-center text-gray-400 h-24"
                        >
                          Chưa có phiên bản nào
                        </td>
                      </tr>
                    ) : (
                      formData.variants.map((v, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="w-8 h-8 border rounded overflow-hidden">
                              {v.image ? (
                                <img
                                  src={v.image}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4 m-auto text-gray-300" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-medium">
                            {v.ram} / {v.storage}
                          </td>
                          <td className="p-4">{v.color}</td>
                          <td className="p-4 text-indigo-600 font-bold">
                            {formatCurrency(v.price)}
                          </td>
                          <td className="p-4">{v.stock}</td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  variants: formData.variants.filter(
                                    (_, i) => i !== idx
                                  )
                                })
                              }
                              className="text-red-500 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex-none z-50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : initialData ? (
              'Lưu thay đổi'
            ) : (
              'Đăng bán'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
