const express = require('express')
const router = express.Router()
const Product = require('../models/Product')
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

// 1. GET ALL
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query
    let filter = {}
    if (category) filter.category = category
    if (search) filter.title = { $regex: search, $options: 'i' }

    const products = await Product.find(filter)
      .populate('brand', 'name image') // 👇 MỚI: Lấy thêm thông tin brand
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const count = await Product.countDocuments(filter)

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 2. GET BY ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'brand',
      'name image'
    ) // 👇 MỚI: Populate brand ở chi tiết luôn

    if (!product)
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 3. POST: Thêm sản phẩm mới
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      price,
      originalPrice,
      description,
      content,
      category,
      brand, // 👈 LẤY BRAND TỪ BODY
      image,
      variants,
      specs
    } = req.body

    if (!title || !price) {
      return res.status(400).json({ message: 'Tên và Giá là bắt buộc' })
    }

    // Xử lý Slug
    let slug = createSlug(title)
    const existingProduct = await Product.findOne({ slug })
    if (existingProduct) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`
    }

    const product = new Product({
      title,
      slug,
      price,
      originalPrice: originalPrice || price,
      description,
      content,
      category,
      brand, // 👈 LƯU VÀO DB
      image,
      variants,
      specs
    })

    const newProduct = await product.save()
    res.status(201).json(newProduct)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 4. PUT: Cập nhật sản phẩm
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = createSlug(req.body.title)
    }

    // findByIdAndUpdate sẽ tự động cập nhật trường 'brand' nếu có trong req.body
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    if (!product)
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
    res.json(product)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 5. DELETE: Xóa sản phẩm
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product)
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
    res.json({ message: 'Đã xóa sản phẩm thành công', product })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
