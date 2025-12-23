const express = require('express')
const router = express.Router()
const User = require('../models/User') // 👈 QUAN TRỌNG: Sửa Customer thành User
const Order = require('../models/Order')
const { protect } = require('../middleware/authMiddleware')

// ==============================================================================
// 1. LẤY DANH SÁCH KHÁCH HÀNG (Lấy từ bảng User có role='user')
// ==============================================================================
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''

    // Bộ lọc: Chỉ lấy role là 'user' (Khách hàng)
    const query = { role: 'user' }

    // Nếu có tìm kiếm
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }

    // Chạy song song
    const [customers, total] = await Promise.all([
      User.find(query)
        .select('-password') // Bỏ mật khẩu
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ])

    // Map lại dữ liệu để khớp với Frontend (nếu cần)
    // Frontend đang mong đợi field 'avatar', 'address', 'isBlocked'
    // Model User của bạn chắc chắn đã có các field này.

    res.json({
      success: true,
      customers, // Trả về list user
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
// 2. LẤY CHI TIẾT + LỊCH SỬ MUA
// ==============================================================================
router.get('/:id', protect, async (req, res) => {
  try {
    // Tìm trong bảng User
    const customer = await User.findOne({
      _id: req.params.id,
      role: 'user'
    }).select('-password')

    if (!customer)
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' })

    // Tìm đơn hàng của user này
    const orders = await Order.find({ user: customer._id }).sort({
      createdAt: -1
    })

    res.json({ customer, orders })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ==============================================================================
// 3. CHẶN / BỎ CHẶN
// ==============================================================================
router.put('/:id/block', protect, async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
    if (!customer)
      return res.status(404).json({ message: 'User không tồn tại' })

    // Đảo ngược trạng thái
    customer.isBlocked = !customer.isBlocked
    await customer.save()

    res.json({
      message: customer.isBlocked
        ? 'Đã chặn tài khoản'
        : 'Đã mở khóa tài khoản',
      isBlocked: customer.isBlocked
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
