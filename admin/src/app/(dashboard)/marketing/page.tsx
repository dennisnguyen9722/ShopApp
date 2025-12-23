/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  Megaphone,
  Plus,
  Trash2,
  Pencil,
  Ticket,
  Search,
  Loader2,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

  // --- DATA STATE ---
  const [banners, setBanners] = useState<Banner[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])

  // --- PAGINATION & SEARCH: BANNER ---
  const [bannerPage, setBannerPage] = useState(1)
  const [bannerLimit, setBannerLimit] = useState(5) // Thêm limit
  const [bannerTotalPages, setBannerTotalPages] = useState(1)
  const [bannerTotalDocs, setBannerTotalDocs] = useState(0)
  const [bannerSearch, setBannerSearch] = useState('')
  const [bannerSearchTerm, setBannerSearchTerm] = useState('')

  // --- PAGINATION & SEARCH: VOUCHER ---
  const [voucherPage, setVoucherPage] = useState(1)
  const [voucherLimit, setVoucherLimit] = useState(5) // Thêm limit
  const [voucherTotalPages, setVoucherTotalPages] = useState(1)
  const [voucherTotalDocs, setVoucherTotalDocs] = useState(0)
  const [voucherSearch, setVoucherSearch] = useState('')
  const [voucherSearchTerm, setVoucherSearchTerm] = useState('')

  // --- MODAL STATE ---
  const [isBannerOpen, setIsBannerOpen] = useState(false)
  const [isVoucherOpen, setIsVoucherOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // --- FORM DATA ---
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

  // ========================================================================
  // 1. FETCH API
  // ========================================================================

  const fetchBanners = async () => {
    try {
      const { data } = await axiosClient.get('/banners', {
        params: {
          page: bannerPage,
          limit: bannerLimit, // Dùng state limit
          search: bannerSearchTerm
        }
      })
      if (data.banners) {
        setBanners(data.banners)
        setBannerTotalPages(data.pagination?.totalPages || 1)
        setBannerTotalDocs(data.pagination?.total || 0)
      } else {
        setBanners(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error(error)
      toast.error('Lỗi tải banner')
    }
  }

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const { data } = await axiosClient.get('/vouchers', {
        params: {
          page: voucherPage,
          limit: voucherLimit, // Dùng state limit
          search: voucherSearchTerm
        }
      })

      if (data.vouchers) {
        setVouchers(data.vouchers)
        setVoucherTotalPages(data.pagination?.totalPages || 1)
        setVoucherTotalDocs(data.pagination?.total || 0)
      } else {
        setVouchers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error(error)
      toast.error('Lỗi tải voucher')
    } finally {
      setLoading(false)
    }
  }

  // ========================================================================
  // 2. USE EFFECTS
  // ========================================================================

  useEffect(() => {
    fetchBanners()
  }, [bannerPage, bannerLimit, bannerSearchTerm])
  useEffect(() => {
    fetchVouchers()
  }, [voucherPage, voucherLimit, voucherSearchTerm])

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setBannerPage(1)
      setBannerSearchTerm(bannerSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [bannerSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      setVoucherPage(1)
      setVoucherSearchTerm(voucherSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [voucherSearch])

  // ========================================================================
  // 3. HANDLERS (GIỮ NGUYÊN)
  // ========================================================================

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
      fetchBanners()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Xóa banner này?')) return
    await axiosClient.delete(`/banners/${id}`)
    toast.success('Đã xóa')
    fetchBanners()
  }

  const toggleBannerStatus = async (banner: Banner) => {
    try {
      await axiosClient.put(`/banners/${banner._id}`, {
        isActive: !banner.isActive
      })
      fetchBanners()
      toast.success('Đã cập nhật trạng thái')
    } catch {
      toast.error('Lỗi cập nhật')
    }
  }

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
      fetchVouchers()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteVoucher = async (id: string) => {
    if (!confirm('Xóa voucher này?')) return
    await axiosClient.delete(`/vouchers/${id}`)
    toast.success('Đã xóa')
    fetchVouchers()
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)

  const openEditBanner = (b: Banner) => {
    setEditingId(b._id)
    setBannerForm({ ...b })
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
      ...v,
      startDate: v.startDate.split('T')[0],
      endDate: v.endDate.split('T')[0],
      maxDiscount: v.maxDiscount || 0
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
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 p-6 sm:p-8 border border-indigo-100/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Marketing & Khuyến Mãi
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Quản lý Banner quảng cáo và Mã giảm giá (Voucher)
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs
          defaultValue="banners"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="mb-6">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-slate-100 p-1 rounded-xl">
              <TabsTrigger
                value="banners"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-medium transition-all"
              >
                Banners (Slider)
              </TabsTrigger>
              <TabsTrigger
                value="vouchers"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-medium transition-all"
              >
                Mã Giảm Giá
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ==================== TAB 1: BANNERS ==================== */}
          <TabsContent value="banners" className="mt-0 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm banner..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  value={bannerSearch}
                  onChange={(e) => setBannerSearch(e.target.value)}
                />
              </div>
              <Button
                onClick={openNewBanner}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:scale-105 px-6 py-6"
              >
                <Plus className="w-5 h-5 mr-2" /> Thêm Banner
              </Button>
            </div>

            <Card className="shadow-xl border-indigo-100/20 overflow-hidden rounded-2xl border-none p-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                      <TableRow>
                        <TableHead className="p-4 font-bold text-slate-700">
                          Hình ảnh
                        </TableHead>
                        <TableHead className="p-4 font-bold text-slate-700">
                          Tiêu đề / Link
                        </TableHead>
                        <TableHead className="p-4 font-bold text-slate-700 text-center">
                          Thứ tự
                        </TableHead>
                        <TableHead className="p-4 font-bold text-slate-700 text-center">
                          Hiển thị
                        </TableHead>
                        <TableHead className="p-4 font-bold text-slate-700 text-right">
                          Hành động
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {banners.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center h-40 text-slate-500"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <ImageIcon className="w-8 h-8 text-slate-300" />
                              <p>Không tìm thấy banner nào</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        banners.map((b) => (
                          <TableRow
                            key={b._id}
                            className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors"
                          >
                            <TableCell className="p-4">
                              <div className="w-32 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                                <img
                                  src={b.image}
                                  className="w-full h-full object-cover"
                                  alt="banner"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="p-4">
                              <p className="font-bold text-slate-900">
                                {b.title || 'Không tiêu đề'}
                              </p>
                              <p className="text-xs text-indigo-500 truncate max-w-[250px] font-mono mt-1 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                                {b.link || '#'}
                              </p>
                            </TableCell>
                            <TableCell className="p-4 text-center">
                              <Badge
                                variant="outline"
                                className="font-mono text-slate-600 bg-slate-50"
                              >
                                {b.order}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-4 text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={b.isActive}
                                  onCheckedChange={() => toggleBannerStatus(b)}
                                  className="data-[state=checked]:bg-emerald-500"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditBanner(b)}
                                  className="hover:bg-indigo-100 text-indigo-600 rounded-lg"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteBanner(b._id)}
                                  className="hover:bg-red-100 text-red-600 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* BANNER PAGINATION */}
                <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 font-medium">
                        Hiển thị
                      </span>
                      <select
                        value={bannerLimit}
                        onChange={(e) => {
                          setBannerLimit(Number(e.target.value))
                          setBannerPage(1)
                        }}
                        className="px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-indigo-400 outline-none font-medium bg-white"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                      <span className="text-sm text-slate-600">
                        trên tổng {bannerTotalDocs} banner
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setBannerPage(1)}
                        disabled={bannerPage === 1}
                        variant="outline"
                        size="sm"
                        className="font-medium bg-white"
                      >
                        Đầu
                      </Button>
                      <Button
                        onClick={() => setBannerPage((p) => Math.max(p - 1, 1))}
                        disabled={bannerPage === 1}
                        variant="outline"
                        size="sm"
                        className="font-medium bg-white"
                      >
                        Trước
                      </Button>
                      <div className="flex gap-1">
                        {Array.from(
                          { length: Math.min(bannerTotalPages, 5) },
                          (_, i) => {
                            let pageNum
                            if (bannerTotalPages <= 5) pageNum = i + 1
                            else if (bannerPage <= 3) pageNum = i + 1
                            else if (bannerPage >= bannerTotalPages - 2)
                              pageNum = bannerTotalPages - 4 + i
                            else pageNum = bannerPage - 2 + i
                            return (
                              <Button
                                key={i}
                                onClick={() => setBannerPage(pageNum)}
                                variant={
                                  bannerPage === pageNum ? 'default' : 'outline'
                                }
                                size="sm"
                                className={
                                  bannerPage === pageNum
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                    : 'bg-white'
                                }
                              >
                                {pageNum}
                              </Button>
                            )
                          }
                        )}
                      </div>
                      <Button
                        onClick={() =>
                          setBannerPage((p) =>
                            Math.min(p + 1, bannerTotalPages)
                          )
                        }
                        disabled={bannerPage === bannerTotalPages}
                        variant="outline"
                        size="sm"
                        className="font-medium bg-white"
                      >
                        Sau
                      </Button>
                      <Button
                        onClick={() => setBannerPage(bannerTotalPages)}
                        disabled={bannerPage === bannerTotalPages}
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
          </TabsContent>

          {/* ==================== TAB 2: VOUCHERS ==================== */}
          <TabsContent value="vouchers" className="mt-0 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã Voucher..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  value={voucherSearch}
                  onChange={(e) => setVoucherSearch(e.target.value)}
                />
              </div>
              <Button
                onClick={openNewVoucher}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:scale-105 px-6 py-6"
              >
                <Plus className="w-5 h-5 mr-2" /> Tạo Mã Mới
              </Button>
            </div>

            <Card className="shadow-xl border-indigo-100/20 overflow-hidden rounded-2xl border-none p-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                      <TableRow>
                        <TableHead className="p-4 font-bold text-slate-700">
                          Mã Code
                        </TableHead>
                        <TableHead className="p-4 font-bold text-slate-700">
                          Giảm giá
                        </TableHead>
                        <TableHead className="p-4 font-bold text-slate-700">
                          Thời gian
                        </TableHead>
                        <TableHead className="p-4 font-bold text-slate-700 text-center">
                          Lượt dùng
                        </TableHead>
                        <TableHead className="p-4 font-bold text-slate-700 text-center">
                          Trạng thái
                        </TableHead>
                        <TableHead className="p-4 font-bold text-slate-700 text-right">
                          Hành động
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-40">
                            <div className="flex justify-center">
                              <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : vouchers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center h-40 text-slate-500"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Ticket className="w-8 h-8 text-slate-300" />
                              <p>Không tìm thấy voucher nào</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        vouchers.map((v) => (
                          <TableRow
                            key={v._id}
                            className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors"
                          >
                            <TableCell className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                  <Ticket className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-slate-800 text-base">
                                  {v.code}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="p-4">
                              <p className="font-bold text-emerald-600 text-lg">
                                {v.discountType === 'percent'
                                  ? `-${v.discountValue}%`
                                  : `-${formatCurrency(v.discountValue)}`}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Đơn tối thiểu: {formatCurrency(v.minOrderValue)}
                              </p>
                            </TableCell>
                            <TableCell className="p-4">
                              <div className="text-xs text-slate-600 space-y-1 font-medium">
                                <p className="flex items-center gap-1">
                                  <span className="text-slate-400 w-8">
                                    Từ:
                                  </span>
                                  {new Date(v.startDate).toLocaleDateString(
                                    'vi-VN'
                                  )}
                                </p>
                                <p className="flex items-center gap-1">
                                  <span className="text-slate-400 w-8">
                                    Đến:
                                  </span>
                                  {new Date(v.endDate).toLocaleDateString(
                                    'vi-VN'
                                  )}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="p-4 text-center">
                              <Badge
                                variant="outline"
                                className="font-mono bg-slate-50"
                              >
                                {v.usedCount} / {v.usageLimit}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-4 text-center">
                              {v.isActive ? (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                                  Hoạt động
                                </Badge>
                              ) : (
                                <Badge
                                  variant="destructive"
                                  className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                                >
                                  Đã tắt
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditVoucher(v)}
                                  className="hover:bg-indigo-100 text-indigo-600 rounded-lg"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteVoucher(v._id)}
                                  className="hover:bg-red-100 text-red-600 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* VOUCHER PAGINATION */}
                <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 font-medium">
                        Hiển thị
                      </span>
                      <select
                        value={voucherLimit}
                        onChange={(e) => {
                          setVoucherLimit(Number(e.target.value))
                          setVoucherPage(1)
                        }}
                        className="px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-indigo-400 outline-none font-medium bg-white"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                      <span className="text-sm text-slate-600">
                        trên tổng {voucherTotalDocs} voucher
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setVoucherPage(1)}
                        disabled={voucherPage === 1}
                        variant="outline"
                        size="sm"
                        className="font-medium bg-white"
                      >
                        Đầu
                      </Button>
                      <Button
                        onClick={() =>
                          setVoucherPage((p) => Math.max(p - 1, 1))
                        }
                        disabled={voucherPage === 1}
                        variant="outline"
                        size="sm"
                        className="font-medium bg-white"
                      >
                        Trước
                      </Button>
                      <div className="flex gap-1">
                        {Array.from(
                          { length: Math.min(voucherTotalPages, 5) },
                          (_, i) => {
                            let pageNum
                            if (voucherTotalPages <= 5) pageNum = i + 1
                            else if (voucherPage <= 3) pageNum = i + 1
                            else if (voucherPage >= voucherTotalPages - 2)
                              pageNum = voucherTotalPages - 4 + i
                            else pageNum = voucherPage - 2 + i
                            return (
                              <Button
                                key={i}
                                onClick={() => setVoucherPage(pageNum)}
                                variant={
                                  voucherPage === pageNum
                                    ? 'default'
                                    : 'outline'
                                }
                                size="sm"
                                className={
                                  voucherPage === pageNum
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                    : 'bg-white'
                                }
                              >
                                {pageNum}
                              </Button>
                            )
                          }
                        )}
                      </div>
                      <Button
                        onClick={() =>
                          setVoucherPage((p) =>
                            Math.min(p + 1, voucherTotalPages)
                          )
                        }
                        disabled={voucherPage === voucherTotalPages}
                        variant="outline"
                        size="sm"
                        className="font-medium bg-white"
                      >
                        Sau
                      </Button>
                      <Button
                        onClick={() => setVoucherPage(voucherTotalPages)}
                        disabled={voucherPage === voucherTotalPages}
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
          </TabsContent>
        </Tabs>

        {/* MODALS giữ nguyên */}
        <Dialog open={isBannerOpen} onOpenChange={setIsBannerOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-indigo-700">
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
                  className="rounded-lg border-slate-300 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Thứ tự hiển thị</Label>
                  <Input
                    type="number"
                    value={bannerForm.order}
                    onChange={(e) =>
                      setBannerForm({
                        ...bannerForm,
                        order: Number(e.target.value)
                      })
                    }
                    className="rounded-lg border-slate-300"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Hình ảnh</Label>
                <Input
                  type="file"
                  onChange={handleUploadBanner}
                  disabled={isUploading}
                  className="rounded-lg cursor-pointer"
                />
                {bannerForm.image && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={bannerForm.image}
                      className="w-full h-32 object-cover"
                    />
                  </div>
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
                  className="rounded-lg border-slate-300"
                />
              </div>
              <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Switch
                  id="active-bn"
                  checked={bannerForm.isActive}
                  onCheckedChange={(c) =>
                    setBannerForm({ ...bannerForm, isActive: c })
                  }
                  className="data-[state=checked]:bg-emerald-500"
                />
                <Label
                  htmlFor="active-bn"
                  className="cursor-pointer font-medium text-slate-700"
                >
                  Hiển thị ngay trên App
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsBannerOpen(false)}
                className="rounded-lg"
              >
                Hủy
              </Button>
              <Button
                onClick={submitBanner}
                disabled={isSubmitting || isUploading}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu Banner'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isVoucherOpen} onOpenChange={setIsVoucherOpen}>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-indigo-700">
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
                  className="rounded-lg border-slate-300 focus:border-indigo-500 font-mono font-bold text-indigo-600"
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
                  <SelectTrigger className="rounded-lg border-slate-300">
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
                  className="rounded-lg border-slate-300"
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
                  className="rounded-lg border-slate-300"
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
                    className="rounded-lg border-slate-300"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={voucherForm.startDate}
                  onChange={(e) =>
                    setVoucherForm({
                      ...voucherForm,
                      startDate: e.target.value
                    })
                  }
                  className="rounded-lg border-slate-300"
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
                  className="rounded-lg border-slate-300"
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
                  className="rounded-lg border-slate-300"
                />
              </div>
              <div className="flex items-center space-x-2 mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2">
                <Switch
                  id="active-vc"
                  checked={voucherForm.isActive}
                  onCheckedChange={(c) =>
                    setVoucherForm({ ...voucherForm, isActive: c })
                  }
                  className="data-[state=checked]:bg-emerald-500"
                />
                <Label
                  htmlFor="active-vc"
                  className="cursor-pointer font-medium text-slate-700"
                >
                  Kích hoạt mã ngay
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsVoucherOpen(false)}
                className="rounded-lg"
              >
                Hủy
              </Button>
              <Button
                onClick={submitVoucher}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu Voucher'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
