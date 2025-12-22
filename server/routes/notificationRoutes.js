const express = require('express')
const router = express.Router()
const Notification = require('../models/Notification')

// GET /api/notifications: Lấy 5 thông báo mới nhất
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 }) // Mới nhất lên đầu
      .limit(5) // 👇 CHỈ LẤY 5 CÁI NHƯ BẠN YÊU CẦU

    res.json(notifications)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/notifications/read: Đánh dấu tất cả đã đọc (Optional)
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({}, { isRead: true })
    res.json({ message: 'Đã đọc hết' })
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router
