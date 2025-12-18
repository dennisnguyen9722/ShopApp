const express = require('express')
const router = express.Router()
const Banner = require('../models/Banner')
const { protect, checkPermission } = require('../middleware/authMiddleware')
// const PERMISSIONS = require('../config/permissions') // Tự thêm quyền nếu cần

// 1. GET ALL (Public để App khách lấy về hiển thị)
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 })
    res.json(banners)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 2. CREATE (Admin)
router.post('/', protect, async (req, res) => {
  try {
    const banner = await Banner.create(req.body)
    res.status(201).json(banner)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 3. UPDATE
router.put('/:id', protect, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    })
    res.json(banner)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 4. DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
