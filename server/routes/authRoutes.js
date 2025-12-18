const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Role = require('../models/Role') // 👈 QUAN TRỌNG: Import thêm Role

// --- 1. ĐĂNG KÝ (Tự động gán quyền Staff nếu có) ---
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email })
    if (existingUser)
      return res.status(400).json({ message: 'Email đã tồn tại' })

    // 👇 LOGIC MỚI: Tìm role mặc định để gán cho user mới (VD: Staff)
    // Nếu không tìm thấy Staff thì lấy đại role đầu tiên tìm thấy
    let defaultRole = await Role.findOne({ slug: 'staff' })
    if (!defaultRole) {
      defaultRole = await Role.findOne({}) // Fallback nếu chưa tạo role staff
    }

    if (!defaultRole) {
      return res
        .status(500)
        .json({ message: 'Lỗi hệ thống: Chưa có Role nào trong DB' })
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Tạo user mới
    const newUser = new User({
      name: name || email.split('@')[0], // Tự tạo tên nếu thiếu
      email,
      password: hashedPassword,
      role: defaultRole._id // 👈 Gắn ID Role vào
    })

    await newUser.save()

    // Trả về thông tin (kèm token luôn để đăng ký xong tự login)
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    })

    res.status(201).json({
      message: 'Tạo tài khoản thành công!',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: defaultRole
      }
    })
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message })
  }
})

// --- 2. ĐĂNG NHẬP (Đã sửa populate) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 👇 SỬA QUAN TRỌNG NHẤT Ở ĐÂY: Thêm .populate('role')
    // Để nó lấy toàn bộ thông tin role (name, slug, permissions) thay vì chỉ lấy ID
    const user = await User.findOne({ email }).populate('role')

    if (!user)
      return res.status(400).json({ message: 'Email hoặc mật khẩu sai' })

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(400).json({ message: 'Email hoặc mật khẩu sai' })

    // Kiểm tra khóa tài khoản
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' })
    }

    // Tạo Token
    const token = jwt.sign(
      { id: user._id }, // Chỉ cần lưu ID vào token là đủ
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.json({
      token,
      // 👇 Trả về Role đầy đủ (Object) để Frontend check quyền
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // Gửi role xuống cho chắc
        avatar: user.avatar
      }
    })
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message })
  }
})

// --- 3. API Lấy thông tin bản thân (Me) ---
// Dùng để reload lại trang mà không mất thông tin user
const { protect } = require('../middleware/authMiddleware') // Import middleware
router.get('/me', protect, async (req, res) => {
  try {
    // req.user đã được middleware populate role rồi
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
