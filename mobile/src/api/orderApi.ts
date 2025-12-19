import axiosClient from './axiosClient'

export const orderApi = {
  // Gọi API tạo đơn hàng thật
  createOrder: (orderData: any) => {
    return axiosClient.post('/orders', orderData)
  }
}
