const express = require('express')
const router = express.Router()
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const { protect, checkPermission } = require('../middleware/authMiddleware') // Dùng middleware mới
const PERMISSIONS = require('../config/permissions') // Import file config quyền

// 1. LẤY DANH SÁCH NHÂN VIÊN
// Yêu cầu quyền: Xem nhân viên
router.get(
  '/',
  protect,
  checkPermission(PERMISSIONS.USERS.VIEW),
  async (req, res) => {
    try {
      // 👇 QUAN TRỌNG: Phải có .populate('role') để lấy tên Role hiển thị ra bảng
      const users = await User.find()
        .select('-password')
        .populate('role')
        .sort({ createdAt: -1 })

      res.json(users)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

// 2. TẠO NHÂN VIÊN MỚI
// Yêu cầu quyền: Quản lý nhân viên
router.post(
  '/',
  protect,
  checkPermission(PERMISSIONS.USERS.MANAGE),
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body // role ở đây là ID gửi từ Frontend

      // Validation cơ bản
      if (!name || !email || !password || !role) {
        return res
          .status(400)
          .json({ message: 'Vui lòng điền đầy đủ thông tin' })
      }

      // Check trùng email
      const userExists = await User.findOne({ email })
      if (userExists) {
        return res.status(400).json({ message: 'Email này đã được sử dụng' })
      }

      // Mã hóa pass
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      const user = new User({
        name, // 👇 Nhớ lưu thêm tên
        email,
        password: hashedPassword,
        role: role // Lưu ID của Role (Frontend gửi lên)
      })

      await user.save()

      // Populate role ngay sau khi tạo để trả về frontend hiển thị luôn
      const populatedUser = await user.populate('role')

      res.status(201).json(populatedUser)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

// 3. XÓA NHÂN VIÊN
// Yêu cầu quyền: Quản lý nhân viên
router.delete(
  '/:id',
  protect,
  checkPermission(PERMISSIONS.USERS.MANAGE),
  async (req, res) => {
    try {
      // Phải populate role để check slug
      const user = await User.findById(req.params.id).populate('role')

      if (user) {
        // 👇 Check kiểu mới: Dựa vào slug của Role
        if (user.role && user.role.slug === 'admin') {
          return res
            .status(400)
            .json({ message: 'Không thể xóa tài khoản Super Admin!' })
        }

        await User.findByIdAndDelete(req.params.id)
        res.json({ message: 'Đã xóa nhân viên' })
      } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' })
      }
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

module.exports = router
