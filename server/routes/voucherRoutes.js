const express = require('express')
const router = express.Router()
const Voucher = require('../models/Voucher')
const { protect } = require('../middleware/authMiddleware')

// 1. GET ALL (Admin quản lý)
router.get('/', protect, async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 })
    res.json(vouchers)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 2. CREATE
router.post('/', protect, async (req, res) => {
  try {
    // Check trùng code
    const exists = await Voucher.findOne({ code: req.body.code.toUpperCase() })
    if (exists)
      return res.status(400).json({ message: 'Mã giảm giá này đã tồn tại' })

    const voucher = await Voucher.create(req.body)
    res.status(201).json(voucher)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 3. UPDATE
router.put('/:id', protect, async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    })
    res.json(voucher)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 4. DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
