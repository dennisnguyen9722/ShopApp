const express = require('express')
const router = express.Router()
const Order = require('../models/Order') // Lấy từ Order chứ không lấy từ User nữa
const { protect } = require('../middleware/authMiddleware')

// ==============================================================================
// 1. LẤY DANH SÁCH KHÁCH HÀNG (TỪ LỊCH SỬ ĐƠN HÀNG)
// ==============================================================================
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''

    // Pipeline xử lý dữ liệu
    const pipeline = [
      // 1. Chỉ lấy các đơn hàng có thông tin khách hàng
      {
        $match: {
          'customer.email': { $exists: true, $ne: null }
        }
      },
      // 2. Nếu có tìm kiếm thì lọc trước khi gom nhóm
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { 'customer.name': { $regex: search, $options: 'i' } },
                  { 'customer.email': { $regex: search, $options: 'i' } },
                  { 'customer.phone': { $regex: search, $options: 'i' } }
                ]
              }
            }
          ]
        : []),
      // 3. Gom nhóm theo Email (để 1 khách mua nhiều lần chỉ hiện 1 dòng)
      {
        $group: {
          _id: '$customer.email', // Khóa chính là Email
          name: { $first: '$customer.name' },
          phone: { $first: '$customer.phone' },
          address: { $first: '$customer.address' },
          avatar: { $first: '' }, // Khách vãng lai không có avatar
          totalSpent: { $sum: '$totalAmount' }, // Tổng tiền đã mua
          orderCount: { $sum: 1 }, // Tổng số đơn
          lastOrderDate: { $max: '$createdAt' }, // Ngày mua gần nhất
          isBlocked: { $first: false } // Mặc định chưa hỗ trợ block theo email
        }
      },
      // 4. Sắp xếp: Khách mua gần nhất lên đầu
      { $sort: { lastOrderDate: -1 } },
      // 5. Phân trang (Facet giúp lấy cả data và tổng số lượng cùng lúc)
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ]

    const result = await Order.aggregate(pipeline)

    const customers = result[0].data
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0

    // Map lại dữ liệu để có _id (frontend cần key này)
    const formattedCustomers = customers.map((c, index) => ({
      _id: c._id, // Dùng email làm ID luôn
      name: c.name,
      email: c._id,
      phone: c.phone,
      address: c.address,
      avatar: c.avatar,
      totalSpent: c.totalSpent,
      orderCount: c.orderCount,
      lastOrderDate: c.lastOrderDate,
      isBlocked: c.isBlocked
    }))

    res.json({
      success: true,
      customers: formattedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
})

// ==============================================================================
// 2. LẤY CHI TIẾT KHÁCH (Tìm theo Email thay vì ID)
// ==============================================================================
router.get('/:email', protect, async (req, res) => {
  try {
    const email = req.params.email

    // Tìm tất cả đơn hàng của email này
    const orders = await Order.find({ 'customer.email': email }).sort({
      createdAt: -1
    })

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' })
    }

    // Lấy thông tin mới nhất từ đơn hàng gần nhất
    const lastOrder = orders[0]
    const customerInfo = {
      _id: email,
      name: lastOrder.customer.name,
      email: lastOrder.customer.email,
      phone: lastOrder.customer.phone,
      address: lastOrder.customer.address,
      avatar: '',
      createdAt: orders[orders.length - 1].createdAt // Ngày đơn hàng đầu tiên
    }

    res.json({ customer: customerInfo, orders })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ==============================================================================
// 3. CHẶN KHÁCH (Với Guest thì chưa chặn được login, chỉ chặn đặt hàng nếu cần)
// Hiện tại mình tạm disable tính năng này với Guest
// ==============================================================================
router.put('/:id/block', protect, async (req, res) => {
  res
    .status(400)
    .json({ message: 'Chức năng chặn chỉ áp dụng cho tài khoản đăng ký' })
})

module.exports = router
