// Danh sách tất cả quyền trong hệ thống
const PERMISSIONS = {
  // --- SẢN PHẨM ---
  PRODUCTS: {
    VIEW: 'products.view',
    CREATE: 'products.create',
    EDIT: 'products.edit',
    DELETE: 'products.delete'
  },
  // --- DANH MỤC ---
  CATEGORIES: {
    VIEW: 'categories.view',
    MANAGE: 'categories.manage' // Gộp chung thêm/sửa/xóa cho gọn
  },
  // --- ĐƠN HÀNG ---
  ORDERS: {
    VIEW: 'orders.view',
    UPDATE_STATUS: 'orders.update_status'
  },
  // --- NHÂN VIÊN (Chỉ Admin mới có) ---
  USERS: {
    VIEW: 'users.view',
    MANAGE: 'users.manage'
  },
  // --- PHÂN QUYỀN (Role) ---
  ROLES: {
    MANAGE: 'roles.manage'
  }
}

module.exports = PERMISSIONS
