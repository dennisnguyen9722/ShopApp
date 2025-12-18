const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Mật khẩu đăng nhập App mua hàng
    phone: { type: String },
    address: { type: String },
    avatar: { type: String, default: '' },

    isBlocked: { type: Boolean, default: false }, // True = Chặn không cho đăng nhập

    // Thống kê nhanh (Optional - có thể tính toán realtime)
    totalSpent: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Customer', customerSchema)
