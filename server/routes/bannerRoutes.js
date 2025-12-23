const express = require('express')
const router = express.Router()
const Banner = require('../models/Banner')
const { protect, checkPermission } = require('../middleware/authMiddleware')
// const PERMISSIONS = require('../config/permissions')

// ==============================================================================
// 1. GET ALL (Có Phân trang & Tìm kiếm)
// - Query: ?page=1&limit=10&search=khuyen_mai&active=true
// ==============================================================================
router.get('/', async (req, res) => {
  try {
    // 1. Lấy tham số từ URL (Mặc định trang 1, 10 dòng)
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''
    const active = req.query.active // Lọc theo trạng thái hiển thị (nếu có)

    // 2. Tạo bộ lọc (Query)
    const query = {}

    // Tìm kiếm theo tiêu đề (không phân biệt hoa thường)
    if (search) {
      query.title = { $regex: search, $options: 'i' }
    }

    // Nếu client truyền active=true thì chỉ lấy banner đang bật (dùng cho App khách)
    if (active) {
      query.isActive = active === 'true'
    }

    // 3. Chạy song song: Lấy dữ liệu + Đếm tổng số
    const [banners, total] = await Promise.all([
      Banner.find(query)
        .sort({ order: 1, createdAt: -1 }) // Ưu tiên thứ tự, sau đó đến mới nhất
        .skip(skip)
        .limit(limit),
      Banner.countDocuments(query)
    ])

    // 4. Trả về cấu trúc chuẩn phân trang
    res.json({
      success: true,
      banners, // Dữ liệu chính
      pagination: {
        page,
        limit,
        total, // Tổng số bản ghi
        totalPages: Math.ceil(total / limit) // Tổng số trang
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ==============================================================================
// 2. CREATE (Admin)
// ==============================================================================
router.post('/', protect, async (req, res) => {
  try {
    const banner = await Banner.create(req.body)
    res.status(201).json(banner)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ==============================================================================
// 3. UPDATE
// ==============================================================================
router.put('/:id', protect, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Trả về data mới sau khi update
      runValidators: true
    })

    if (!banner)
      return res.status(404).json({ message: 'Không tìm thấy Banner' })

    res.json(banner)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ==============================================================================
// 4. DELETE
// ==============================================================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id)

    if (!banner)
      return res.status(404).json({ message: 'Không tìm thấy Banner' })

    res.json({ message: 'Đã xóa Banner thành công' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
