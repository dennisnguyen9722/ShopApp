const express = require('express')
const router = express.Router()
const Brand = require('../models/Brand')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// Hàm tạo slug
function createSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .trim()
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
}

// ==============================================================================
// 1. GET ALL (Có Phân trang & Tìm kiếm)
// Query: ?page=1&limit=10&search=samsung
// ==============================================================================
router.get('/', async (req, res) => {
  try {
    // 1. Lấy tham số (Mặc định trang 1, 10 dòng)
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''

    // 2. Tạo bộ lọc
    const query = {}

    // Tìm kiếm theo tên thương hiệu
    if (search) {
      query.name = { $regex: search, $options: 'i' }
    }

    // 3. Chạy song song: Tìm dữ liệu + Đếm tổng
    const [brands, total] = await Promise.all([
      Brand.find(query)
        .sort({ name: 1 }) // A-Z
        .skip(skip)
        .limit(limit),
      Brand.countDocuments(query)
    ])

    // 4. Trả về cấu trúc chuẩn
    res.json({
      success: true,
      brands,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ==============================================================================
// 2. CREATE (Admin/Manager)
// ==============================================================================
router.post('/', protect, async (req, res) => {
  try {
    const { name, image, description } = req.body

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

// ==============================================================================
// 3. UPDATE (Admin Only)
// ==============================================================================
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, image, description } = req.body
    const brand = await Brand.findById(req.params.id)

    if (!brand)
      return res.status(404).json({ message: 'Không tìm thấy thương hiệu' })

    // Check trùng tên nếu đổi tên (trừ chính nó)
    if (name && name !== brand.name) {
      const exists = await Brand.findOne({ name, _id: { $ne: req.params.id } })
      if (exists)
        return res.status(400).json({ message: 'Tên thương hiệu bị trùng' })

      brand.name = name
      brand.slug = createSlug(name)
    }

    if (image) brand.image = image
    if (description) brand.description = description

    const updatedBrand = await brand.save()
    res.json(updatedBrand)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ==============================================================================
// 4. DELETE (Admin Only)
// ==============================================================================
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id)
    if (!brand)
      return res.status(404).json({ message: 'Không tìm thấy thương hiệu' })

    res.json({ message: 'Đã xóa thương hiệu thành công' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
