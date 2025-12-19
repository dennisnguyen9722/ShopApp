import AsyncStorage from '@react-native-async-storage/async-storage'
import { cartApi } from '../api/cartApi'

const CART_KEY = 'supermall_local_cart'

export const CartService = {
  // 1. Lấy giỏ hàng (Tự động chọn Online hoặc Offline)
  getCart: async () => {
    const token = await AsyncStorage.getItem('token')

    if (token) {
      // ✅ Đã đăng nhập: Gọi API Server
      try {
        const res = await cartApi.getCart()
        return res.data.items || []
      } catch (error) {
        return []
      }
    } else {
      // 🚀 Khách vãng lai: Lấy từ bộ nhớ máy
      const jsonValue = await AsyncStorage.getItem(CART_KEY)
      return jsonValue != null ? JSON.parse(jsonValue) : []
    }
  },

  // 2. Thêm vào giỏ
  addToCart: async (product: any, quantity: number, variants: any) => {
    const token = await AsyncStorage.getItem('token')

    if (token) {
      // ✅ Online
      return await cartApi.addToCart(product._id, quantity, variants)
    } else {
      // 🚀 Offline: Tự xử lý logic thêm/cộng dồn
      let cart = await CartService.getCart()

      // Tìm xem món này (cùng ID + cùng variants) đã có chưa
      const existingIndex = cart.findIndex(
        (item: any) =>
          item.product._id === product._id &&
          JSON.stringify(item.variants) === JSON.stringify(variants)
      )

      if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity
      } else {
        cart.push({
          product: product, // Lưu nguyên cục info sản phẩm vào để hiển thị
          quantity,
          variants
        })
      }

      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart))
      return cart
    }
  },

  // 3. Cập nhật số lượng
  updateQuantity: async (
    productId: string,
    quantity: number,
    variants: any
  ) => {
    const token = await AsyncStorage.getItem('token')

    if (token) {
      return await cartApi.updateQuantity(productId, quantity, variants)
    } else {
      let cart = await CartService.getCart()

      const index = cart.findIndex(
        (item: any) =>
          item.product._id === productId &&
          JSON.stringify(item.variants) === JSON.stringify(variants)
      )

      if (index > -1) {
        if (quantity > 0) {
          cart[index].quantity = quantity
        } else {
          cart.splice(index, 1) // Xóa luôn nếu số lượng <= 0
        }
        await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart))
      }
      return { data: { items: cart } } // Trả về cấu trúc giả lập giống API
    }
  },

  // 4. Xóa sản phẩm
  removeItem: async (productId: string, variants: any) => {
    const token = await AsyncStorage.getItem('token')

    if (token) {
      return await cartApi.removeItem(productId, variants)
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
      return { data: { items: cart } }
    }
  },

  // 5. Xóa sạch giỏ (Dùng khi đặt hàng xong)
  clearCart: async () => {
    const token = await AsyncStorage.getItem('token')
    if (!token) {
      await AsyncStorage.removeItem(CART_KEY)
    }
    // Nếu Online thì API đặt hàng xong backend tự xóa hoặc mình gọi API clear (tuỳ logic)
  }
}
