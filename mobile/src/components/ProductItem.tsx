import React from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { formatCurrency } from '../utils/formatCurrency'
import { Ionicons } from '@expo/vector-icons'

interface ProductItemProps {
  product: any
  onPress: () => void
}

export default function ProductItem({ product, onPress }: ProductItemProps) {
  // Giả lập % giảm giá ngẫu nhiên cho đẹp
  const discount = Math.floor(Math.random() * 20) + 5

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Ảnh sản phẩm */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Badge giảm giá */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>-{discount}%</Text>
        </View>
      </View>

      {/* Thông tin */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          {/* Giá gốc gạch ngang */}
          <Text style={styles.oldPrice}>
            {formatCurrency(product.price * 1.2)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.rating}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={styles.ratingText}>4.8</Text>
          </View>
          <Text style={styles.sold}>Đã bán 1.2k</Text>
        </View>
      </View>

      {/* Nút cộng giỏ hàng nhanh */}
      <View style={styles.addBtn}>
        <Ionicons name="add" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12, // Bo cong nhiều hơn
    // Đổ bóng xịn (iOS + Android)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden' // Để các thành phần con bo theo
  },
  imageContainer: {
    position: 'relative'
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#f9f9f9'
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff424e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  info: {
    padding: 10
  },
  title: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
    height: 36 // Giới hạn 2 dòng
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff424e' // Màu đỏ Shopee/Tiki
  },
  oldPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 10, color: '#555' },
  sold: { fontSize: 10, color: '#888' },

  addBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#4f46e5',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
