'use client'

import React from 'react'
import { NotificationDropdown } from '@/components/NotificationDropdown'
import { Menu, Search, User, LogOut } from 'lucide-react' // Import thêm LogOut cho đẹp
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// 👇 1. IMPORT HOOK AUTH
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  // 👇 2. LẤY DATA USER VÀ HÀM LOGOUT
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm">
      {/* --- LEFT SIDE: Mobile Menu & Search --- */}
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative hidden md:block w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Tìm kiếm đơn hàng, sản phẩm..."
            className="w-full bg-slate-50 pl-9 focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      {/* --- RIGHT SIDE: Actions --- */}
      <div className="flex items-center gap-3">
        {/* Component Thông báo (Socket.io) */}
        <NotificationDropdown />

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* 3. USER PROFILE DROPDOWN (Đã sửa dynamic data) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9 border border-slate-200">
                {/* 👇 Hiển thị Avatar thật của user */}
                <AvatarImage
                  src={user?.avatar}
                  alt={user?.name || 'User'}
                  className="object-cover" // Thêm object-cover cho ảnh đẹp
                />

                {/* 👇 Fallback: Nếu không có ảnh thì lấy chữ cái đầu */}
                <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {/* 👇 Hiển thị Tên thật */}
                <p className="text-sm font-medium leading-none">
                  {user?.name || 'Người dùng'}
                </p>
                {/* 👇 Hiển thị Email thật */}
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email || 'no-email@supermall.com'}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Hồ sơ cá nhân</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer">
              Cài đặt
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* 👇 Gắn hàm Logout vào đây */}
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
