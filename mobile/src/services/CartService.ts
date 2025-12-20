import AsyncStorage from '@react-native-async-storage/async-storage'
import { cartApi } from '../api/cartApi'

const CART_KEY = 'supermall_local_cart'

// 👇 Danh sách những nơi đang "hóng" sự thay đổi của giỏ hàng
let listeners: Array<() => void> = []

export const CartService = {
  // --- CƠ CHẾ EVENT EMITTER (MỚI THÊM) ---
  // Gọi hàm này để thông báo cho toàn bộ app biết giỏ hàng đã đổi
  emitChange: () => {
    listeners.forEach((listener) => listener())
  },

  // Các màn hình dùng hàm này để đăng ký lắng nghe
  onChange: (listener: () => void) => {
    listeners.push(listener)
    // Trả về hàm huỷ đăng ký (cleanup)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  },
  // ----------------------------------------

  getCart: async () => {
    const token = await AsyncStorage.getItem('token')
    if (token) {
      try {
        const res = await cartApi.getCart()
        return res.data.items || []
      } catch (error) {
        return []
      }
    } else {
      const jsonValue = await AsyncStorage.getItem(CART_KEY)
      return jsonValue != null ? JSON.parse(jsonValue) : []
    }
  },

  // Đếm tổng số lượng item để hiển thị lên Badge
  getCartCount: async () => {
    const items = await CartService.getCart()
    return items.reduce((total: number, item: any) => total + item.quantity, 0)
  },

  addToCart: async (product: any, quantity: number, variants: any) => {
    const token = await AsyncStorage.getItem('token')
    let cart = []

    if (token) {
      await cartApi.addToCart(product._id, quantity, variants)
    } else {
      cart = await CartService.getCart()
      const existingIndex = cart.findIndex(
        (item: any) =>
          item.product._id === product._id &&
          JSON.stringify(item.variants) === JSON.stringify(variants)
      )

      if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity
      } else {
        cart.push({ product, quantity, variants })
      }
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart))
    }

    // 👇 QUAN TRỌNG: Thông báo thay đổi sau khi thêm xong
    CartService.emitChange()
    return cart
  },

  updateQuantity: async (
    productId: string,
    quantity: number,
    variants: any
  ) => {
    const token = await AsyncStorage.getItem('token')
    if (token) {
      await cartApi.updateQuantity(productId, quantity, variants)
    } else {
      const cart = await CartService.getCart()
      const index = cart.findIndex(
        (item: any) =>
          item.product._id === productId &&
          JSON.stringify(item.variants) === JSON.stringify(variants)
      )
      if (index > -1) {
        if (quantity > 0) cart[index].quantity = quantity
        else cart.splice(index, 1)
        await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart))
      }
    }
    // 👇 Thông báo thay đổi
    CartService.emitChange()
  },

  removeItem: async (productId: string, variants: any) => {
    const token = await AsyncStorage.getItem('token')
    if (token) {
      await cartApi.removeItem(productId, variants)
    } else {
      let cart = await CartService.getCart()
      cart = cart.filter(
        (item: any) =>
          !(
            item.product._id === productId &&
            JSON.stringify(item.variants) === JSON.stringify(variants)
          )
      )
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart))
    }
    // 👇 Thông báo thay đổi
    CartService.emitChange()
  },

  clearCart: async () => {
    const token = await AsyncStorage.getItem('token')
    if (!token) await AsyncStorage.removeItem(CART_KEY)

    // 👇 Thông báo thay đổi
    CartService.emitChange()
  }
}
