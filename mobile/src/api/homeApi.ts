// src/api/productApi.ts
import axiosClient from './axiosClient'

export const homeApi = {
  getCategories: () => {
    return axiosClient.get('/categories')
  },
  getBanners: () => {
    return axiosClient.get('/banners')
  },
  getProducts: (params?: any) => {
    return axiosClient.get('/products', { params })
  },

  // Lấy chi tiết 1 sản phẩm
  getDetail: (id: string) => {
    return axiosClient.get(`/products/${id}`)
  }
}
