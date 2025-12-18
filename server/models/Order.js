const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
  {
    // Thông tin khách nhận hàng
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true }
    },

    // Nếu khách đã đăng nhập thì lưu ID, khách vãng lai thì null
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Danh sách sản phẩm
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        // Lưu lại snapshot thông tin lúc mua (để lỡ sản phẩm gốc bị sửa thì đơn hàng ko bị sai)
        productName: String,
        productImage: String,

        variant: {
          color: String,
          storage: String,
          ram: String
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true } // Giá tại thời điểm mua
      }
    ],

    totalAmount: { type: Number, required: true },

    // Quy trình: pending -> confirmed -> shipping -> completed | cancelled
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'],
      default: 'pending'
    },

    paymentMethod: { type: String, default: 'COD' }, // COD, BANKING, MOMO...
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },

    note: { type: String }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Order', orderSchema)
