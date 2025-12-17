// src/api/productApi.ts
import axios from 'axios'
import { Product } from '../types'

const BASE_URL = 'https://fakestoreapi.com'

// Hàm lấy tất cả sản phẩm
export const fetchProducts = async (): Promise<Product[]> => {
  const response = await axios.get(`${BASE_URL}/products`)
  return response.data
}

// Hàm lấy chi tiết 1 sản phẩm (nếu cần sau này)
export const fetchProductById = async (id: number): Promise<Product> => {
  const response = await axios.get(`${BASE_URL}/products/${id}`)
  return response.data
}
