// src/types/index.ts

export interface Product {
  id: number
  title: string
  price: number
  description: string
  category: string
  image: string
  rating: {
    rate: number
    count: number
  }
}

// Định nghĩa các màn hình trong App để Navigation không báo lỗi đỏ
export type RootStackParamList = {
  Login: undefined
  Main: undefined // Chứa Tab Bar
  ProductDetail: { product: Product } // Màn hình chi tiết cần nhận vào 1 sản phẩm
  Checkout: undefined
}
