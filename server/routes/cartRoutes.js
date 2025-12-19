const express = require('express')
const router = express.Router()
const Cart = require('../models/Cart')
const { protect } = require('../middleware/authMiddleware')

// GET: Lấy giỏ hàng của User hiện tại
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product'
    )
    if (!cart) {
      // Nếu chưa có giỏ thì trả về mảng rỗng chứ không báo lỗi
      return res.json({ items: [] })
    }
    res.json(cart)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST: Thêm vào giỏ hàng
router.post('/add', protect, async (req, res) => {
  const { productId, quantity = 1, variants } = req.body

  try {
    let cart = await Cart.findOne({ user: req.user._id })

    // Nếu user chưa có giỏ hàng -> Tạo mới
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] })
    }

    // Kiểm tra xem sản phẩm + biến thể này đã có trong giỏ chưa
    // (So sánh ID sản phẩm và JSON string của biến thể để xác định trùng)
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        JSON.stringify(item.variants) === JSON.stringify(variants)
    )

    if (itemIndex > -1) {
      // Nếu có rồi -> Cộng thêm số lượng
      cart.items[itemIndex].quantity += quantity
    } else {
      // Nếu chưa -> Thêm mới
      cart.items.push({ product: productId, quantity, variants })
    }

    await cart.save()

    // Populate để trả về dữ liệu đầy đủ (ảnh, tên...) cho Frontend hiển thị ngay
    await cart.populate('items.product')

    res.json(cart)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 3. PUT: Cập nhật số lượng item
router.put('/update', protect, async (req, res) => {
  const { productId, variants, quantity } = req.body
  try {
    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) return res.status(404).json({ message: 'Giỏ hàng trống' })

    // Tìm đúng sản phẩm với đúng biến thể
    const itemIndex = cart.items.findIndex(
      (p) =>
        p.product.toString() === productId &&
        JSON.stringify(p.variants) === JSON.stringify(variants)
    )

    if (itemIndex > -1) {
      if (quantity > 0) {
        cart.items[itemIndex].quantity = quantity
      } else {
        // Nếu số lượng <= 0 thì xóa luôn
        cart.items.splice(itemIndex, 1)
      }
      await cart.save()
      await cart.populate('items.product') // Trả về data đầy đủ để App update
      res.json(cart)
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ' })
    }
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 4. DELETE: Xóa sản phẩm khỏi giỏ
router.post('/remove', protect, async (req, res) => {
  const { productId, variants } = req.body
  try {
    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) return res.status(404).json({ message: 'Giỏ hàng trống' })

    // Lọc bỏ sản phẩm trùng ID và Variants
    cart.items = cart.items.filter(
      (p) =>
        !(
          p.product.toString() === productId &&
          JSON.stringify(p.variants) === JSON.stringify(variants)
        )
    )

    await cart.save()
    await cart.populate('items.product')
    res.json(cart)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
