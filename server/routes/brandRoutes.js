const express = require('express')
const router = express.Router()
const Brand = require('../models/Brand')
const { protect, adminOnly } = require('../middleware/authMiddleware')

function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD') // Tách dấu ra khỏi chữ cái
    .replace(/[\u0300-\u036f]/g, '') // Xóa các dấu đó đi
    .replace(/[đĐ]/g, 'd') // Chuyển đ -> d
    .replace(/([^0-9a-z-\s])/g, '') // Xóa ký tự đặc biệt
    .trim()
    .replace(/(\s+)/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, '-') // Xóa gạch ngang thừa
}

// 1. Lấy tất cả thương hiệu (Công khai)
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 }) // Sắp xếp theo tên A-Z
    res.json(brands)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 2. Thêm thương hiệu mới (Chỉ Admin/Manager)
router.post('/', protect, async (req, res) => {
  try {
    const { name, image, description } = req.body
    const slug = createSlug(name)

    const newBrand = new Brand({ name, slug, image, description })
    await newBrand.save()
    res.status(201).json(newBrand)
  } catch (err) {
    res.status(400).json({ message: 'Thương hiệu đã tồn tại hoặc lỗi dữ liệu' })
  }
})

// 3. Xóa thương hiệu (Chỉ Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Brand.findByIdAndDelete(req.params.id)
    res.json({ message: 'Đã xóa thương hiệu' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
