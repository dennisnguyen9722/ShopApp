const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Tên danh mục không được trùng
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true
      // Ví dụ: Tên là "Thời Trang Nam" -> slug là "thoi-trang-nam" (để làm URL cho đẹp)
    },
    image: {
      type: String,
      default: ''
    },
    description: String
  },
  { timestamps: true }
)

module.exports = mongoose.model('Category', categorySchema)
