// src/hooks/useCartCount.ts
import { useEffect, useState } from 'react'
import { CartService } from '../services/CartService'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'

export function useCartCount() {
  const [count, setCount] = useState(0)

  const updateCount = async () => {
    const total = await CartService.getCartCount()
    setCount(total)
  }

  // 1. Lắng nghe sự kiện từ CartService (khi bấm cộng/trừ ở bất cứ đâu)
  useEffect(() => {
    updateCount() // Load lần đầu
    const unsubscribe = CartService.onChange(() => {
      updateCount() // Load lại khi có thông báo thay đổi
    })
    return unsubscribe // Dọn dẹp khi unmount
  }, [])

  // 2. Load lại khi màn hình được focus (phòng trường hợp quay lại từ trang khác)
  useFocusEffect(
    useCallback(() => {
      updateCount()
    }, [])
  )

  return count
}
