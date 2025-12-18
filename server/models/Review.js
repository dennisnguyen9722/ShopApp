const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema(
  {
    // Người đánh giá (Khách hàng)
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },

    // Sản phẩm được đánh giá
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },

    rating: { type: Number, required: true, min: 1, max: 5 }, // 1 đến 5 sao
    comment: { type: String, required: true },

    // Phản hồi của Admin
    adminReply: { type: String, default: '' },

    // Trạng thái hiển thị (False = Hiện, True = Ẩn đi do vi phạm)
    isHidden: { type: Boolean, default: false }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Review', reviewSchema)
