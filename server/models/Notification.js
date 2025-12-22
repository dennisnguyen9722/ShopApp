const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // 'ORDER', 'STOCK', 'REVIEW'
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, required: true }, // Link để click vào
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Notification', notificationSchema)
