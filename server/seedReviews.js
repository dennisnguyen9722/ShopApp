const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Review = require('./models/Review')
const Product = require('./models/Product')
const Customer = require('./models/Customer')

dotenv.config()
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ DB Connected'))

const seedReviews = async () => {
  try {
    const product = await Product.findOne()
    const customer = await Customer.findOne()

    if (!product || !customer) {
      console.log('❌ Cần có Sản phẩm và Khách hàng trước!')
      process.exit()
    }

    const dummyReviews = [
      {
        customer: customer._id,
        product: product._id,
        rating: 5,
        comment: 'Sản phẩm quá tuyệt vời, đóng gói cẩn thận!',
        adminReply: 'Cảm ơn bạn đã ủng hộ shop ạ ❤️'
      },
      {
        customer: customer._id,
        product: product._id,
        rating: 3,
        comment: 'Giao hàng hơi chậm, nhưng hàng dùng ổn.',
        isHidden: false
      },
      {
        customer: customer._id,
        product: product._id,
        rating: 1,
        comment: 'Hàng lởm, đừng mua phí tiền! Scam lừa đảo!',
        isHidden: true // Admin đã ẩn cái này
      }
    ]

    await Review.insertMany(dummyReviews)
    console.log('✅ Đã tạo đánh giá mẫu!')
    process.exit()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

seedReviews()
