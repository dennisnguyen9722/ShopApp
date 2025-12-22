const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Product = require('../models/Product')
const Notification = require('../models/Notification')
const { protect, checkPermission } = require('../middleware/authMiddleware')
const PERMISSIONS = require('../config/permissions')
const sendEmail = require('../utils/sendEmail')

// ==============================================================================
// 1. TẠO ĐƠN HÀNG (PUBLIC)
// - AWAIT Notification + Trừ kho (Để đảm bảo dữ liệu & Socket Admin nổ ngay)
// - KHÔNG GỬI MAIL (Chuyển sang lúc hoàn thành)
// ==============================================================================
router.post('/', async (req, res) => {
  try {
    const { customer, items, totalAmount, paymentMethod, note, userId } =
      req.body

    // Validation
    if (!items || items.length === 0)
      return res.status(400).json({ message: 'Giỏ hàng trống' })
    if (!customer || !customer.phone || !customer.address)
      return res.status(400).json({ message: 'Thiếu thông tin giao hàng' })

    // --- BƯỚC 1: KIỂM TRA TỒN KHO ---
    for (const item of items) {
      const product = await Product.findById(item.product)
      if (!product)
        return res
          .status(404)
          .json({ message: `Sản phẩm ID ${item.product} không tồn tại` })

      // Check kho biến thể
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants.find(
          (v) =>
            v.color === item.variant.color && v.storage === item.variant.storage
        )
        if (!variant)
          return res.status(400).json({
            message: `Phiên bản "${item.variant.color} ${item.variant.storage}" của "${product.title}" không tồn tại.`
          })
        if (variant.stock < item.quantity)
          return res.status(400).json({
            message: `Phiên bản "${product.title} - ${variant.color} ${variant.storage}" chỉ còn ${variant.stock}, không đủ giao.`
          })
      }
      // Check kho thường
      else {
        if (product.stock < item.quantity)
          return res.status(400).json({
            message: `Sản phẩm "${product.title}" chỉ còn ${product.stock}, không đủ giao.`
          })
      }
    }

    // --- BƯỚC 2: TẠO ĐƠN HÀNG ---
    const orderData = {
      customer,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      note,
      user: userId || null
    }
    const createdOrder = await Order.create(orderData)

    // --- BƯỚC 3: LƯU NOTIFICATION (QUAN TRỌNG: AWAIT ĐỂ ADMIN THẤY NGAY) ---
    try {
      await Notification.create({
        type: 'ORDER',
        title: 'Đơn hàng mới! 🤑',
        message: `Đơn #${createdOrder._id
          .toString()
          .slice(-6)
          .toUpperCase()} - ${new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(createdOrder.totalAmount)}`,
        link: `/orders?id=${createdOrder._id}`,
        isRead: false
      })
    } catch (e) {
      console.error('Lỗi lưu noti:', e.message)
    }

    // --- BƯỚC 4: TRỪ KHO & CẢNH BÁO (QUAN TRỌNG: AWAIT ĐỂ KHÔNG BỊ SAI SỐ) ---
    const io = req.app.get('io')

    for (const item of items) {
      const product = await Product.findById(item.product)
      let currentStock = 0

      // Trừ kho biến thể
      if (product.variants && product.variants.length > 0) {
        const variantIndex = product.variants.findIndex(
          (v) =>
            v.color === item.variant.color && v.storage === item.variant.storage
        )
        if (variantIndex > -1) {
          product.variants[variantIndex].stock -= item.quantity
          currentStock = product.variants[variantIndex].stock
          product.stock = product.variants.reduce((acc, v) => acc + v.stock, 0)
        }
      }
      // Trừ kho thường
      else {
        product.stock -= item.quantity
        currentStock = product.stock
      }

      product.sold = (product.sold || 0) + item.quantity
      await product.save()

      // Nếu sắp hết hàng -> Tạo Noti Stock
      if (currentStock <= 5) {
        try {
          await Notification.create({
            type: 'STOCK',
            title: 'Cảnh báo kho ⚠️',
            message: `Sản phẩm "${product.title}" sắp hết (còn ${currentStock})!`,
            link: `/products?id=${product._id}`,
            isRead: false
          })

          if (io) {
            io.emit('low_stock', {
              productId: product._id,
              productName: product.title,
              stock: currentStock,
              image: product.image
            })
          }
        } catch (e) {
          console.error('Lỗi noti stock:', e.message)
        }
      }
    }

    // --- BƯỚC 5: BẮN SOCKET NEW ORDER ---
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

    // ✅ TRẢ VỀ KẾT QUẢ CHO APP (NHANH, KHÔNG ĐỢI MAIL)
    res.status(201).json(createdOrder)
  } catch (err) {
    console.error('Lỗi tạo đơn:', err)
    res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng' })
  }
})

// ==============================================================================
// 2. LẤY DANH SÁCH ĐƠN HÀNG (ADMIN)
// ==============================================================================
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

// ==============================================================================
// 3. CẬP NHẬT TRẠNG THÁI (ADMIN)
// - Logic: Hoàn kho nếu Hủy
// - 🔥 GỬI MAIL KHI HOÀN THÀNH (COMPLETED)
// ==============================================================================
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

      if (!validStatuses.includes(status))
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' })

      const order = await Order.findById(req.params.id)
      if (!order)
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })

      // 1. LOGIC HOÀN KHO (Giữ nguyên logic cũ của bạn)
      if (status === 'cancelled' && order.status !== 'cancelled') {
        for (const item of order.items) {
          const product = await Product.findById(item.product)
          if (product) {
            if (product.variants && product.variants.length > 0) {
              const vIndex = product.variants.findIndex(
                (v) =>
                  v.color === item.variant.color &&
                  v.storage === item.variant.storage
              )
              if (vIndex > -1) {
                product.variants[vIndex].stock += item.quantity
                product.stock = product.variants.reduce(
                  (acc, v) => acc + v.stock,
                  0
                )
              }
            } else {
              product.stock += item.quantity
            }
            product.sold = Math.max(0, (product.sold || 0) - item.quantity)
            await product.save()
          }
        }
      }

      // 2. CẬP NHẬT & LƯU DB
      order.status = status
      await order.save()

      // 🔥 QUAN TRỌNG: TRẢ LỜI APP NGAY LẬP TỨC (Để UI không bị lag/nhảy)
      res.json(order)

      // 3. GỬI MAIL (CHẠY NGẦM - SAU KHI ĐÃ RES.JSON)
      // Chỉ gửi khi trạng thái là completed VÀ có email khách
      if (status === 'completed' && order.customer && order.customer.email) {
        // Không dùng 'await' ở đây để server không bị block
        sendEmail({
          email: order.customer.email,
          subject: `SuperMall - Đơn hàng #${order._id
            .toString()
            .slice(-6)
            .toUpperCase()} hoàn thành`,
          order: order
        })
      }
    } catch (err) {
      // Nếu lỗi xảy ra trước khi res.json thì mới báo lỗi 500
      if (!res.headersSent) res.status(500).json({ message: err.message })
    }
  }
)

module.exports = router
