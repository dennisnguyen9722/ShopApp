const mongoose = require('mongoose')

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true }, // VD: SALE50
    discountType: { type: String, enum: ['percent', 'amount'], required: true }, // Giảm theo % hoặc Tiền mặt
    discountValue: { type: Number, required: true }, // Giá trị giảm (VD: 10 (%) hoặc 50000 (đ))

    minOrderValue: { type: Number, default: 0 }, // Đơn tối thiểu để áp dụng
    maxDiscount: { type: Number }, // Giảm tối đa bao nhiêu (cho loại %)

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    usageLimit: { type: Number, default: 100 }, // Tổng số lần được dùng
    usedCount: { type: Number, default: 0 }, // Đã dùng bao nhiêu lần

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Voucher', voucherSchema)
