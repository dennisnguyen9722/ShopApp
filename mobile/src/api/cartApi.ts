import axiosClient from './axiosClient'

export const cartApi = {
  getCart: () => {
    return axiosClient.get('/cart')
  },
  addToCart: (productId: string, quantity: number, variants: any) => {
    return axiosClient.post('/cart/add', {
      productId,
      quantity,
      variants
    })
  },
  // 👇 Mới thêm
  updateQuantity: (productId: string, quantity: number, variants: any) => {
    return axiosClient.put('/cart/update', { productId, quantity, variants })
  },
  removeItem: (productId: string, variants: any) => {
    return axiosClient.post('/cart/remove', { productId, variants })
  }
}
