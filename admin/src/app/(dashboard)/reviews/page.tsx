/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import {
  MessageSquare,
  Star,
  MessageCircle,
  Loader2,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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

  // Reply Modal
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. FETCH REVIEWS
  const fetchReviews = async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get('/reviews')
      setReviews(data)
    } catch (error) {
      toast.error('Lỗi tải đánh giá')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

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
      setReviews((prev) =>
        prev.map((r) => (r._id === selectedReview._id ? data : r))
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

  // Helper render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < rating ? 'fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <MessageSquare className="w-6 h-6 text-indigo-600" /> Đánh Giá &
              Bình Luận
            </CardTitle>
            <CardDescription>
              Quản lý phản hồi từ khách hàng về sản phẩm
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[250px]">Sản phẩm</TableHead>
                  <TableHead className="w-[200px]">Khách hàng</TableHead>
                  <TableHead className="w-[120px]">Đánh giá</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead className="text-center w-[100px]">
                    Hiện/Ẩn
                  </TableHead>
                  <TableHead className="text-right w-[100px]">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                    </TableCell>
                  </TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-gray-500"
                    >
                      Chưa có đánh giá nào
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow
                      key={review._id}
                      className={`hover:bg-gray-50/50 ${
                        review.isHidden ? 'bg-gray-50 opacity-70' : ''
                      }`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded border bg-gray-100 overflow-hidden shrink-0">
                            <img
                              src={review.product?.image}
                              className="w-full h-full object-cover"
                              alt="product"
                            />
                          </div>
                          <p
                            className="text-sm font-medium line-clamp-2"
                            title={review.product?.title}
                          >
                            {review.product?.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {review.customer?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {review.customer?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-400 mt-1 block">
                          {new Date(review.createdAt).toLocaleDateString(
                            'vi-VN'
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700">
                            {review.comment}
                          </p>
                          {review.adminReply && (
                            <div className="bg-indigo-50 p-2 rounded-md text-xs text-indigo-700 border border-indigo-100 flex gap-2">
                              <MessageCircle className="w-3 h-3 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold">Shop trả lời:</span>{' '}
                                {review.adminReply}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={!review.isHidden}
                          onCheckedChange={() =>
                            handleToggleHidden(review._id, review.isHidden)
                          }
                          className="data-[state=checked]:bg-green-500"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openReplyModal(review)}
                            title="Trả lời"
                          >
                            <MessageCircle className="w-4 h-4 text-indigo-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(review._id)}
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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

      {/* --- MODAL REPLY --- */}
      <Dialog
        open={!!selectedReview}
        onOpenChange={(open) => !open && setSelectedReview(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trả lời đánh giá</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="flex justify-between mb-1">
                <span className="font-bold text-sm">
                  {selectedReview?.customer?.name}
                </span>
                {selectedReview && renderStars(selectedReview.rating)}
              </div>
              {/* ĐÃ FIX LỖI Ở DÒNG DƯỚI */}
              <p className="text-sm text-gray-600 italic">
                &quot;{selectedReview?.comment}&quot;
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Nội dung trả lời:</p>
              <Textarea
                placeholder="Cảm ơn bạn đã ủng hộ shop..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleReplySubmit}
              disabled={isSubmitting}
              className="bg-indigo-600"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
