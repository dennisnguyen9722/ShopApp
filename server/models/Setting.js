const mongoose = require('mongoose')

const settingSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'SuperMall' },
    logo: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    // Link mạng xã hội (Optional)
    facebook: { type: String, default: '' },
    zalo: { type: String, default: '' }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Setting', settingSchema)
