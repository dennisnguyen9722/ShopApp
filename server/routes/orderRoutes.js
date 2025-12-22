const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Product = require('../models/Product')
const { protect, checkPermission } = require('../middleware/authMiddleware')
const PERMISSIONS = require('../config/permissions')

// 1. TẠO ĐƠN HÀNG (PUBLIC) + TRỪ KHO + BẮN NOTI
router.post('/', async (req, res) => {
  try {
    const {
      customer,
      items, // [{ product: 'ID', quantity: 2, ... }]
      totalAmount,
      paymentMethod,
      note,
      userId
    } = req.body

    // --- Validate cơ bản ---
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' })
    }
    if (!customer || !customer.phone || !customer.address) {
      return res.status(400).json({ message: 'Thiếu thông tin giao hàng' })
    }

    // --- 🔥 LOGIC MỚI: KIỂM TRA TỒN KHO TRƯỚC KHI BÁN ---
    for (const item of items) {
      const product = await Product.findById(item.product)
      if (!product) {
        return res
          .status(404)
          .json({ message: `Sản phẩm ID ${item.product} không tồn tại` })
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm "${product.title}" chỉ còn ${product.stock}, không đủ giao.`
        })
      }
    }

    // --- Tạo đơn hàng ---
    const orderData = {
      customer,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      note,
      user: userId || null
    }
    const createdOrder = await Order.create(orderData)

    // --- 🔥 LOGIC MỚI: TRỪ KHO & CẢNH BÁO ---
    const io = req.app.get('io') // Lấy Socket IO

    for (const item of items) {
      // 1. Trừ số lượng tồn kho
      const product = await Product.findById(item.product)
      product.stock -= item.quantity
      product.sold = (product.sold || 0) + item.quantity // Tăng số lượng đã bán
      await product.save()

      // 2. Kiểm tra nếu sắp hết hàng (Ví dụ: dưới 5 cái)
      if (product.stock <= 5 && io) {
        io.emit('low_stock', {
          productId: product._id,
          productName: product.title,
          stock: product.stock,
          image: product.image
        })
        console.log(
          `⚠️ Cảnh báo: ${product.title} sắp hết hàng (${product.stock})`
        )
      }
    }

    // --- Bắn thông báo Đơn hàng mới ---
    if (io) {
      io.emit('new_order', {
        orderId: createdOrder._id,
        orderCode: createdOrder._id.toString().slice(-6).toUpperCase(),
        totalPrice: new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(createdOrder.totalAmount),
        customerName: customer.name
      })
    }

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
