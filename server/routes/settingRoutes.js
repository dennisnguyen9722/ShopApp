const express = require('express')
const router = express.Router()
const Setting = require('../models/Setting')
const { protect, checkPermission } = require('../middleware/authMiddleware')
// const PERMISSIONS = require('../config/permissions') // Thêm quyền SETTINGS.MANAGE nếu cần

// 1. LẤY CẤU HÌNH (Ai cũng lấy được để hiển thị)
router.get('/', async (req, res) => {
  try {
    // Lấy bản ghi đầu tiên
    let setting = await Setting.findOne()

    // Nếu chưa có thì tạo mới mặc định
    if (!setting) {
      setting = await Setting.create({ storeName: 'My Super Store' })
    }

    res.json(setting)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 2. CẬP NHẬT CẤU HÌNH (Chỉ Admin/Quản lý)
router.put('/', protect, async (req, res) => {
  try {
    let setting = await Setting.findOne()
    if (!setting) {
      setting = await Setting.create(req.body)
    } else {
      // Update fields
      setting.storeName = req.body.storeName || setting.storeName
      setting.logo = req.body.logo || setting.logo
      setting.email = req.body.email || setting.email
      setting.phone = req.body.phone || setting.phone
      setting.address = req.body.address || setting.address
      setting.facebook = req.body.facebook || setting.facebook
      setting.zalo = req.body.zalo || setting.zalo

      await setting.save()
    }
    res.json(setting)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router
