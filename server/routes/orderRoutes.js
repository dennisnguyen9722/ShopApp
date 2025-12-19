const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const { protect, checkPermission } = require('../middleware/authMiddleware')
const PERMISSIONS = require('../config/permissions')

// 1. TẠO ĐƠN HÀNG (PUBLIC - Khách vãng lai cũng đặt được)
router.post('/', async (req, res) => {
  try {
    const {
      customer, // { name, email, phone, address }
      items, // Array products
      totalAmount,
      paymentMethod,
      note,
      userId // Nếu app có gửi kèm ID user đã login
    } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' })
    }

    if (!customer || !customer.phone || !customer.address) {
      return res.status(400).json({ message: 'Thiếu thông tin giao hàng' })
    }

    const orderData = {
      customer,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      note,
      user: userId || null // Lưu ID user nếu có
    }

    const createdOrder = await Order.create(orderData)
    res.status(201).json(createdOrder)
  } catch (err) {
    console.error('Lỗi tạo đơn:', err)
    res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng' })
  }
})

// 2. LẤY DANH SÁCH ĐƠN HÀNG (ADMIN - Cần quyền VIEW)
router.get(
  '/',
  protect,
  checkPermission(PERMISSIONS.ORDERS.VIEW),
  async (req, res) => {
    try {
      const orders = await Order.find()
        .populate('items.product', 'title image')
        .sort({ createdAt: -1 })
      res.json(orders)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

// 3. CẬP NHẬT TRẠNG THÁI (ADMIN - Cần quyền UPDATE_STATUS)
router.put(
  '/:id/status',
  protect,
  checkPermission(PERMISSIONS.ORDERS.UPDATE_STATUS),
  async (req, res) => {
    try {
      const { status } = req.body
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

module.exports = router
