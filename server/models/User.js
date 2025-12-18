const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // 👇 LIÊN KẾT VỚI BẢNG ROLE (QUAN TRỌNG)
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true
    },

    avatar: { type: String },
    isActive: { type: Boolean, default: true } // Dùng để khóa tài khoản
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
