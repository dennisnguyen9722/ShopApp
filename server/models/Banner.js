const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String }, // Tên banner (để quản lý)
    image: { type: String, required: true }, // Link ảnh
    link: { type: String }, // Bấm vào ảnh thì nhảy đi đâu (VD: /products/iphone-15)
    isActive: { type: Boolean, default: true }, // Ẩn/Hiện
    order: { type: Number, default: 0 } // Thứ tự hiển thị
  },
  { timestamps: true }
)

module.exports = mongoose.model('Banner', bannerSchema)
