const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Order = require('./models/Order')
const Product = require('./models/Product')

dotenv.config()

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ DB Connected'))

const seedOrders = async () => {
  try {
    // Lấy đại 1 sản phẩm thật trong DB để gắn vào đơn
    const product = await Product.findOne()
    if (!product) {
      console.log('❌ Cần tạo ít nhất 1 sản phẩm trước khi seed đơn hàng!')
      process.exit()
    }

    const dummyOrders = [
      {
        customer: {
          name: 'Nguyễn Văn A',
          email: 'khach1@gmail.com',
          phone: '0988123456',
          address: '123 Cầu Giấy, Hà Nội'
        },
        items: [
          {
            product: product._id,
            productName: product.title,
            productImage: product.image,
            variant: { color: 'Titan Tự nhiên', storage: '256GB' },
            quantity: 1,
            price: product.price
          }
        ],
        totalAmount: product.price,
        status: 'pending'
      },
      {
        customer: {
          name: 'Trần Thị B',
          email: 'khach2@gmail.com',
          phone: '0912345678',
          address: '456 Lê Lợi, TP.HCM'
        },
        items: [
          {
            product: product._id,
            productName: product.title,
            productImage: product.image,
            variant: { color: 'Đen', storage: '512GB' },
            quantity: 2,
            price: product.price
          }
        ],
        totalAmount: product.price * 2,
        status: 'confirmed'
      }
    ]

    await Order.insertMany(dummyOrders)
    console.log('✅ Đã tạo 2 đơn hàng mẫu!')
    process.exit()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

seedOrders()
