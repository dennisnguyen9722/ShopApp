import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { CartService } from '../services/CartService'
import { orderApi } from '../api/orderApi'
import { formatCurrency } from '../utils/formatCurrency'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function CheckoutScreen({ navigation }: any) {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('') // Thêm email vì DB yêu cầu required
  const [note, setNote] = useState('')

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    const items = await CartService.getCart()
    setCartItems(items)

    // Tính tổng tiền
    const total = items.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity,
      0
    )
    setTotalAmount(total)
  }

  const handleOrder = async () => {
    // 1. Validate Form
    if (!name.trim() || !phone.trim() || !address.trim() || !email.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng điền đầy đủ Tên, Email, SĐT và Địa chỉ.'
      )
      return
    }

    setLoading(true)

    try {
      // 2. Lấy User ID nếu đã đăng nhập (để gắn vào đơn hàng nếu có)
      // Giả sử bạn lưu user info trong AsyncStorage 'user'
      let userId = null
      const userJson = await AsyncStorage.getItem('user')
      if (userJson) {
        const user = JSON.parse(userJson)
        userId = user._id || user.id
      }

      // 3. Chuẩn bị dữ liệu chuẩn format Model Order backend
      const orderData = {
        customer: {
          name,
          email,
          phone,
          address
        },
        userId: userId, // Gửi kèm ID nếu có
        items: cartItems.map((item) => ({
          product: item.product._id,
          productName: item.product.title,
          productImage: item.product.image,
          quantity: item.quantity,
          price: item.product.price,
          // Map variants từ UI (Object) -> DB (Schema Order)
          // UI lưu: variants: { "Màu sắc": "Đỏ", "Dung lượng": "256GB" }
          // DB cần: variant: { color: "Đỏ", storage: "256GB", ... }
          variant: {
            color: item.variants?.['Màu sắc'] || item.variants?.['Color'] || '',
            storage:
              item.variants?.['Dung lượng'] || item.variants?.['Storage'] || '',
            ram: item.variants?.['RAM'] || ''
          }
        })),
        totalAmount,
        paymentMethod: 'COD',
        note
      }

      // 4. Gọi API
      await orderApi.createOrder(orderData)

      // 5. Thành công -> Xóa giỏ -> Chuyển hướng
      await CartService.clearCart()

      Alert.alert(
        'Đặt hàng thành công! 🎉',
        'Cảm ơn bạn đã mua sắm tại SuperMall.',
        [
          {
            text: 'Về trang chủ',
            onPress: () => navigation.navigate('Main', { screen: 'HomeTab' })
          }
        ]
      )
    } catch (error: any) {
      console.log('Lỗi đặt hàng:', error)
      const msg =
        error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.'
      Alert.alert('Lỗi đặt hàng', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Form Thông tin */}
        <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên (*)"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email (*)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại (*)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Địa chỉ nhận hàng (*)"
            multiline
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="Ghi chú thêm"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Tóm tắt đơn hàng */}
        <Text style={styles.sectionTitle}>Sản phẩm ({cartItems.length})</Text>
        <View style={styles.formCard}>
          {cartItems.map((item, index) => {
            // Tạo string hiển thị variant
            const variantStr = Object.values(item.variants || {}).join(', ')

            return (
              <View key={index} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.title}
                  </Text>
                  {variantStr ? (
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      Phân loại: {variantStr}
                    </Text>
                  ) : null}
                  <Text style={{ fontSize: 13, color: '#333', marginTop: 2 }}>
                    x{item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatCurrency(item.product.price * item.quantity)}
                </Text>
              </View>
            )
          })}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        {/* Phương thức thanh toán (Demo cứng) */}
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        <View style={styles.formCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="cash-outline" size={24} color="#F59E0B" />
            <Text style={{ fontSize: 14, fontWeight: '500' }}>
              Thanh toán khi nhận hàng (COD)
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnOrder, loading && { opacity: 0.7 }]}
          onPress={handleOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>ĐẶT HÀNG NGAY</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F5F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#555',
    marginLeft: 4
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 14
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12
  },
  itemName: { fontSize: 14, color: '#333', fontWeight: '500' },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#333' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#ef4444' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10
  },
  btnOrder: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
})
