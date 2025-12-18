const express = require('express')
const router = express.Router()
const Customer = require('../models/Customer')
const Order = require('../models/Order') // Để lấy lịch sử mua hàng
const { protect, checkPermission } = require('../middleware/authMiddleware')
// const PERMISSIONS = require('../config/permissions') // Tự thêm quyền CUSTOMERS.VIEW nếu cần

// 1. LẤY DANH SÁCH KHÁCH HÀNG
router.get('/', protect, async (req, res) => {
  try {
    const customers = await Customer.find()
      .select('-password')
      .sort({ createdAt: -1 })

    // Tính toán tổng chi tiêu realtime (Option)
    // Ở đây mình trả về list customer thôi cho nhanh
    res.json(customers)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 2. LẤY CHI TIẾT KHÁCH + LỊCH SỬ ĐƠN HÀNG
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password')
    if (!customer)
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' })

    // Tìm các đơn hàng có email trùng với email khách này
    const orders = await Order.find({ 'customer.email': customer.email }).sort({
      createdAt: -1
    })

    res.json({ customer, orders })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 3. CHẶN / BỎ CHẶN KHÁCH HÀNG
router.put('/:id/block', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer)
      return res.status(404).json({ message: 'Khách hàng không tồn tại' })

    customer.isBlocked = !customer.isBlocked // Đảo ngược trạng thái
    await customer.save()

    res.json({
      message: customer.isBlocked ? 'Đã chặn khách hàng' : 'Đã bỏ chặn',
      isBlocked: customer.isBlocked
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
