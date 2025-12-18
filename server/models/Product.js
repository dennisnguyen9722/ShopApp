const mongoose = require('mongoose')

// 1. Schema cho Biến thể Công nghệ (RAM/Storage/Color)
const variantSchema = new mongoose.Schema({
  sku: String, // Mã kho (VD: IP15-256-BLU)
  ram: String, // VD: 8GB
  storage: String, // VD: 256GB, 512GB, 1TB
  color: String, // VD: Titan Xanh
  price: Number, // Giá riêng cho bản này (VD: bản 512GB đắt hơn)
  stock: { type: Number, default: 0 },
  image: String
})

// 2. Schema cho Thông số kỹ thuật (Specs)
const specSchema = new mongoose.Schema(
  {
    k: String, // Key (VD: "Màn hình")
    v: String // Value (VD: "OLED 6.7 inch, 120Hz")
  },
  { _id: false }
) // Không cần ID cho dòng này

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },

    // Giá cơ bản (hiển thị đại diện)
    originalPrice: { type: Number, required: true },
    price: { type: Number, required: true },

    description: String,
    content: String,

    category: { type: String },
    image: { type: String },

    // ✨ MỚI: Mảng thông số kỹ thuật (Dynamic)
    specs: [specSchema],

    // ✨ MỚI: Biến thể theo kiểu công nghệ
    variants: [variantSchema]
  },
  { timestamps: true }
)

module.exports = mongoose.model('Product', productSchema)
