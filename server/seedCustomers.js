const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Customer = require('./models/Customer')
const bcrypt = require('bcryptjs')

dotenv.config()
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ DB Connected'))

const seedCustomers = async () => {
  try {
    // Xóa cũ nếu muốn: await Customer.deleteMany({})

    const salt = await bcrypt.genSalt(10)
    const password = await bcrypt.hash('123456', salt)

    const dummyCustomers = [
      {
        name: 'Phạm Hương',
        email: 'huong@gmail.com',
        phone: '0909111222',
        address: 'Quận 1, TP.HCM',
        password
      },
      {
        name: 'Lê Văn Luyện',
        email: 'luyen@gmail.com',
        phone: '0912345678',
        address: 'Bắc Giang',
        password,
        isBlocked: true
      },
      {
        name: 'Trần Dần',
        email: 'tran@gmail.com',
        phone: '0988777666',
        address: 'Cali, USA',
        password
      }
    ]

    await Customer.insertMany(dummyCustomers)
    console.log('✅ Đã tạo khách hàng mẫu!')
    process.exit()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

seedCustomers()
