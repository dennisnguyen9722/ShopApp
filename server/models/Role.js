const mongoose = require('mongoose')

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    }, // VD: "Nhân viên kho"

    slug: {
      type: String,
      required: true,
      unique: true
    }, // VD: "nhan-vien-kho" (dùng để check logic code)

    description: { type: String },

    // Lưu mảng các mã quyền (VD: ['products.view', 'categories.manage'])
    permissions: [{ type: String }]
  },
  { timestamps: true }
)

module.exports = mongoose.model('Role', roleSchema)
