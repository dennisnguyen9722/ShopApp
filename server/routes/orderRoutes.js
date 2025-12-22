const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Product = require('../models/Product')
const Notification = require('../models/Notification')
const { protect, checkPermission } = require('../middleware/authMiddleware')
const PERMISSIONS = require('../config/permissions')
const sendEmail = require('../utils/sendEmail') // Import gửi mail

// 1. TẠO ĐƠN HÀNG + TRỪ KHO BIẾN THỂ + NOTI + EMAIL
router.post('/', async (req, res) => {
  try {
    const { customer, items, totalAmount, paymentMethod, note, userId } =
      req.body

    if (!items || items.length === 0)
      return res.status(400).json({ message: 'Giỏ hàng trống' })
    if (!customer || !customer.phone || !customer.address)
      return res.status(400).json({ message: 'Thiếu thông tin giao hàng' })

    // =======================================================
    // 🔥 BƯỚC 1: KIỂM TRA TỒN KHO (LOGIC MỚI: CHECK CẢ BIẾN THỂ)
    // =======================================================
    for (const item of items) {
      const product = await Product.findById(item.product)
      if (!product)
        return res
          .status(404)
          .json({ message: `Sản phẩm ID ${item.product} không tồn tại` })

      // TRƯỜNG HỢP 1: SẢN PHẨM CÓ BIẾN THỂ
      if (product.variants && product.variants.length > 0) {
        // Tìm biến thể khớp với lựa chọn của khách (Màu, Dung lượng...)
        const variant = product.variants.find(
          (v) =>
            v.color === item.variant.color && v.storage === item.variant.storage
          // Nếu có RAM thì check thêm: && v.ram === item.variant.ram
        )

        if (!variant) {
          return res
            .status(400)
            .json({
              message: `Phiên bản "${item.variant.color} ${item.variant.storage}" của "${product.title}" không tồn tại.`
            })
        }

        // Check kho của biến thể đó
        if (variant.stock < item.quantity) {
          return res.status(400).json({
            message: `Phiên bản "${product.title} - ${variant.color} ${variant.storage}" chỉ còn ${variant.stock}, không đủ giao.`
          })
        }
      }
      // TRƯỜNG HỢP 2: SẢN PHẨM ĐƠN GIẢN (KHÔNG BIẾN THỂ)
      else {
        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Sản phẩm "${product.title}" chỉ còn ${product.stock}, không đủ giao.`
          })
        }
      }
    }

    // --- TẠO ĐƠN HÀNG ---
    const orderData = {
      customer,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      note,
      user: userId || null
    }
    const createdOrder = await Order.create(orderData)

    // --- LƯU NOTI ĐƠN MỚI ---
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
      console.error('Lỗi noti order:', e)
    }

    // =======================================================
    // 🔥 BƯỚC 2: TRỪ KHO (LOGIC MỚI: TRỪ ĐÚNG CHỖ)
    // =======================================================
    const io = req.app.get('io')

    for (const item of items) {
      const product = await Product.findById(item.product)
      let currentStock = 0 // Để dùng cho việc bắn noti cảnh báo

      // 2.1. TRỪ KHO BIẾN THỂ
      if (product.variants && product.variants.length > 0) {
        const variantIndex = product.variants.findIndex(
          (v) =>
            v.color === item.variant.color && v.storage === item.variant.storage
        )
        if (variantIndex > -1) {
          // Trừ kho biến thể
          product.variants[variantIndex].stock -= item.quantity
          currentStock = product.variants[variantIndex].stock

          // Cập nhật lại kho tổng (Optional: Cộng dồn tất cả variant stock lại để hiển thị bên ngoài)
          product.stock = product.variants.reduce((acc, v) => acc + v.stock, 0)
        }
      }
      // 2.2. TRỪ KHO THƯỜNG
      else {
        product.stock -= item.quantity
        currentStock = product.stock
      }

      // Tăng số lượng đã bán
      product.sold = (product.sold || 0) + item.quantity
      await product.save()

      // 2.3. KIỂM TRA SẮP HẾT HÀNG (Dựa trên stock vừa trừ)
      if (currentStock <= 5) {
        // Lưu Noti
        try {
          await Notification.create({
            type: 'STOCK',
            title: 'Cảnh báo kho ⚠️',
            message: `Sản phẩm "${product.title}" ${
              product.variants.length > 0 ? '(Biến thể)' : ''
            } sắp hết (còn ${currentStock})!`,
            link: `/products?id=${product._id}`,
            isRead: false
          })
        } catch (e) {
          console.error('Lỗi noti stock:', e)
        }

        // Bắn Socket
        if (io) {
          io.emit('low_stock', {
            productId: product._id,
            productName: product.title,
            stock: currentStock,
            image: product.image
          })
        }
      }
    }

    // --- BẮN SOCKET NEW ORDER ---
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

    // --- GỬI EMAIL ---
    try {
      if (customer.email) {
        await sendEmail({
          email: customer.email,
          subject: `SuperMall - Xác nhận đơn hàng #${createdOrder._id
            .toString()
            .slice(-6)
            .toUpperCase()}`,
          order: createdOrder
        })
        console.log('📧 Đã gửi email cho:', customer.email)
      }
    } catch (error) {
      console.error('❌ Lỗi gửi mail:', error.message)
    }

    res.status(201).json(createdOrder)
  } catch (err) {
    console.error('Lỗi tạo đơn:', err)
    res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng' })
  }
})

// ... (Giữ nguyên các route GET, PUT bên dưới của file cũ)
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

// 3. CẬP NHẬT TRẠNG THÁI & HOÀN KHO (NẾU HỦY)
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

      // HOÀN KHO KHI HỦY
      if (status === 'cancelled' && order.status !== 'cancelled') {
        for (const item of order.items) {
          const product = await Product.findById(item.product)
          if (product) {
            // Check xem là hoàn kho biến thể hay kho thường
            if (product.variants && product.variants.length > 0) {
              const vIndex = product.variants.findIndex(
                (v) =>
                  v.color === item.variant.color &&
                  v.storage === item.variant.storage
              )
              if (vIndex > -1) {
                product.variants[vIndex].stock += item.quantity
                // Update lại stock tổng
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

      order.status = status
      await order.save()
      res.json(order)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

module.exports = router
