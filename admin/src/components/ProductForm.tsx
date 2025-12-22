/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  Loader2,
  Image as ImageIcon,
  X,
  UploadCloud,
  Check
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
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
import { toast } from 'sonner'

// --- TYPES ---
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
  brand: string
  image: string
  description: string
  content: string
  stock: number
  specs: TechSpec[]
  variants: TechVariant[]
}

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: any | null
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
    stock: 0,
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

  // Load Data
  useEffect(() => {
    if (open) {
      if (initialData) {
        const brandId =
          initialData.brand && typeof initialData.brand === 'object'
            ? initialData.brand._id
            : initialData.brand || ''

        setFormData({
          ...defaultForm,
          ...initialData,
          brand: brandId,
          stock: initialData.stock || 0,
          specs: initialData.specs || [],
          variants: initialData.variants || []
        })
      } else {
        setFormData(defaultForm)
      }
    }
  }, [open, initialData])

  // Upload Logic
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

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.category) {
      return toast.warning('Vui lòng nhập các thông tin bắt buộc (*)!')
    }
    setIsSubmitting(true)
    await onSubmit(formData)
    setIsSubmitting(false)
  }

  // 👇 ĐÂY LÀ HÀM BỊ THIẾU NÈ
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
      <DialogContent className="sm:max-w-[950px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white sm:rounded-2xl">
        <DialogHeader className="px-6 py-5 border-b flex-none bg-white z-10">
          <DialogTitle className="text-xl font-bold text-slate-800">
            {initialData ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <Tabs defaultValue="general" className="w-full">
            <div className="px-6 pt-4 sticky top-0 z-20 bg-slate-50/50 backdrop-blur-sm pb-2">
              <TabsList className="grid w-full grid-cols-4 bg-slate-200/50 p-1 rounded-xl">
                <TabsTrigger
                  value="general"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-medium transition-all"
                >
                  Cơ bản
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-medium transition-all"
                >
                  Thông số
                </TabsTrigger>
                <TabsTrigger
                  value="variants"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-medium transition-all"
                >
                  Phiên bản
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-medium transition-all"
                >
                  Bài viết
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 py-4">
              {/* TAB 1: CƠ BẢN */}
              <TabsContent value="general" className="space-y-6 mt-0">
                <div className="grid grid-cols-12 gap-6">
                  {/* Cột trái: Ảnh */}
                  <div className="col-span-12 md:col-span-4 space-y-3">
                    <Label className="font-semibold text-slate-700">
                      Ảnh đại diện
                    </Label>
                    <div
                      className="group border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-white transition-all relative overflow-hidden shadow-sm hover:shadow-md"
                      onClick={() =>
                        document.getElementById('file-upload')?.click()
                      }
                    >
                      {formData.image ? (
                        <>
                          <img
                            src={formData.image}
                            className="w-full h-full object-contain p-2"
                            alt="Preview"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-medium flex items-center gap-2">
                              <UploadCloud size={18} /> Thay ảnh
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          {isUploading ? (
                            <Loader2 className="animate-spin text-indigo-600 w-10 h-10 mx-auto mb-2" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                              <ImageIcon className="text-indigo-500 w-6 h-6" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-slate-600 block">
                            Tải ảnh lên
                          </span>
                          <span className="text-xs text-slate-400 mt-1">
                            PNG, JPG tối đa 5MB
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

                  {/* Cột phải: Thông tin */}
                  <div className="col-span-12 md:col-span-8 space-y-5">
                    <div className="grid gap-2">
                      <Label className="font-semibold text-slate-700">
                        Tên sản phẩm <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="VD: iPhone 15 Pro Max 256GB..."
                        className="h-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Danh mục</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(val) =>
                            setFormData({ ...formData, category: val })
                          }
                        >
                          <SelectTrigger className="h-10 border-slate-200">
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

                      <div className="grid gap-2">
                        <Label>Thương hiệu</Label>
                        <Select
                          value={formData.brand}
                          onValueChange={(val) =>
                            setFormData({ ...formData, brand: val })
                          }
                        >
                          <SelectTrigger className="h-10 border-slate-200">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Giá bán */}
                      <div className="grid gap-2 relative">
                        <Label>
                          Giá bán <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                price: Number(e.target.value)
                              })
                            }
                            className="h-10 border-slate-200 pr-12 font-semibold text-indigo-600"
                          />
                          {discountPercent > 0 && (
                            <div className="absolute right-2 top-2">
                              <Badge
                                variant="destructive"
                                className="text-[10px] h-6 px-1.5"
                              >
                                -{discountPercent}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Giá niêm yết */}
                      <div className="grid gap-2">
                        <Label>Giá niêm yết</Label>
                        <Input
                          type="number"
                          value={formData.originalPrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              originalPrice: Number(e.target.value)
                            })
                          }
                          className="h-10 border-slate-200 text-slate-500"
                        />
                      </div>

                      {/* Tồn kho */}
                      <div className="grid gap-2">
                        <Label>
                          Tồn kho{' '}
                          <span className="text-slate-400 font-normal text-xs">
                            (Đơn)
                          </span>
                        </Label>
                        <Input
                          type="number"
                          value={formData.stock}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              stock: Number(e.target.value)
                            })
                          }
                          placeholder="0"
                          className="h-10 border-slate-200 font-medium"
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
                        placeholder="Tóm tắt tính năng nổi bật..."
                        rows={3}
                        className="resize-none border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: SPECS */}
              <TabsContent value="specs" className="space-y-4 mt-0">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-500" /> Thêm thông số
                    mới
                  </h3>
                  <div className="flex gap-4 items-start">
                    <div className="w-1/3 space-y-1.5">
                      <Label className="text-xs text-slate-500">
                        Tên thông số
                      </Label>
                      <Input
                        placeholder="VD: Chipset"
                        value={tempSpec.k}
                        onChange={(e) =>
                          setTempSpec({ ...tempSpec, k: e.target.value })
                        }
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="w-2/3 space-y-1.5">
                      <Label className="text-xs text-slate-500">Chi tiết</Label>
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="VD: Apple A17 Pro 3nm..."
                          value={tempSpec.v}
                          onChange={(e) =>
                            setTempSpec({ ...tempSpec, v: e.target.value })
                          }
                          className="bg-slate-50 border-slate-200 min-h-[42px] py-2 leading-tight"
                          rows={1}
                        />
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
                          className="bg-indigo-600 hover:bg-indigo-700 shrink-0 h-[42px] w-[42px] p-0 rounded-lg"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
                  <div className="bg-slate-50/80 border-b px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">
                      Danh sách thông số ({formData.specs.length})
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[350px]">
                    <table className="w-full text-sm text-left">
                      <thead className="sticky top-0 bg-white z-10 shadow-sm">
                        <tr className="border-b text-xs uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4 w-[30%] bg-slate-50/50">
                            Thông số
                          </th>
                          <th className="py-3 px-4 bg-slate-50/50">Chi tiết</th>
                          <th className="py-3 px-4 w-[50px] text-right bg-slate-50/50"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.specs.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="p-10 text-center text-slate-400"
                            >
                              Chưa có thông số nào được thêm
                            </td>
                          </tr>
                        ) : (
                          formData.specs.map((s, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50/80 transition-colors group"
                            >
                              <td className="p-4 font-medium text-slate-700 align-top">
                                {s.k}
                              </td>
                              <td className="p-4 text-slate-600 align-top whitespace-pre-line leading-relaxed">
                                {s.v}
                              </td>
                              <td className="p-4 text-right align-top">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      specs: formData.specs.filter(
                                        (_, i) => i !== idx
                                      )
                                    })
                                  }
                                  className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
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
                </div>
              </TabsContent>

              {/* TAB 3: VARIANTS */}
              <TabsContent value="variants" className="space-y-4 mt-0">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    {/* Upload ảnh */}
                    <div className="col-span-12 md:col-span-2">
                      <Label className="text-xs text-slate-500 mb-1.5 block">
                        Ảnh màu
                      </Label>
                      <div
                        className="w-full aspect-square border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg flex items-center justify-center cursor-pointer bg-slate-50 transition-colors relative group overflow-hidden"
                        onClick={() =>
                          document
                            .getElementById('variant-file-upload')
                            ?.click()
                        }
                      >
                        {tempVariant.image ? (
                          <>
                            <img
                              src={tempVariant.image}
                              className="w-full h-full object-cover"
                              alt="Variant Preview"
                            />
                            <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center text-white">
                              <Plus size={20} />
                            </div>
                          </>
                        ) : isUploadingVariant ? (
                          <Loader2 className="animate-spin w-5 h-5 text-indigo-500" />
                        ) : (
                          <div className="text-center">
                            <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                          </div>
                        )}
                      </div>
                      <Input
                        id="variant-file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleVariantFileUpload}
                      />
                    </div>

                    {/* Inputs */}
                    <div className="col-span-12 md:col-span-10 grid grid-cols-4 gap-4">
                      <div className="col-span-1">
                        <Label className="text-xs text-slate-500 mb-1.5 block">
                          RAM
                        </Label>
                        <Input
                          value={tempVariant.ram}
                          onChange={(e) =>
                            setTempVariant({
                              ...tempVariant,
                              ram: e.target.value
                            })
                          }
                          placeholder="8GB"
                          className="bg-slate-50 h-9"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs text-slate-500 mb-1.5 block">
                          ROM
                        </Label>
                        <Input
                          value={tempVariant.storage}
                          onChange={(e) =>
                            setTempVariant({
                              ...tempVariant,
                              storage: e.target.value
                            })
                          }
                          placeholder="256GB"
                          className="bg-slate-50 h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-slate-500 mb-1.5 block">
                          Màu sắc
                        </Label>
                        <Input
                          value={tempVariant.color}
                          onChange={(e) =>
                            setTempVariant({
                              ...tempVariant,
                              color: e.target.value
                            })
                          }
                          placeholder="Titan Xanh"
                          className="bg-slate-50 h-9"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label className="text-xs text-slate-500 mb-1.5 block">
                          Giá bán thêm
                        </Label>
                        <Input
                          type="number"
                          value={tempVariant.price || ''}
                          onChange={(e) =>
                            setTempVariant({
                              ...tempVariant,
                              price: Number(e.target.value)
                            })
                          }
                          className="bg-slate-50 h-9 font-medium"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs text-slate-500 mb-1.5 block">
                          Kho
                        </Label>
                        <Input
                          type="number"
                          value={tempVariant.stock || ''}
                          onChange={(e) =>
                            setTempVariant({
                              ...tempVariant,
                              stock: Number(e.target.value)
                            })
                          }
                          className="bg-slate-50 h-9"
                        />
                      </div>

                      <div className="col-span-1">
                        <Label className="text-xs text-transparent mb-1.5 block">
                          Add
                        </Label>
                        <Button
                          onClick={() => {
                            if (!tempVariant.price)
                              return toast.warning('Nhập giá bán')
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
                          className="w-full bg-indigo-600 hover:bg-indigo-700 h-9"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
                  <div className="bg-slate-50/80 border-b px-4 py-3">
                    <span className="text-sm font-semibold text-slate-700">
                      Danh sách phiên bản ({formData.variants.length})
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[350px]">
                    <table className="w-full text-sm text-left">
                      <thead className="sticky top-0 bg-white z-10 shadow-sm">
                        <tr className="border-b text-xs uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4 w-[60px] bg-slate-50/50">
                            Ảnh
                          </th>
                          <th className="py-3 px-4 bg-slate-50/50">Cấu hình</th>
                          <th className="py-3 px-4 bg-slate-50/50">Màu sắc</th>
                          <th className="py-3 px-4 bg-slate-50/50">Giá bán</th>
                          <th className="py-3 px-4 bg-slate-50/50">Kho</th>
                          <th className="py-3 px-4 text-right bg-slate-50/50"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.variants.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="p-10 text-center text-slate-400"
                            >
                              Chưa có phiên bản nào
                            </td>
                          </tr>
                        ) : (
                          formData.variants.map((v, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50/80 transition-colors group"
                            >
                              <td className="p-3">
                                <div className="w-10 h-10 rounded-lg border bg-white flex items-center justify-center overflow-hidden">
                                  {v.image ? (
                                    <img
                                      src={v.image}
                                      className="w-full h-full object-cover"
                                      alt=""
                                    />
                                  ) : (
                                    <ImageIcon className="w-4 h-4 text-slate-300" />
                                  )}
                                </div>
                              </td>
                              <td className="p-3 font-medium text-slate-700">
                                {v.ram} / {v.storage}
                              </td>
                              <td className="p-3 text-slate-600">
                                <Badge
                                  variant="outline"
                                  className="font-normal bg-white"
                                >
                                  {v.color}
                                </Badge>
                              </td>
                              <td className="p-3 font-semibold text-indigo-600">
                                {formatCurrency(v.price)}
                              </td>
                              <td className="p-3 text-slate-600">{v.stock}</td>
                              <td className="p-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      variants: formData.variants.filter(
                                        (_, i) => i !== idx
                                      )
                                    })
                                  }
                                  className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
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
                </div>
              </TabsContent>

              {/* TAB 4: DETAILS */}
              <TabsContent value="details" className="space-y-4 mt-0">
                <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm h-[500px]">
                  <Textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Viết bài đánh giá chi tiết sản phẩm tại đây..."
                    className="w-full h-full border-0 focus-visible:ring-0 resize-none p-4 text-base leading-relaxed"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-white flex-none z-30">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-6 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="h-10 px-8 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {initialData ? 'Lưu thay đổi' : 'Đăng bán ngay'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
