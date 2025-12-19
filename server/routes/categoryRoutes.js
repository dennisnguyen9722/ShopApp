const express = require('express')
const router = express.Router()
const Category = require('../models/Category')
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

// 1. Lấy tất cả danh mục (Công khai)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 })
    res.json(categories)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 2. Thêm danh mục mới (Chỉ Admin/Staff)
router.post('/', protect, async (req, res) => {
  try {
    const { name, image, description } = req.body
    // Tạo slug đơn giản từ tên (Thời Trang -> thoi-trang)
    const slug = createSlug(name)

    const newCategory = new Category({ name, slug, image, description })
    await newCategory.save()
    res.status(201).json(newCategory)
  } catch (err) {
    res.status(400).json({ message: 'Danh mục đã tồn tại hoặc lỗi dữ liệu' })
  }
})

// PUT: Cập nhật danh mục
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, image, description } = req.body

    // Nếu có sửa tên thì cập nhật lại cả slug
    const updateData = { name, image, description }
    if (name) {
      updateData.slug = createSlug(name) // Dùng hàm bỏ dấu ở trên
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    res.json(category)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 3. Xóa danh mục (Chỉ Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id)
    res.json({ message: 'Đã xóa danh mục' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
