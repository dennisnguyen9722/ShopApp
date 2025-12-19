// src/screens/CartScreen.tsx
import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { CartService } from '../services/CartService' // 👈 Dùng Service mới
import { formatCurrency } from '../utils/formatCurrency'

export default function CartScreen({ navigation }: any) {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [totalPrice, setTotalPrice] = useState(0)

  // Hàm load giỏ hàng
  const fetchCart = async () => {
    try {
      // Service tự lo việc lấy từ API hay lấy từ Local
      const items = await CartService.getCart()
      setCartItems(items)
      calculateTotal(items)
    } catch (error) {
      console.log('Lỗi hiển thị giỏ:', error)
      setCartItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load lại mỗi khi vào màn hình này
  useFocusEffect(
    useCallback(() => {
      fetchCart()
    }, [])
  )

  const calculateTotal = (items: any[]) => {
    const total = items.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity
    }, 0)
    setTotalPrice(total)
  }

  const handleUpdateQuantity = async (item: any, newQty: number) => {
    if (newQty < 1) return

    // Update UI ngay lập tức cho mượt (Optimistic Update)
    const oldItems = [...cartItems]
    const newItems = cartItems.map((i) =>
      i === item ? { ...i, quantity: newQty } : i
    )
    setCartItems(newItems)
    calculateTotal(newItems)

    try {
      await CartService.updateQuantity(item.product._id, newQty, item.variants)
      // Không cần fetchCart lại cũng được vì UI đã update rồi, trừ khi muốn đồng bộ chuẩn
    } catch (error) {
      Alert.alert('Lỗi', 'Không cập nhật được')
      setCartItems(oldItems) // Revert nếu lỗi
      calculateTotal(oldItems)
    }
  }

  const handleRemoveItem = async (item: any) => {
    Alert.alert('Xác nhận', 'Xóa sản phẩm này khỏi giỏ?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await CartService.removeItem(item.product._id, item.variants)
            fetchCart() // Load lại data sạch
          } catch (error) {
            console.log(error)
          }
        }
      }
    ])
  }

  const renderItem = ({ item }: { item: any }) => {
    // Format text biến thể: "Màu: Đỏ | Size: L"
    const variantText = item.variants
      ? Object.entries(item.variants)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ')
      : ''

    return (
      <View style={styles.cartItem}>
        <Image
          source={{
            uri: item.product?.image || 'https://via.placeholder.com/100'
          }}
          style={styles.itemImage}
        />

        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.product?.title}
          </Text>
          {variantText ? (
            <Text style={styles.itemVariant}>{variantText}</Text>
          ) : null}
          <Text style={styles.itemPrice}>
            {formatCurrency(item.product?.price || 0)}
          </Text>

          <View style={styles.qtyRow}>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(item, item.quantity - 1)}
                style={styles.qtyBtn}
              >
                <Ionicons name="remove" size={16} color="#333" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(item, item.quantity + 1)}
                style={styles.qtyBtn}
              >
                <Ionicons name="add" size={16} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => handleRemoveItem(item)}
              style={{ padding: 4 }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ hàng ({cartItems.length})</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#ddd" />
          <Text style={styles.emptyText}>Giỏ hàng đang trống</Text>
          <TouchableOpacity
            style={styles.shopNowBtn}
            onPress={() => navigation.navigate('HomeTab')}
          >
            <Text style={styles.shopNowText}>Đi mua sắm ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item, index) => index.toString()} // Dùng index cho chắc vì offline ID có thể fake
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true)
                  fetchCart()
                }}
              />
            }
          />

          <View style={styles.footer}>
            <View>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalPrice}>
                {formatCurrency(totalPrice)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text style={styles.checkoutText}>Thanh toán</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50
  },
  emptyText: { marginTop: 16, fontSize: 16, color: '#888' },
  shopNowBtn: {
    marginTop: 20,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25
  },
  shopNowText: { color: '#fff', fontWeight: 'bold' },

  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    resizeMode: 'cover'
  },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  itemVariant: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic'
  },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#4f46e5' },

  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 6
  },
  qtyBtn: { padding: 6, width: 32, alignItems: 'center' },
  qtyText: {
    paddingHorizontal: 8,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center'
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10
  },
  totalLabel: { fontSize: 12, color: '#666' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#ef4444' },
  checkoutBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30
  },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
})
