const jwt = require('jsonwebtoken')
const User = require('../models/User')
// eslint-disable-next-line no-unused-vars
const Role = require('../models/Role') // Import để populate hoạt động

// 1. Middleware xác thực đăng nhập (Token hợp lệ?)
const protect = async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // 👇 Populate 'role' để lấy được mảng permissions bên trong
      req.user = await User.findById(decoded.id)
        .select('-password')
        .populate('role')

      if (!req.user) {
        return res.status(401).json({ message: 'User không tồn tại' })
      }

      // Chặn nếu tài khoản bị khóa
      if (req.user.isActive === false) {
        return res.status(403).json({ message: 'Tài khoản đã bị khóa' })
      }

      next()
    } catch (error) {
      console.error(error)
      res
        .status(401)
        .json({ message: 'Token không hợp lệ, vui lòng đăng nhập lại' })
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Không có token, vui lòng đăng nhập' })
  }
}

// 2. Middleware kiểm tra quyền (RBAC Check)
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    // Nếu user lỗi hoặc không có role
    if (!req.user || !req.user.role) {
      return res
        .status(403)
        .json({ message: 'Không có quyền truy cập (No Role)' })
    }

    // 👑 BACKDOOR: Nếu là 'admin' (Super Admin) thì cho qua hết
    if (req.user.role.slug === 'admin') {
      return next()
    }

    // Kiểm tra permission
    const userPermissions = req.user.role.permissions || []

    if (userPermissions.includes(requiredPermission)) {
      return next() // Có quyền -> Đi tiếp
    } else {
      return res
        .status(403)
        .json({ message: `Bạn thiếu quyền truy cập: ${requiredPermission}` })
    }
  }
}

// Giữ lại hàm cũ để tránh lỗi code cũ (nếu còn dùng), nhưng nên thay dần bằng checkPermission
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role && req.user.role.slug === 'admin') {
    next()
  } else {
    res.status(403).json({ message: 'Chỉ Admin mới có quyền này' })
  }
}

module.exports = { protect, checkPermission, adminOnly }
