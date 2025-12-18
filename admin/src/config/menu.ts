/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  Layers,
  Tag
} from 'lucide-react'

// Định nghĩa các Role trong hệ thống
export type Role = 'admin' | 'staff' | 'manager'

export interface MenuItem {
  title: string
  href: string
  icon: any
  roles: Role[] // Những role nào được phép nhìn thấy menu này
}

export const MENU_ITEMS: MenuItem[] = [
  {
    title: 'Tổng quan',
    href: '/',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'staff'] // Ai cũng thấy
  },
  {
    title: 'Sản phẩm',
    href: '/products',
    icon: Package,
    roles: ['admin', 'manager', 'staff']
  },
  {
    title: 'Danh mục',
    href: '/categories',
    icon: Layers,
    roles: ['admin', 'manager'] // Staff có thể không cần quản lý danh mục
  },
  {
    title: 'Thương hiệu',
    href: '/brands',
    icon: Tag,
    roles: ['admin', 'manager']
  },
  {
    title: 'Nhân viên',
    href: '/users', // Sau này làm
    icon: Users,
    roles: ['admin'] // CHỈ ADMIN MỚI THẤY (Nhân viên vào không thấy dòng này)
  },
  {
    title: 'Cài đặt',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'manager'] // Staff không được chỉnh cài đặt
  }
]
