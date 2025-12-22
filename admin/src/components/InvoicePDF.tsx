/* eslint-disable jsx-a11y/alt-text */
import React from 'react'
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font
} from '@react-pdf/renderer'

// Đăng ký Font tiếng Việt (Roboto)
Font.register({
  family: 'Roboto',
  src: '/fonts/Roboto-Regular.ttf' // Đọc từ public/fonts/Roboto-Regular.ttf
})

Font.register({
  family: 'RobotoBold',
  src: '/fonts/Roboto-Bold.ttf' // Đọc từ public/fonts/Roboto-Bold.ttf
})

// --- 👇 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES) ---
interface OrderVariant {
  color?: string
  storage?: string
  ram?: string
}

interface OrderItem {
  productName: string
  quantity: number
  price: number
  variant?: OrderVariant
}

interface Customer {
  name: string
  phone: string
  address: string
  email?: string
}

// Kiểu dữ liệu cho Order được truyền vào
export interface InvoiceOrder {
  _id: string
  createdAt: string
  totalAmount: number
  customer: Customer
  items: OrderItem[]
}

interface InvoicePDFProps {
  order: InvoiceOrder
}

// --- STYLES ---
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Roboto', fontSize: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  brand: { fontSize: 24, fontFamily: 'RobotoBold', color: '#4F46E5' },
  subBrand: { fontSize: 10, color: '#666' },
  headerRight: { alignItems: 'flex-end' },

  title: {
    fontSize: 14,
    fontFamily: 'RobotoBold',
    marginTop: 15,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5
  },

  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 80, color: '#555' },
  value: { flex: 1, fontFamily: 'RobotoBold' },

  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#eee',
    borderBottomWidth: 0
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },

  col1: { flex: 3 }, // Tên SP
  col2: { flex: 1, textAlign: 'center' }, // SL
  col3: { flex: 2, textAlign: 'right' }, // Giá

  totalSection: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginTop: 5 },
  totalLabel: { width: 100, textAlign: 'right', paddingRight: 10 },
  totalValue: {
    width: 120,
    textAlign: 'right',
    fontFamily: 'RobotoBold',
    fontSize: 14,
    color: '#EF4444'
  },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#999',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10
  }
})

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    amount
  )

export const InvoicePDF = ({ order }: InvoicePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>SUPERMALL</Text>
          <Text style={styles.subBrand}>Hóa đơn điện tử</Text>
        </View>
        <View style={styles.headerRight}>
          <Text>Mã đơn: #{order._id.slice(-6).toUpperCase()}</Text>
          <Text>
            Ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      {/* Thông tin khách hàng */}
      <View>
        <Text style={styles.title}>Thông tin giao hàng</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Khách hàng:</Text>
          <Text style={styles.value}>{order.customer.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Điện thoại:</Text>
          <Text style={styles.value}>{order.customer.phone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Địa chỉ:</Text>
          <Text style={styles.value}>{order.customer.address}</Text>
        </View>
      </View>

      {/* Bảng sản phẩm */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Sản phẩm</Text>
          <Text style={styles.col2}>SL</Text>
          <Text style={styles.col3}>Thành tiền</Text>
        </View>
        {order.items.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.col1}>
              <Text>{item.productName}</Text>
              <Text style={{ fontSize: 10, color: '#777' }}>
                {item.variant?.color ? item.variant.color : ''}{' '}
                {item.variant?.storage ? item.variant.storage : ''}
              </Text>
            </View>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>
              {formatCurrency(item.price * item.quantity)}
            </Text>
          </View>
        ))}
      </View>

      {/* Tổng tiền */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(order.totalAmount)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Cảm ơn quý khách đã mua hàng tại SuperMall. Vui lòng kiểm tra kỹ hàng
        hóa trước khi nhận.
      </Text>
    </Page>
  </Document>
)
