const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const { protect, checkPermission } = require('../middleware/authMiddleware')
const PERMISSIONS = require('../config/permissions')

// 1. LẤY DANH SÁCH ĐƠN HÀNG (Cần quyền VIEW)
router.get(
  '/',
  protect,
  checkPermission(PERMISSIONS.ORDERS.VIEW),
  async (req, res) => {
    try {
      // Populate product để lấy thêm info nếu cần
      const orders = await Order.find()
        .populate('items.product', 'title image')
        .sort({ createdAt: -1 }) // Mới nhất lên đầu
      res.json(orders)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

// 2. CẬP NHẬT TRẠNG THÁI (Cần quyền UPDATE_STATUS)
// VD: Duyệt đơn, Bấm giao hàng...
router.put(
  '/:id/status',
  protect,
  checkPermission(PERMISSIONS.ORDERS.UPDATE_STATUS),
  async (req, res) => {
    try {
      const { status } = req.body

      // Validate status hợp lệ
      const validStatuses = [
        'pending',
        'confirmed',
        'shipping',
        'completed',
        'cancelled'
      ]
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' })
      }

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      )

      if (!order)
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })

      res.json(order)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

// 3. API TẠO ĐƠN TEST (Để bạn có dữ liệu mà test)
// Không cần quyền, ai gọi cũng được (để test cho lẹ)
router.post('/dummy', async (req, res) => {
  try {
    const order = await Order.create(req.body)
    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
