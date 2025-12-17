import React from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native'
import { Product } from '../types'
import { Ionicons } from '@expo/vector-icons'
import { formatCurrency } from '../utils/formatCurrency'

// Lấy chiều rộng màn hình chia đôi để làm lưới 2 cột
const { width } = Dimensions.get('window')
const CARD_WIDTH = width / 2 - 24

interface Props {
  product: Product
  onPress: () => void
}

const ProductCard: React.FC<Props> = ({ product, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="contain"
        />
        {/* Nút yêu thích giả lập */}
        <TouchableOpacity style={styles.heartBtn}>
          <Ionicons name="heart-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.price}>${product.price}</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{product.rating.rate}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    // Đổ bóng nhẹ
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden'
  },
  imageContainer: {
    height: 150,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative'
  },
  image: { width: '100%', height: '100%' },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 6,
    borderRadius: 20
  },

  info: { padding: 12 },
  category: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: 'bold'
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    height: 36
  }, // Cố định chiều cao text
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  price: { fontSize: 16, fontWeight: 'bold', color: '#6C63FF' },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#FBC02D'
  }
})

export default ProductCard
