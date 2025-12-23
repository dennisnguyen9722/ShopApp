/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Bell, Package, AlertTriangle, Star } from 'lucide-react'
import { io } from 'socket.io-client'
import { useRouter } from 'next/navigation'
// 👇 1. IMPORT TOAST
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import axiosClient from '@/lib/axiosClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
const SOCKET_URL = API_URL.replace('/api', '')

interface Notification {
  _id: string
  type: 'ORDER' | 'STOCK' | 'REVIEW'
  title: string
  message: string
  link: string
  createdAt: string
  isRead: boolean
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const socketRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await axiosClient.get('/notifications')
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.isRead).length)
      } catch (error) {
        console.log('Lỗi lấy thông báo:', error)
      }
    }
    fetchNotifications()
  }, [])

  const handleNewNotification = useCallback(
    (notif: Notification) => {
      // Phát âm thanh
      try {
        audioRef.current?.play().catch(() => {})
      } catch (e) {}

      // Cập nhật danh sách chuông
      setNotifications((prev) => [notif, ...prev])
      setUnreadCount((prev) => prev + 1)

      // 👇 2. HIỆN TOAST (PHẦN BẠN CẦN)
      // Tùy vào loại thông báo mà hiện màu khác nhau
      if (notif.type === 'ORDER') {
        toast.success(notif.title, {
          description: notif.message,
          duration: 5000,
          action: {
            label: 'Xem ngay',
            onClick: () => router.push(notif.link) // Bấm vào toast là chuyển trang luôn
          },
          style: {
            border: '1px solid #10B981',
            color: '#064E3B',
            background: '#ECFDF5'
          } // Màu xanh lá
        })
      } else if (notif.type === 'STOCK') {
        toast.error(notif.title, {
          description: notif.message,
          action: {
            label: 'Kiểm tra',
            onClick: () => router.push(notif.link)
          }
        })
      } else {
        toast.info(notif.title, { description: notif.message })
      }
    },
    [router]
  ) // Nhớ thêm router vào dependency

  // 3. KẾT NỐI SOCKET
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3') // Đảm bảo đường dẫn đúng
    }

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    })

    // Lắng nghe Đơn hàng mới
    socketRef.current.on('new_order', (data: any) => {
      handleNewNotification({
        _id: Date.now().toString(),
        type: 'ORDER',
        title: 'Đơn hàng mới! 🤑',
        message: `Đơn #${data.orderCode} - ${data.customerName}\nTổng tiền: ${data.totalPrice}`,
        link: `/orders?id=${data.orderId}`, // Đảm bảo link đúng admin
        createdAt: new Date().toISOString(),
        isRead: false
      })
    })

    // Lắng nghe Low Stock
    socketRef.current.on('low_stock', (data: any) => {
      handleNewNotification({
        _id: Date.now().toString(),
        type: 'STOCK',
        title: 'Cảnh báo kho ⚠️',
        message: `Sản phẩm ${data.productName} sắp hết (còn ${data.stock})!`,
        link: `/products?id=${data.productId}`,
        createdAt: new Date().toISOString(),
        isRead: false
      })
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [handleNewNotification])

  // ... (Phần UI Dropdown bên dưới GIỮ NGUYÊN không cần sửa) ...

  // Logic đánh dấu đã đọc
  const handleItemClick = (notif: Notification) => {
    setUnreadCount((prev) => Math.max(0, prev - 1))
    setNotifications((prev) =>
      prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
    )
    setIsOpen(false)
    router.push(notif.link)
  }

  const handleClearAll = async () => {
    setNotifications([])
    setUnreadCount(0)
    try {
      await axiosClient.put('/notifications/read-all')
    } catch (e) {}
  }

  const renderIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <Package className="w-4 h-4 text-green-600" />
      case 'STOCK':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'REVIEW':
        return <Star className="w-4 h-4 text-yellow-500" />
      default:
        return <Bell className="w-4 h-4 text-blue-600" />
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-white animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 bg-white shadow-lg border-slate-100 rounded-xl"
      >
        <DropdownMenuLabel className="flex justify-between items-center px-4 py-3">
          <span>Thông báo</span>
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="text-xs bg-indigo-50 text-indigo-600"
            >
              {unreadCount} mới
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Không có thông báo nào
            </div>
          ) : (
            notifications.map((item) => (
              <DropdownMenuItem
                key={item._id}
                onClick={() => handleItemClick(item)}
                className={`cursor-pointer px-4 py-3 border-b border-slate-50 last:border-0 items-start gap-3 ${
                  item.isRead ? 'opacity-60 bg-white' : 'bg-blue-50/30'
                }`}
              >
                <div className="mt-1 bg-white p-2 rounded-full shadow-sm border">
                  {renderIcon(item.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-sm text-slate-800">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>
                {!item.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-2 border-t text-center">
            <Button
              variant="link"
              size="sm"
              className="text-xs text-slate-500 h-auto p-0"
              onClick={handleClearAll}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
