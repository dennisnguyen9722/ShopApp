const express = require('express')
const router = express.Router()
const Notification = require('../models/Notification')

// GET /api/notifications: Lấy 5 thông báo mới nhất
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(5)

    res.json(notifications)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ✅ THÊM ROUTE NÀY: Đánh dấu 1 thông báo cụ thể đã đọc
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' })
    }

    res.json(notification)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/notifications/read-all: Đánh dấu tất cả đã đọc
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({}, { isRead: true })
    res.json({ message: 'Đã đọc hết' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
