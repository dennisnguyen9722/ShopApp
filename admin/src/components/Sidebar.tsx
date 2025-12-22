'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Layers,
  Tags,
  Users,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  Megaphone,
  MessageSquare,
  Settings,
  Warehouse
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

// Định nghĩa Menu kèm theo "Mã quyền cần thiết" (permission)
// Nếu permission = undefined thì ai cũng thấy (miễn là đã login)
const menuItems = [
  {
    title: 'Tổng quan',
    icon: LayoutDashboard,
    href: '/',
    permission: undefined // Ai cũng xem được Dashboard
  },
  {
    title: 'Sản phẩm',
    icon: Package,
    href: '/products',
    permission: 'products.view' // Cần quyền xem sản phẩm
  },
  {
    title: 'Kho hàng',
    icon: Warehouse,
    href: '/inventory',
    permission: 'products.view' // Dùng chung quyền với sản phẩm hoặc tạo quyền 'inventory.manage' riêng
  },
  {
    title: 'Danh mục',
    icon: Layers,
    href: '/categories',
    permission: 'categories.view'
  },
  {
    title: 'Thương hiệu',
    icon: Tags,
    href: '/brands',
    permission: 'categories.view' // Tạm dùng chung quyền với danh mục hoặc tạo quyền mới
  },
  {
    title: 'Đơn hàng',
    icon: ShoppingBag,
    href: '/orders',
    permission: 'orders.view'
  },
  {
    title: 'Đánh giá',
    icon: MessageSquare,
    href: '/reviews',
    permission: 'reviews.manage' // Hoặc 'products.view' tùy bạn
  },
  {
    title: 'Marketing',
    icon: Megaphone,
    href: '/marketing',
    permission: 'marketing.manage' // Hoặc undefined nếu ai cũng xem được
  },
  {
    title: 'Khách hàng',
    icon: Users, // Nhớ import icon Users
    href: '/customers',
    permission: 'customers.view' // Hoặc 'users.view' tùy bạn config
  },
  {
    title: 'Nhân viên',
    icon: Users,
    href: '/users',
    permission: 'users.view'
  },
  {
    title: 'Phân quyền',
    icon: ShieldCheck,
    href: '/roles',
    permission: 'roles.manage'
  },
  {
    title: 'Cấu hình',
    icon: Settings,
    href: '/settings',
    permission: undefined // Ai login rồi cũng nên có quyền chỉnh profile cá nhân, còn chỉnh Shop thì API đã chặn
  }
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  // 1. Kiểm tra xem User có phải Admin không?
  // (Lưu ý: user.role có thể là string hoặc object tùy thời điểm load, ta check kỹ)
  const roleSlug = typeof user.role === 'string' ? user.role : user.role?.slug
  const isAdmin = roleSlug === 'admin'

  // 2. Lấy danh sách quyền của User
  // Nếu là admin thì ko cần list này, còn lại thì lấy mảng permissions
  const userPermissions =
    typeof user.role === 'object' ? user.role?.permissions || [] : []

  // Helper check quyền
  const hasPermission = (requiredPerm?: string) => {
    if (isAdmin) return true // Admin chấp hết
    if (!requiredPerm) return true // Không yêu cầu quyền -> Cho qua
    return userPermissions.includes(requiredPerm) // Check xem có trong mảng permissions ko
  }

  // Helper hiển thị tên Role
  const roleName = typeof user.role === 'object' ? user.role?.name : user.role

  return (
    <aside className="w-64 bg-white border-r h-screen fixed left-0 top-0 flex flex-col z-50 shadow-sm">
      {/* HEADER */}
      <div className="p-6 border-b flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-800 tracking-tight">
          SuperMall
        </span>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">
          Menu chính
        </p>

        {menuItems.map((item) => {
          // 👇 LOGIC QUAN TRỌNG NHẤT: Check quyền ở đây
          if (hasPermission(item.permission)) {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                {item.title}
              </Link>
            )
          }
          return null
        })}
      </nav>

      {/* FOOTER USER */}
      <div className="p-4 border-t bg-gray-50/50">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-indigo-600 font-medium truncate">
              {roleName || 'Chưa cấp quyền'}
            </p>
          </div>

          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
