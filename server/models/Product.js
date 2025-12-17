// models/Product.js
const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title là bắt buộc'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price là bắt buộc'],
      min: [0, 'Price phải lớn hơn 0']
    },
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'other'
    },
    image: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true // Tự động thêm createdAt, updatedAt
  }
)

module.exports = mongoose.model('Product', productSchema)
