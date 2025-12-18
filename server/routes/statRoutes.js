const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Product = require('../models/Product')
const Customer = require('../models/Customer')
const { protect } = require('../middleware/authMiddleware')

router.get('/', protect, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // 1. CÁC CON SỐ TỔNG QUAN (CARD)
    // Tổng doanh thu (chỉ tính đơn đã hoàn thành)
    const totalRevenueResult = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
    const totalRevenue = totalRevenueResult[0]?.total || 0

    // Doanh thu tháng này
    const monthRevenueResult = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: firstDayOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
    const monthRevenue = monthRevenueResult[0]?.total || 0

    // Đếm số lượng
    const totalOrders = await Order.countDocuments()
    const pendingOrders = await Order.countDocuments({ status: 'pending' })
    const totalProducts = await Product.countDocuments()
    const totalCustomers = await Customer.countDocuments()

    // 2. BIỂU ĐỒ DOANH THU 7 NGÀY GẦN NHẤT
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 6)

    const revenueChart = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } } // Sắp xếp theo ngày tăng dần
    ])

    // 3. ĐƠN HÀNG MỚI NHẤT (Cho bảng Recent Orders)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.product', 'title') // Lấy tên sp để hiển thị nếu cần

    res.json({
      cards: {
        totalRevenue,
        monthRevenue,
        totalOrders,
        pendingOrders,
        totalProducts,
        totalCustomers
      },
      chart: revenueChart,
      recentOrders
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
