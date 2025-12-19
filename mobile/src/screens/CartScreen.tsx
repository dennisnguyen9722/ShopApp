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
import { cartApi } from '../api/cartApi'
import { formatCurrency } from '../utils/formatCurrency'

export default function CartScreen({ navigation }: any) {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [totalPrice, setTotalPrice] = useState(0)

  // Hàm load giỏ hàng
  const fetchCart = async () => {
    try {
      const res = await cartApi.getCart()
      if (res.data && res.data.items) {
        setCartItems(res.data.items)
        calculateTotal(res.data.items)
      } else {
        setCartItems([])
        setTotalPrice(0)
      }
    } catch (error) {
      console.log('Lỗi lấy giỏ hàng:', error)
      // Nếu lỗi 401 (chưa login) thì set giỏ rỗng
      setCartItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load lại mỗi khi màn hình được focus (vào lại từ tab khác)
  useFocusEffect(
    useCallback(() => {
      fetchCart()
    }, [])
  )

  // Tính tổng tiền
  const calculateTotal = (items: any[]) => {
    const total = items.reduce((sum, item) => {
      // Giá sản phẩm * số lượng
      return sum + (item.product?.price || 0) * item.quantity
    }, 0)
    setTotalPrice(total)
  }

  // Xử lý tăng giảm số lượng
  const handleUpdateQuantity = async (item: any, newQty: number) => {
    if (newQty < 1) return // Không cho giảm dưới 1 (muốn xóa thì bấm thùng rác)

    // Update UI tạm thời cho mượt
    const oldItems = [...cartItems]
    const newItems = cartItems.map((i) =>
      i === item ? { ...i, quantity: newQty } : i
    )
    setCartItems(newItems)
    calculateTotal(newItems)

    try {
      await cartApi.updateQuantity(item.product._id, newQty, item.variants)
    } catch (error) {
      Alert.alert('Lỗi', 'Không cập nhật được số lượng')
      setCartItems(oldItems) // Revert nếu lỗi
    }
  }

  // Xử lý xóa sản phẩm
  const handleRemoveItem = async (item: any) => {
    Alert.alert('Xác nhận', 'Bạn muốn xóa sản phẩm này khỏi giỏ?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await cartApi.removeItem(
              item.product._id,
              item.variants
            )
            setCartItems(res.data.items)
            calculateTotal(res.data.items)
          } catch (error) {
            Alert.alert('Lỗi', 'Không xóa được sản phẩm')
          }
        }
      }
    ])
  }

  // Render từng dòng sản phẩm
  const renderItem = ({ item }: { item: any }) => {
    // Format hiển thị Variants (VD: Màu: Đỏ | Size: L)
    const variantText = item.variants
      ? Object.entries(item.variants)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ')
      : ''

    return (
      <View style={styles.cartItem}>
        {/* Ảnh */}
        <Image
          source={{
            uri: item.product?.image || 'https://via.placeholder.com/100'
          }}
          style={styles.itemImage}
        />

        {/* Thông tin */}
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

          {/* Bộ điều khiển số lượng */}
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

            {/* Nút xóa */}
            <TouchableOpacity onPress={() => handleRemoveItem(item)}>
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
          <Text style={styles.emptyText}>Giỏ hàng trống trơn</Text>
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
            keyExtractor={(item, index) => item._id || index.toString()}
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

          {/* Footer Thanh Toán */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalPrice}>
                {formatCurrency(totalPrice)}
              </Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn}>
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

  // Empty State
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

  // Cart Item
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
    backgroundColor: '#f9f9f9'
  },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  itemTitle: { fontSize: 14, fontWeight: '500', color: '#333' },
  itemVariant: { fontSize: 12, color: '#888', marginTop: 4 },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginTop: 4
  },

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
    borderRadius: 4
  },
  qtyBtn: { padding: 4, width: 28, alignItems: 'center' },
  qtyText: {
    paddingHorizontal: 8,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center'
  },

  // Footer
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
