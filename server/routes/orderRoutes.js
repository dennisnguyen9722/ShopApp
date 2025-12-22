const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Product = require('../models/Product')
const Notification = require('../models/Notification')
const { protect, checkPermission } = require('../middleware/authMiddleware')
const PERMISSIONS = require('../config/permissions')
const sendEmail = require('../utils/sendEmail') // Import gửi mail

// ==============================================================================
// 1. TẠO ĐƠN HÀNG (PUBLIC)
// - Logic: Check kho (biến thể/thường) -> Trừ kho -> Lưu Noti -> Bắn Socket
// - ❌ KHÔNG GỬI MAIL Ở ĐÂY (Để App không bị treo)
// ==============================================================================
router.post('/', async (req, res) => {
  try {
    const { customer, items, totalAmount, paymentMethod, note, userId } =
      req.body

    if (!items || items.length === 0)
      return res.status(400).json({ message: 'Giỏ hàng trống' })
    if (!customer || !customer.phone || !customer.address)
      return res.status(400).json({ message: 'Thiếu thông tin giao hàng' })

    // --- BƯỚC 1: KIỂM TRA TỒN KHO (LOGIC FIX BIẾN THỂ) ---
    for (const item of items) {
      const product = await Product.findById(item.product)
      if (!product)
        return res
          .status(404)
          .json({ message: `Sản phẩm ID ${item.product} không tồn tại` })

      // TRƯỜNG HỢP 1: SẢN PHẨM CÓ BIẾN THỂ
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants.find(
          (v) =>
            v.color === item.variant.color && v.storage === item.variant.storage
        )

        if (!variant) {
          return res
            .status(400)
            .json({
              message: `Phiên bản "${item.variant.color} ${item.variant.storage}" của "${product.title}" không tồn tại.`
            })
        }

        if (variant.stock < item.quantity) {
          return res.status(400).json({
            message: `Phiên bản "${product.title} - ${variant.color} ${variant.storage}" chỉ còn ${variant.stock}, không đủ giao.`
          })
        }
      }
      // TRƯỜNG HỢP 2: SẢN PHẨM THƯỜNG
      else {
        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Sản phẩm "${product.title}" chỉ còn ${product.stock}, không đủ giao.`
          })
        }
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

    // ✅ TRẢ VỀ NGAY LẬP TỨC ĐỂ APP KHÔNG BỊ XOAY VÒNG
    res.status(201).json(createdOrder)(
      // ============================================================
      // CÁC TÁC VỤ CHẠY NGẦM (BACKGROUND) - KHÔNG AWAIT
      // ============================================================

      // 1. Lưu Notification
      async () => {
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
      }
    )()

    // 2. Trừ kho & Socket
    const io = req.app.get('io')
    ;(async () => {
      try {
        for (const item of items) {
          const product = await Product.findById(item.product)
          let currentStock = 0

          // Trừ kho biến thể
          if (product.variants && product.variants.length > 0) {
            const variantIndex = product.variants.findIndex(
              (v) =>
                v.color === item.variant.color &&
                v.storage === item.variant.storage
            )
            if (variantIndex > -1) {
              product.variants[variantIndex].stock -= item.quantity
              currentStock = product.variants[variantIndex].stock
              // Update lại stock tổng hiển thị
              product.stock = product.variants.reduce(
                (acc, v) => acc + v.stock,
                0
              )
            }
          }
          // Trừ kho thường
          else {
            product.stock -= item.quantity
            currentStock = product.stock
          }

          product.sold = (product.sold || 0) + item.quantity
          await product.save()

          // Cảnh báo hết hàng
          if (currentStock <= 5) {
            // Lưu Noti stock
            await Notification.create({
              type: 'STOCK',
              title: 'Cảnh báo kho ⚠️',
              message: `Sản phẩm "${product.title}" sắp hết (còn ${currentStock})!`,
              link: `/products?id=${product._id}`,
              isRead: false
            })

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

        // Bắn Socket New Order
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
      } catch (bgError) {
        console.error('Lỗi background task:', bgError)
      }
    })()
  } catch (err) {
    console.error('Lỗi tạo đơn:', err)
    // Nếu chưa res thì trả lỗi
    if (!res.headersSent)
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
// - 🔥 GỬI MAIL KHI TRẠNG THÁI LÀ "COMPLETED" (HOÀN THÀNH)
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

      // --- LOGIC HOÀN KHO KHI HỦY (CANCELLED) ---
      if (status === 'cancelled' && order.status !== 'cancelled') {
        for (const item of order.items) {
          const product = await Product.findById(item.product)
          if (product) {
            // Hoàn kho biến thể
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
            }
            // Hoàn kho thường
            else {
              product.stock += item.quantity
            }

            product.sold = Math.max(0, (product.sold || 0) - item.quantity)
            await product.save()
          }
        }
      }

      // Cập nhật trạng thái
      order.status = status
      await order.save()

      // ============================================================
      // 🔥 GỬI EMAIL CHỈ KHI TRẠNG THÁI LÀ "COMPLETED"
      // ============================================================
      if (status === 'completed' && order.customer && order.customer.email) {
        console.log(`📧 Đơn hàng ${order._id} đã hoàn thành. Đang gửi mail...`)

        // Chạy ngầm (không await) để Admin Dashboard không bị đơ
        sendEmail({
          email: order.customer.email,
          subject: `SuperMall - Cảm ơn bạn đã mua hàng! (#${order._id
            .toString()
            .slice(-6)
            .toUpperCase()})`,
          order: order
        })
          .then(() => {
            console.log('✅ Đã gửi mail cảm ơn khách hàng.')
          })
          .catch((err) => {
            console.error('❌ Gửi mail thất bại:', err.message)
          })
      }

      res.json(order)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

module.exports = router
