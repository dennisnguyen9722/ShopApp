const express = require('express')
const router = express.Router()
const Product = require('../models/Product')

// 1. GET ALL: Lấy danh sách sản phẩm (có pagination & filter)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query

    // Build query filter
    let filter = {}
    if (category) filter.category = category
    if (search) filter.title = { $regex: search, $options: 'i' }

    const products = await Product.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 }) // Mới nhất trước

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

// 2. GET BY ID: Lấy 1 sản phẩm theo ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
    }
    res.json(product)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 3. POST: Thêm sản phẩm mới (có validation)
router.post('/', async (req, res) => {
  try {
    // Validation
    const { title, price, description, category, image } = req.body

    if (!title || !price) {
      return res.status(400).json({
        message: 'Title và Price là bắt buộc'
      })
    }

    const product = new Product({
      title,
      price,
      description,
      category,
      image
    })

    const newProduct = await product.save()
    res.status(201).json(newProduct)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 4. PUT: Cập nhật sản phẩm
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
    }

    res.json(product)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// 5. DELETE: Xóa sản phẩm
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
    }

    res.json({ message: 'Đã xóa sản phẩm thành công', product })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
