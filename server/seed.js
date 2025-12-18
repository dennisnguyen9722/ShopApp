const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Role = require('./models/Role')
const User = require('./models/User')
const bcrypt = require('bcryptjs')

dotenv.config()

// Kết nối DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ DB Connected'))
  .catch((err) => {
    console.error('❌ DB Connection Error:', err)
    process.exit(1)
  })

const seedData = async () => {
  try {
    console.log('⏳ Đang khởi tạo dữ liệu mẫu...')

    // 1. TẠO ROLE ADMIN (Nếu chưa có)
    // Dùng findOneAndUpdate với upsert để đảm bảo không bị trùng
    const adminRole = await Role.findOneAndUpdate(
      { slug: 'admin' },
      {
        name: 'Super Admin',
        slug: 'admin',
        description: 'Quản trị viên cấp cao nhất',
        permissions: [] // Admin tối thượng không cần list quyền
      },
      { upsert: true, new: true }
    )
    console.log(`✅ Role Admin ID: ${adminRole._id}`)

    // 2. TẠO USER SUPER ADMIN
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('123', salt) // Pass: 123

    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@supermall.com' },
      {
        name: 'Super Admin',
        password: hashedPassword,
        role: adminRole._id, // 🔥 QUAN TRỌNG: Gắn ID Role vào đây
        isActive: true,
        avatar: ''
      },
      { upsert: true, new: true }
    )

    console.log('------------------------------------------------')
    console.log('🎉 KHỞI TẠO THÀNH CÔNG!')
    console.log(`👤 User:  ${adminUser.email}`)
    console.log(`🔑 Pass:  123`)
    console.log(`🛡️ Role:  ${adminRole.name}`)
    console.log('------------------------------------------------')

    process.exit()
  } catch (error) {
    console.error('❌ Lỗi Seeding:', error)
    process.exit(1)
  }
}

seedData()
