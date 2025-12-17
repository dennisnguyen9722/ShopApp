/**
 * Hàm format số USD sang VND
 * Ví dụ: 10 (USD) -> "250.000 ₫"
 */
export const formatCurrency = (amount: number): string => {
  // Giả định tỷ giá: 1 USD = 25.000 VND
  const EXCHANGE_RATE = 25000

  // Tính ra tiền Việt
  const vndPrice = amount * EXCHANGE_RATE

  // Format theo chuẩn Việt Nam (dấu chấm phân cách hàng nghìn)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(vndPrice)
}
