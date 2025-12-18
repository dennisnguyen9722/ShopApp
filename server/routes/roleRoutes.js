const express = require('express')
const router = express.Router()
const Role = require('../models/Role')
const { protect, checkPermission } = require('../middleware/authMiddleware')
const PERMISSIONS = require('../config/permissions') // Import file config của bạn

// 1. Lấy danh sách Role
// Yêu cầu quyền: ROLES.MANAGE
router.get(
  '/',
  protect,
  checkPermission(PERMISSIONS.ROLES.MANAGE),
  async (req, res) => {
    try {
      const roles = await Role.find({})
      res.json(roles)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

// 2. Tạo Role mới
router.post(
  '/',
  protect,
  checkPermission(PERMISSIONS.ROLES.MANAGE),
  async (req, res) => {
    try {
      const { name, description, permissions } = req.body

      // Tạo slug từ name
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')

      const role = new Role({ name, slug, description, permissions })
      await role.save()

      res.status(201).json(role)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
)

// 3. Cập nhật Role (Quyền hạn)
router.put(
  '/:id',
  protect,
  checkPermission(PERMISSIONS.ROLES.MANAGE),
  async (req, res) => {
    try {
      const { name, description, permissions } = req.body

      const role = await Role.findByIdAndUpdate(
        req.params.id,
        {
          name,
          description,
          permissions
        },
        { new: true }
      )

      if (!role)
        return res.status(404).json({ message: 'Không tìm thấy nhóm quyền' })

      res.json(role)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
)

// 4. Xóa Role
router.delete(
  '/:id',
  protect,
  checkPermission(PERMISSIONS.ROLES.MANAGE),
  async (req, res) => {
    try {
      const role = await Role.findById(req.params.id)
      if (role.slug === 'admin') {
        return res
          .status(400)
          .json({ message: 'Không thể xóa nhóm Admin hệ thống' })
      }

      await Role.findByIdAndDelete(req.params.id)
      res.json({ message: 'Đã xóa nhóm quyền' })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

// 5. API Trả về danh sách Permission (Để Frontend vẽ bảng checkbox)
router.get('/permissions-list', protect, (req, res) => {
  // Trả về file config JSON để FE tự render
  res.json(PERMISSIONS)
})

module.exports = router
