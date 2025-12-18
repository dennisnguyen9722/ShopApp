/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Megaphone,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Image as ImageIcon,
  Ticket,
  Calendar,
  ToggleLeft,
  ToggleRight,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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

// --- TYPES ---
interface Banner {
  _id: string
  title: string
  image: string
  link: string
  isActive: boolean
  order: number
}

interface Voucher {
  _id: string
  code: string
  discountType: 'percent' | 'amount'
  discountValue: number
  minOrderValue: number
  maxDiscount?: number
  startDate: string
  endDate: string
  usageLimit: number
  usedCount: number
  isActive: boolean
}

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('banners')
  const [loading, setLoading] = useState(false)

  // Data State
  const [banners, setBanners] = useState<Banner[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])

  // Modal State
  const [isBannerOpen, setIsBannerOpen] = useState(false)
  const [isVoucherOpen, setIsVoucherOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form Data
  const [bannerForm, setBannerForm] = useState({
    title: '',
    image: '',
    link: '',
    isActive: true,
    order: 0
  })
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    isActive: true
  })

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true)
    try {
      const [resBanners, resVouchers] = await Promise.all([
        axiosClient.get('/banners'),
        axiosClient.get('/vouchers')
      ])
      setBanners(resBanners.data)
      setVouchers(resVouchers.data)
    } catch (error) {
      toast.error('Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- HANDLERS BANNER ---
  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const data = new FormData()
    data.append('file', file)
    data.append(
      'upload_preset',
      process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'supermall_preset'
    )
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: data }
      )
      const json = await res.json()
      setBannerForm({ ...bannerForm, image: json.secure_url })
    } catch {
      toast.error('Upload lỗi')
    } finally {
      setIsUploading(false)
    }
  }

  const submitBanner = async () => {
    if (!bannerForm.image) return toast.warning('Vui lòng chọn ảnh!')
    setIsSubmitting(true)
    try {
      if (editingId) await axiosClient.put(`/banners/${editingId}`, bannerForm)
      else await axiosClient.post('/banners', bannerForm)
      toast.success('Lưu banner thành công!')
      setIsBannerOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Xóa banner này?')) return
    await axiosClient.delete(`/banners/${id}`)
    fetchData()
  }

  // --- HANDLERS VOUCHER ---
  const submitVoucher = async () => {
    if (!voucherForm.code || !voucherForm.startDate || !voucherForm.endDate)
      return toast.warning('Nhập đủ thông tin!')
    setIsSubmitting(true)
    try {
      if (editingId)
        await axiosClient.put(`/vouchers/${editingId}`, voucherForm)
      else await axiosClient.post('/vouchers', voucherForm)
      toast.success('Lưu voucher thành công!')
      setIsVoucherOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteVoucher = async (id: string) => {
    if (!confirm('Xóa voucher này?')) return
    await axiosClient.delete(`/vouchers/${id}`)
    fetchData()
  }

  // --- HELPERS ---
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)

  const openEditBanner = (b: Banner) => {
    setEditingId(b._id)
    setBannerForm({
      title: b.title,
      image: b.image,
      link: b.link,
      isActive: b.isActive,
      order: b.order
    })
    setIsBannerOpen(true)
  }
  const openNewBanner = () => {
    setEditingId(null)
    setBannerForm({ title: '', image: '', link: '', isActive: true, order: 0 })
    setIsBannerOpen(true)
  }

  const openEditVoucher = (v: Voucher) => {
    setEditingId(v._id)
    setVoucherForm({
      code: v.code,
      discountType: v.discountType,
      discountValue: v.discountValue,
      minOrderValue: v.minOrderValue,
      maxDiscount: v.maxDiscount || 0,
      startDate: v.startDate.split('T')[0],
      endDate: v.endDate.split('T')[0],
      usageLimit: v.usageLimit,
      isActive: v.isActive
    })
    setIsVoucherOpen(true)
  }
  const openNewVoucher = () => {
    setEditingId(null)
    setVoucherForm({
      code: '',
      discountType: 'percent',
      discountValue: 10,
      minOrderValue: 0,
      maxDiscount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      usageLimit: 100,
      isActive: true
    })
    setIsVoucherOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Megaphone className="w-6 h-6 text-indigo-600" /> Marketing & Khuyến
            Mãi
          </h2>
          <p className="text-gray-500">
            Quản lý banner quảng cáo và mã giảm giá
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="banners"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="banners">Banners (Slider)</TabsTrigger>
          <TabsTrigger value="vouchers">Mã Giảm Giá</TabsTrigger>
        </TabsList>

        {/* --- TAB BANNERS --- */}
        <TabsContent value="banners" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Danh sách Banner</CardTitle>
              <Button
                onClick={openNewBanner}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Thêm Banner
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Hình ảnh</TableHead>
                      <TableHead>Tiêu đề / Link</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((b) => (
                      <TableRow key={b._id}>
                        <TableCell>
                          <div className="w-32 h-16 bg-gray-100 rounded overflow-hidden border">
                            <img
                              src={b.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {b.title || 'Không có tiêu đề'}
                          </p>
                          <p className="text-xs text-blue-500 truncate max-w-[200px]">
                            {b.link}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          {b.isActive ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Hiển thị
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Đang ẩn</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditBanner(b)}
                          >
                            <Pencil className="w-4 h-4 text-indigo-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteBanner(b._id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB VOUCHERS --- */}
        <TabsContent value="vouchers" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Danh sách Voucher</CardTitle>
              <Button
                onClick={openNewVoucher}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Tạo Mã Mới
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Mã Code</TableHead>
                      <TableHead>Giảm giá</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Lượt dùng</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vouchers.map((v) => (
                      <TableRow key={v._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-indigo-600" />
                            <span className="font-bold text-gray-800">
                              {v.code}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-green-600">
                            Giảm{' '}
                            {v.discountType === 'percent'
                              ? `${v.discountValue}%`
                              : formatCurrency(v.discountValue)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Đơn min: {formatCurrency(v.minOrderValue)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>
                              Từ:{' '}
                              {new Date(v.startDate).toLocaleDateString(
                                'vi-VN'
                              )}
                            </p>
                            <p>
                              Đến:{' '}
                              {new Date(v.endDate).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {v.usedCount} / {v.usageLimit}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {v.isActive ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Hoạt động
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Đã tắt</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditVoucher(v)}
                          >
                            <Pencil className="w-4 h-4 text-indigo-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteVoucher(v._id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODAL BANNER --- */}
      <Dialog open={isBannerOpen} onOpenChange={setIsBannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Sửa Banner' : 'Thêm Banner Mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Tiêu đề</Label>
              <Input
                value={bannerForm.title}
                onChange={(e) =>
                  setBannerForm({ ...bannerForm, title: e.target.value })
                }
                placeholder="VD: Khuyến mãi mùa hè"
              />
            </div>
            <div className="grid gap-2">
              <Label>Hình ảnh</Label>
              <Input
                type="file"
                onChange={handleUploadBanner}
                disabled={isUploading}
              />
              {bannerForm.image && (
                <img
                  src={bannerForm.image}
                  className="w-full h-32 object-cover rounded border mt-2"
                />
              )}
            </div>
            <div className="grid gap-2">
              <Label>Link liên kết (Tùy chọn)</Label>
              <Input
                value={bannerForm.link}
                onChange={(e) =>
                  setBannerForm({ ...bannerForm, link: e.target.value })
                }
                placeholder="/products/iphone-15"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active-bn"
                checked={bannerForm.isActive}
                onCheckedChange={(c) =>
                  setBannerForm({ ...bannerForm, isActive: c })
                }
              />
              <Label htmlFor="active-bn">Hiển thị ngay</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBannerOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={submitBanner}
              disabled={isSubmitting || isUploading}
              className="bg-indigo-600"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL VOUCHER --- */}
      <Dialog open={isVoucherOpen} onOpenChange={setIsVoucherOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Sửa Mã Giảm Giá' : 'Tạo Mã Giảm Giá'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 grid gap-2">
              <Label>
                Mã Code <span className="text-red-500">*</span>
              </Label>
              <Input
                value={voucherForm.code}
                onChange={(e) =>
                  setVoucherForm({
                    ...voucherForm,
                    code: e.target.value.toUpperCase()
                  })
                }
                placeholder="VD: SALE50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Loại giảm</Label>
              <Select
                value={voucherForm.discountType}
                onValueChange={(v: any) =>
                  setVoucherForm({ ...voucherForm, discountType: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Theo %</SelectItem>
                  <SelectItem value="amount">Số tiền (VNĐ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Giá trị giảm</Label>
              <Input
                type="number"
                value={voucherForm.discountValue}
                onChange={(e) =>
                  setVoucherForm({
                    ...voucherForm,
                    discountValue: Number(e.target.value)
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Đơn tối thiểu</Label>
              <Input
                type="number"
                value={voucherForm.minOrderValue}
                onChange={(e) =>
                  setVoucherForm({
                    ...voucherForm,
                    minOrderValue: Number(e.target.value)
                  })
                }
              />
            </div>
            {voucherForm.discountType === 'percent' && (
              <div className="grid gap-2">
                <Label>Giảm tối đa</Label>
                <Input
                  type="number"
                  value={voucherForm.maxDiscount}
                  onChange={(e) =>
                    setVoucherForm({
                      ...voucherForm,
                      maxDiscount: Number(e.target.value)
                    })
                  }
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Ngày bắt đầu</Label>
              <Input
                type="date"
                value={voucherForm.startDate}
                onChange={(e) =>
                  setVoucherForm({ ...voucherForm, startDate: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={voucherForm.endDate}
                onChange={(e) =>
                  setVoucherForm({ ...voucherForm, endDate: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Giới hạn lượt dùng</Label>
              <Input
                type="number"
                value={voucherForm.usageLimit}
                onChange={(e) =>
                  setVoucherForm({
                    ...voucherForm,
                    usageLimit: Number(e.target.value)
                  })
                }
              />
            </div>
            <div className="flex items-center space-x-2 mt-8">
              <Switch
                id="active-vc"
                checked={voucherForm.isActive}
                onCheckedChange={(c) =>
                  setVoucherForm({ ...voucherForm, isActive: c })
                }
              />
              <Label htmlFor="active-vc">Kích hoạt mã</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVoucherOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={submitVoucher}
              disabled={isSubmitting}
              className="bg-indigo-600"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Voucher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
