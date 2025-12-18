const express = require('express')
const router = express.Router()
const Review = require('../models/Review')
const { protect, checkPermission } = require('../middleware/authMiddleware')
// const PERMISSIONS = require('../config/permissions') // Thêm quyền REVIEWS.MANAGE nếu cần

// 1. LẤY DANH SÁCH ĐÁNH GIÁ (Admin xem)
router.get('/', protect, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('customer', 'name avatar email') // Lấy tên, avatar khách
      .populate('product', 'title image') // Lấy tên, ảnh sản phẩm
      .sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 2. KHÁCH HÀNG VIẾT ĐÁNH GIÁ (Giả lập API này để test)
router.post('/', async (req, res) => {
  try {
    // Trong thực tế, cần middleware verifyToken của Customer để lấy ID
    const review = await Review.create(req.body)
    res.status(201).json(review)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 3. ADMIN TRẢ LỜI ĐÁNH GIÁ
router.put('/:id/reply', protect, async (req, res) => {
  try {
    const { reply } = req.body
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { adminReply: reply },
      { new: true }
    )
    res.json(review)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 4. ẨN / HIỆN ĐÁNH GIÁ (Toggle)
router.put('/:id/toggle', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ message: 'Không tìm thấy' })

    review.isHidden = !review.isHidden
    await review.save()
    res.json(review)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 5. XÓA ĐÁNH GIÁ
router.delete('/:id', protect, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id)
    res.json({ message: 'Đã xóa đánh giá' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
