/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  MessageSquare,
  Star,
  MessageCircle,
  Loader2,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'

interface Review {
  _id: string
  customer: { name: string; avatar: string; email: string }
  product: { title: string; image: string }
  rating: number
  comment: string
  adminReply: string
  isHidden: boolean
  createdAt: string
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRating, setFilterRating] = useState<number | null>(null) // Lọc theo sao
  const [showFilters, setShowFilters] = useState(false)

  // Reply Modal State
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. FETCH REVIEWS (Kèm Pagination & Search)
  const fetchReviews = async (page: number) => {
    setLoading(true)
    try {
      // Giả sử API của bạn hỗ trợ params giống Product
      // Nếu chưa hỗ trợ, nó vẫn chạy được nhưng sẽ trả về full list (cần update backend sau)
      let url = `/reviews?page=${page}&limit=${itemsPerPage}`
      if (searchTerm) url += `&search=${searchTerm}`
      if (filterRating) url += `&rating=${filterRating}`

      const { data } = await axiosClient.get(url)

      // Xử lý dữ liệu trả về (Support cả cấu trúc cũ và mới)
      if (data.reviews) {
        setReviews(data.reviews)
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalReviews(data.pagination?.total || 0)
        setCurrentPage(data.pagination?.page || 1)
      } else {
        // Fallback nếu API chưa phân trang
        setReviews(Array.isArray(data) ? data : [])
        setTotalReviews(Array.isArray(data) ? data.length : 0)
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách đánh giá')
    } finally {
      setLoading(false)
    }
  }

  // Effect: Gọi API khi các dependency thay đổi
  useEffect(() => {
    fetchReviews(currentPage)
  }, [currentPage, itemsPerPage, searchTerm, filterRating])

  // 2. TOGGLE HIDDEN
  const handleToggleHidden = async (id: string, currentStatus: boolean) => {
    try {
      await axiosClient.put(`/reviews/${id}/toggle`)
      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, isHidden: !currentStatus } : r))
      )
      toast.success(currentStatus ? 'Đã hiện đánh giá' : 'Đã ẩn đánh giá')
    } catch (error) {
      toast.error('Lỗi thao tác')
    }
  }

  // 3. REPLY REVIEW
  const openReplyModal = (review: Review) => {
    setSelectedReview(review)
    setReplyText(review.adminReply || '')
  }

  const handleReplySubmit = async () => {
    if (!selectedReview) return
    setIsSubmitting(true)
    try {
      const { data } = await axiosClient.put(
        `/reviews/${selectedReview._id}/reply`,
        { reply: replyText }
      )
      // Cập nhật lại list sau khi reply
      setReviews((prev) =>
        prev.map((r) =>
          r._id === selectedReview._id ? { ...r, adminReply: replyText } : r
        )
      )
      toast.success('Đã trả lời đánh giá')
      setSelectedReview(null)
    } catch (error) {
      toast.error('Gửi trả lời thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 4. DELETE
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa vĩnh viễn đánh giá này?')) return
    try {
      await axiosClient.delete(`/reviews/${id}`)
      setReviews((prev) => prev.filter((r) => r._id !== id))
      toast.success('Đã xóa đánh giá')
    } catch (error) {
      toast.error('Xóa thất bại')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Helper render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'fill-current' : 'text-slate-200'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* === HEADER SECTION (Giống ProductsPage) === */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 p-6 sm:p-8 border border-indigo-100/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Quản Lý Đánh Giá
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      {totalReviews} đánh giá từ khách hàng
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters Toolbar */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm nội dung đánh giá..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 font-medium ${
                    showFilters
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  Lọc
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showFilters ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Filter Panel (Lọc theo sao) */}
            {showFilters && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  Lọc theo đánh giá:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterRating(null)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      filterRating === null
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white border border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    Tất cả
                  </button>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFilterRating(star)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-1 ${
                        filterRating === star
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-white border border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {star} <Star className="w-3 h-3 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === TABLE SECTION (Giống ProductsPage) === */}
        <Card className="shadow-xl border-indigo-100/20 overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-slate-700 w-[250px]">
                      Sản phẩm
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700 w-[200px]">
                      Khách hàng
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700 w-[140px]">
                      Đánh giá
                    </th>
                    <th className="text-left p-4 font-bold text-slate-700">
                      Nội dung
                    </th>
                    <th className="text-center p-4 font-bold text-slate-700 w-[100px]">
                      Trạng thái
                    </th>
                    <th className="text-right p-4 font-bold text-slate-700 w-[140px]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                          <p className="text-slate-500 font-medium">
                            Đang tải dữ liệu...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="h-64 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="font-medium">Chưa có đánh giá nào</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review) => (
                      <tr
                        key={review._id}
                        className={`border-t border-slate-100 hover:bg-indigo-50/30 transition-colors ${
                          review.isHidden ? 'bg-slate-50' : ''
                        }`}
                      >
                        {/* Cột Sản Phẩm */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm bg-slate-100 border border-slate-200 shrink-0">
                              {review.product?.image ? (
                                <img
                                  src={review.product.image}
                                  className="w-full h-full object-cover"
                                  alt="product"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-200" />
                              )}
                            </div>
                            <p
                              className="text-sm font-medium line-clamp-2 text-slate-900 leading-snug"
                              title={review.product?.title}
                            >
                              {review.product?.title || 'Sản phẩm đã xóa'}
                            </p>
                          </div>
                        </td>

                        {/* Cột Khách Hàng */}
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">
                              {review.customer?.name || 'Ẩn danh'}
                            </span>
                            <span className="text-xs text-slate-500 mt-0.5">
                              {review.customer?.email}
                            </span>
                          </div>
                        </td>

                        {/* Cột Đánh Giá */}
                        <td className="p-4">
                          <div className="space-y-1.5">
                            {renderStars(review.rating)}
                            <span className="text-xs text-slate-400 block font-mono">
                              {new Date(review.createdAt).toLocaleDateString(
                                'vi-VN'
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Cột Nội Dung */}
                        <td className="p-4">
                          <div className="space-y-2">
                            <p
                              className={`text-sm text-slate-700 ${
                                review.isHidden ? 'text-slate-400 italic' : ''
                              }`}
                            >
                              {review.comment}
                            </p>
                            {review.adminReply ? (
                              <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-700 border border-indigo-100 flex gap-2 items-start">
                                <MessageCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />
                                <div>
                                  <span className="font-bold block mb-0.5">
                                    Shop trả lời:
                                  </span>
                                  {review.adminReply}
                                </div>
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs text-slate-400 border-slate-200 font-normal"
                              >
                                Chưa trả lời
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Cột Trạng Thái (Hiện/Ẩn) */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Switch
                              checked={!review.isHidden}
                              onCheckedChange={() =>
                                handleToggleHidden(review._id, review.isHidden)
                              }
                              className="data-[state=checked]:bg-emerald-500"
                            />
                            <span className="text-[10px] font-medium text-slate-500">
                              {review.isHidden ? 'Đang ẩn' : 'Hiển thị'}
                            </span>
                          </div>
                        </td>

                        {/* Cột Thao Tác */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openReplyModal(review)}
                              className="h-8 w-8 hover:bg-indigo-100 text-indigo-600 rounded-lg"
                              title="Trả lời"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(review._id)}
                              className="h-8 w-8 hover:bg-red-100 text-red-600 rounded-lg"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* === PAGINATION FOOTER (Giống ProductsPage) === */}
            <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 font-medium">
                    Hiển thị
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-indigo-400 outline-none font-medium bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-slate-600">
                    trên tổng {totalReviews} đánh giá
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || loading}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Đầu
                  </Button>
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Trước
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) pageNum = i + 1
                      else if (currentPage <= 3) pageNum = i + 1
                      else if (currentPage >= totalPages - 2)
                        pageNum = totalPages - 4 + i
                      else pageNum = currentPage - 2 + i

                      return (
                        <Button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          variant={
                            currentPage === pageNum ? 'default' : 'outline'
                          }
                          size="sm"
                          className={
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                              : 'bg-white'
                          }
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    variant="outline"
                    size="sm"
                    className="font-medium bg-white"
                  >
                    Sau
                  </Button>
                  <Button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || loading}
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
      </div>

      {/* --- MODAL REPLY (Giữ nguyên style nhưng chỉnh lại border radius cho khớp) --- */}
      <Dialog
        open={!!selectedReview}
        onOpenChange={(open) => !open && setSelectedReview(null)}
      >
        <DialogContent className="sm:max-w-[550px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Trả lời đánh giá
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-4 rounded-xl border-2 border-indigo-200/50">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-slate-900">
                  {selectedReview?.customer?.name}
                </span>
                {selectedReview && renderStars(selectedReview.rating)}
              </div>
              <p className="text-sm text-slate-600 italic">
                &quot;{selectedReview?.comment}&quot;
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">
                Nội dung trả lời:
              </p>
              <Textarea
                placeholder="Cảm ơn bạn đã ủng hộ shop..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-0"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedReview(null)}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              onClick={handleReplySubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi trả lời'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
