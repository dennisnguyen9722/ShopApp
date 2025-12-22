/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Bell, Package, AlertTriangle, Star } from 'lucide-react'
import { io } from 'socket.io-client'
import { useRouter } from 'next/navigation'
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

// 👇 SỬA ĐOẠN NÀY:
// Lấy URL từ env (đang có đuôi /api), dùng .replace để cắt bỏ đuôi /api đi
// Kết quả sẽ là: https://supermall-api.onrender.com (Chuẩn cho Socket)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
const SOCKET_URL = API_URL.replace('/api', '')

interface Notification {
  id: string
  type: 'ORDER' | 'STOCK' | 'REVIEW'
  title: string
  message: string
  link: string
  time: string
  isRead: boolean
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const socketRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleNewNotification = useCallback((notif: Notification) => {
    try {
      audioRef.current?.play().catch(() => {})
    } catch (e) {}

    setNotifications((prev) => [notif, ...prev])
    setUnreadCount((prev) => prev + 1)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3')
    }

    // 👇 THÊM OPTION transports: ['websocket'] ĐỂ KẾT NỐI ỔN ĐỊNH HƠN TRÊN RENDER
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Ưu tiên websocket
      withCredentials: true // Nếu cần cookie (thường là không cần nếu set CORS *)
    })

    console.log('🔌 Connecting to Socket at:', SOCKET_URL)

    socketRef.current.on('connect', () => {
      console.log('✅ Socket Connected! ID:', socketRef.current.id)
    })

    socketRef.current.on('connect_error', (err: any) => {
      console.log('❌ Socket Error:', err.message)
    })

    socketRef.current.on('new_order', (data: any) => {
      console.log('Nhận thông báo đơn hàng:', data)
      handleNewNotification({
        id: Date.now().toString(),
        type: 'ORDER',
        title: 'Đơn hàng mới! 🤑',
        message: `Đơn #${data.orderCode} - ${data.totalPrice}`,
        link: `/orders?id=${data.orderId}`,
        time: 'Vừa xong',
        isRead: false
      })
    })

    socketRef.current.on('low_stock', (data: any) => {
      handleNewNotification({
        id: Date.now().toString(),
        type: 'STOCK',
        title: 'Cảnh báo kho ⚠️',
        message: `Sản phẩm ${data.productName} sắp hết!`,
        link: `/products/${data.productId}`,
        time: 'Vừa xong',
        isRead: false
      })
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [handleNewNotification])

  const handleItemClick = (notif: Notification) => {
    if (!notif.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      )
    }
    setIsOpen(false)
    router.push(notif.link)
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

        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Không có thông báo nào
            </div>
          ) : (
            notifications.map((item) => (
              <DropdownMenuItem
                key={item.id}
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
                      {item.time}
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
              onClick={() => setNotifications([])}
            >
              Xóa tất cả
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
