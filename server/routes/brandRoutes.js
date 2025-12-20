const express = require('express')
const router = express.Router()
const Brand = require('../models/Brand')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// Hàm tạo slug
function createSlug(text) {
  return text
    .toString()
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

    // Kiểm tra trùng tên trước khi tạo (Optional nhưng nên có)
    const brandExists = await Brand.findOne({ name })
    if (brandExists) {
      return res.status(400).json({ message: 'Thương hiệu đã tồn tại' })
    }

    const slug = createSlug(name)
    const newBrand = new Brand({ name, slug, image, description })
    await newBrand.save()
    res.status(201).json(newBrand)
  } catch (err) {
    res.status(400).json({ message: 'Lỗi dữ liệu đầu vào' })
  }
})

// 3. Sửa thương hiệu (MỚI THÊM) - Chỉ Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, image, description } = req.body
    const brand = await Brand.findById(req.params.id)

    if (!brand) {
      return res.status(404).json({ message: 'Không tìm thấy thương hiệu' })
    }

    // Cập nhật từng trường
    if (name) {
      brand.name = name
      brand.slug = createSlug(name) // Tên đổi thì Slug đổi theo
    }
    if (image) {
      brand.image = image
    }
    if (description) {
      brand.description = description
    }

    const updatedBrand = await brand.save()
    res.json(updatedBrand)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 4. Xóa thương hiệu (Chỉ Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id)
    if (!brand) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy thương hiệu để xóa' })
    }
    res.json({ message: 'Đã xóa thương hiệu thành công' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
