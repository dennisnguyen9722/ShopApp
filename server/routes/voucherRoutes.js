const express = require('express')
const router = express.Router()
const Voucher = require('../models/Voucher')
const { protect } = require('../middleware/authMiddleware')

// ==============================================================================
// 1. GET ALL (Có Phân trang & Tìm kiếm theo Code)
// Query: ?page=1&limit=10&search=SALE50
// ==============================================================================
router.get('/', protect, async (req, res) => {
  try {
    // 1. Lấy tham số (Mặc định trang 1, 10 dòng)
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''

    // 2. Tạo bộ lọc
    const query = {}

    // Tìm kiếm theo mã Code (không phân biệt hoa thường)
    if (search) {
      query.code = { $regex: search, $options: 'i' }
    }

    // 3. Chạy song song: Tìm dữ liệu + Đếm tổng
    const [vouchers, total] = await Promise.all([
      Voucher.find(query)
        .sort({ isActive: -1, createdAt: -1 }) // Ưu tiên cái nào đang bật lên đầu
        .skip(skip)
        .limit(limit),
      Voucher.countDocuments(query)
    ])

    // 4. Trả về
    res.json({
      success: true,
      vouchers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ==============================================================================
// 2. CREATE
// ==============================================================================
router.post('/', protect, async (req, res) => {
  try {
    // Luôn uppercase mã code để tránh trùng lặp kiểu 'sale' và 'SALE'
    const code = req.body.code.toUpperCase()

    // Check trùng code
    const exists = await Voucher.findOne({ code })
    if (exists)
      return res.status(400).json({ message: `Mã ${code} đã tồn tại` })

    const voucher = await Voucher.create({ ...req.body, code })
    res.status(201).json(voucher)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ==============================================================================
// 3. UPDATE
// ==============================================================================
router.put('/:id', protect, async (req, res) => {
  try {
    // Nếu có update code thì cũng uppercase
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase()
    }

    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    if (!voucher)
      return res.status(404).json({ message: 'Không tìm thấy Voucher' })

    res.json(voucher)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ==============================================================================
// 4. DELETE
// ==============================================================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id)
    if (!voucher)
      return res.status(404).json({ message: 'Không tìm thấy Voucher' })

    res.json({ message: 'Đã xóa Voucher' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
